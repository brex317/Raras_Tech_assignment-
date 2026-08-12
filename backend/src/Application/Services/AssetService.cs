using Application.DTOs.Assets;
using Application.DTOs.Common;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services;

public class AssetService : IAssetService
{
    private readonly IRepository<Asset> _assetRepository;
    private readonly IRepository<OrganizationUnit> _orgUnitRepository;
    private readonly IRepository<AssetCategory> _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AssetService(
        IRepository<Asset> assetRepository,
        IRepository<OrganizationUnit> orgUnitRepository,
        IRepository<AssetCategory> categoryRepository,
        IUnitOfWork unitOfWork)
    {
        _assetRepository = assetRepository;
        _orgUnitRepository = orgUnitRepository;
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<AssetDto>> GetAssetsAsync(int page, int pageSize, string? search, Guid? categoryId, string? status)
    {
        var allAssets = await _assetRepository.GetAllAsync();
        var query = allAssets.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(a =>
                a.Name.ToLower().Contains(searchLower) ||
                a.AssetTag.ToLower().Contains(searchLower) ||
                (a.SerialNumber != null && a.SerialNumber.ToLower().Contains(searchLower)));
        }

        if (categoryId.HasValue)
            query = query.Where(a => a.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<AssetStatus>(status, true, out var statusEnum))
            query = query.Where(a => a.Status == statusEnum);

        var totalCount = query.Count();
        var items = query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => MapToDto(a))
            .ToList();

        return new PagedResult<AssetDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AssetDetailDto> GetAssetByIdAsync(Guid id)
    {
        var asset = await _assetRepository.GetByIdAsync(id);
        if (asset == null)
            throw new KeyNotFoundException($"Asset with ID {id} not found.");

        return new AssetDetailDto
        {
            Id = asset.Id,
            AssetTag = asset.AssetTag,
            Name = asset.Name,
            Description = asset.Description,
            Status = asset.Status.ToString(),
            SerialNumber = asset.SerialNumber,
            PurchaseDate = asset.PurchaseDate,
            PurchaseCost = asset.PurchaseCost,
            WarrantyExpiryDate = asset.WarrantyExpiryDate,
            CreatedAt = asset.CreatedAt,
            UpdatedAt = asset.UpdatedAt,
            CategoryId = asset.CategoryId,
            CategoryName = asset.Category?.Name ?? string.Empty,
            OrganizationUnitId = asset.OrganizationUnitId,
            OrganizationUnitName = asset.OrganizationUnit?.Name ?? string.Empty,
            DocumentCount = asset.Documents?.Count ?? 0,
            History = asset.History?.OrderByDescending(h => h.Timestamp).Select(h => new AssetHistoryDto
            {
                Id = h.Id,
                ChangeType = h.ChangeType.ToString(),
                OldValue = h.OldValue,
                NewValue = h.NewValue,
                Timestamp = h.Timestamp,
                ChangedByUserName = h.ChangedByUser?.FullName ?? string.Empty
            }).ToList() ?? new List<AssetHistoryDto>(),
            Documents = asset.Documents?.Select(d => new AssetDocumentDto
            {
                Id = d.Id,
                FileName = d.FileName,
                ContentType = d.ContentType,
                FileSizeBytes = d.FileSizeBytes,
                DocumentType = d.DocumentType.ToString(),
                UploadedAt = d.UploadedAt,
                UploadedByUserName = d.UploadedByUser?.FullName ?? string.Empty
            }).ToList() ?? new List<AssetDocumentDto>()
        };
    }

    public async Task<AssetDto> CreateAssetAsync(CreateAssetRequest request, Guid userId)
    {
        // Validate org unit exists and is active
        var orgUnit = await _orgUnitRepository.GetByIdAsync(request.OrganizationUnitId);
        if (orgUnit == null)
            throw new ArgumentException("Organization unit not found.");
        if (!orgUnit.IsActive)
            throw new ArgumentException("Cannot assign asset to an inactive organization unit.");

        // Validate category exists
        var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
        if (category == null)
            throw new ArgumentException("Asset category not found.");

        // Generate asset tag
        var count = await _assetRepository.CountAsync();
        var assetTag = $"AST-{(count + 1):D5}";

        var asset = new Asset
        {
            Id = Guid.NewGuid(),
            AssetTag = assetTag,
            Name = request.Name,
            Description = request.Description,
            Status = AssetStatus.Active,
            SerialNumber = request.SerialNumber,
            PurchaseDate = request.PurchaseDate,
            PurchaseCost = request.PurchaseCost,
            WarrantyExpiryDate = request.WarrantyExpiryDate,
            CategoryId = request.CategoryId,
            OrganizationUnitId = request.OrganizationUnitId,
            CreatedAt = DateTime.UtcNow
        };

        await _assetRepository.AddAsync(asset);

        // Add creation history
        asset.History.Add(new AssetHistory
        {
            Id = Guid.NewGuid(),
            ChangeType = AssetChangeType.Created,
            NewValue = $"Asset '{asset.Name}' created and assigned to '{orgUnit.Name}'",
            Timestamp = DateTime.UtcNow,
            AssetId = asset.Id,
            ChangedByUserId = userId
        });

        await _unitOfWork.SaveChangesAsync();

        asset.Category = category;
        asset.OrganizationUnit = orgUnit;
        return MapToDto(asset);
    }

    public async Task<AssetDto> UpdateAssetAsync(Guid id, UpdateAssetRequest request, Guid userId)
    {
        var asset = await _assetRepository.GetByIdAsync(id);
        if (asset == null)
            throw new KeyNotFoundException($"Asset with ID {id} not found.");

        // Validate org unit
        var orgUnit = await _orgUnitRepository.GetByIdAsync(request.OrganizationUnitId);
        if (orgUnit == null)
            throw new ArgumentException("Organization unit not found.");
        if (!orgUnit.IsActive)
            throw new ArgumentException("Cannot assign asset to an inactive organization unit.");

        // Validate category
        var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
        if (category == null)
            throw new ArgumentException("Asset category not found.");

        // Track changes for history
        var changes = new List<string>();

        if (asset.Name != request.Name)
            changes.Add($"Name: '{asset.Name}' → '{request.Name}'");
        if (asset.Status != request.Status)
        {
            asset.History.Add(new AssetHistory
            {
                Id = Guid.NewGuid(),
                ChangeType = AssetChangeType.StatusChanged,
                OldValue = asset.Status.ToString(),
                NewValue = request.Status.ToString(),
                Timestamp = DateTime.UtcNow,
                AssetId = asset.Id,
                ChangedByUserId = userId
            });
        }
        if (asset.OrganizationUnitId != request.OrganizationUnitId)
        {
            asset.History.Add(new AssetHistory
            {
                Id = Guid.NewGuid(),
                ChangeType = AssetChangeType.Reassigned,
                OldValue = asset.OrganizationUnit?.Name ?? asset.OrganizationUnitId.ToString(),
                NewValue = orgUnit.Name,
                Timestamp = DateTime.UtcNow,
                AssetId = asset.Id,
                ChangedByUserId = userId
            });
        }

        // Apply updates
        asset.Name = request.Name;
        asset.Description = request.Description;
        asset.Status = request.Status;
        asset.SerialNumber = request.SerialNumber;
        asset.PurchaseDate = request.PurchaseDate;
        asset.PurchaseCost = request.PurchaseCost;
        asset.WarrantyExpiryDate = request.WarrantyExpiryDate;
        asset.CategoryId = request.CategoryId;
        asset.OrganizationUnitId = request.OrganizationUnitId;
        asset.UpdatedAt = DateTime.UtcNow;

        if (changes.Count > 0)
        {
            asset.History.Add(new AssetHistory
            {
                Id = Guid.NewGuid(),
                ChangeType = AssetChangeType.Updated,
                NewValue = string.Join("; ", changes),
                Timestamp = DateTime.UtcNow,
                AssetId = asset.Id,
                ChangedByUserId = userId
            });
        }

        _assetRepository.Update(asset);
        await _unitOfWork.SaveChangesAsync();

        asset.Category = category;
        asset.OrganizationUnit = orgUnit;
        return MapToDto(asset);
    }

    public async Task<AssetDto> AssignAssetAsync(Guid id, AssignAssetRequest request, Guid userId)
    {
        var asset = await _assetRepository.GetByIdAsync(id);
        if (asset == null)
            throw new KeyNotFoundException($"Asset with ID {id} not found.");

        var orgUnit = await _orgUnitRepository.GetByIdAsync(request.OrganizationUnitId);
        if (orgUnit == null)
            throw new ArgumentException("Organization unit not found.");
        if (!orgUnit.IsActive)
            throw new ArgumentException("Cannot assign asset to an inactive organization unit.");

        var oldOrgUnitName = asset.OrganizationUnit?.Name ?? "Unknown";

        asset.History.Add(new AssetHistory
        {
            Id = Guid.NewGuid(),
            ChangeType = AssetChangeType.Reassigned,
            OldValue = oldOrgUnitName,
            NewValue = orgUnit.Name,
            Timestamp = DateTime.UtcNow,
            AssetId = asset.Id,
            ChangedByUserId = userId
        });

        asset.OrganizationUnitId = request.OrganizationUnitId;
        asset.UpdatedAt = DateTime.UtcNow;

        _assetRepository.Update(asset);
        await _unitOfWork.SaveChangesAsync();

        asset.OrganizationUnit = orgUnit;
        return MapToDto(asset);
    }

    private static AssetDto MapToDto(Asset asset)
    {
        return new AssetDto
        {
            Id = asset.Id,
            AssetTag = asset.AssetTag,
            Name = asset.Name,
            Description = asset.Description,
            Status = asset.Status.ToString(),
            SerialNumber = asset.SerialNumber,
            PurchaseDate = asset.PurchaseDate,
            PurchaseCost = asset.PurchaseCost,
            WarrantyExpiryDate = asset.WarrantyExpiryDate,
            CreatedAt = asset.CreatedAt,
            UpdatedAt = asset.UpdatedAt,
            CategoryId = asset.CategoryId,
            CategoryName = asset.Category?.Name ?? string.Empty,
            OrganizationUnitId = asset.OrganizationUnitId,
            OrganizationUnitName = asset.OrganizationUnit?.Name ?? string.Empty,
            DocumentCount = asset.Documents?.Count ?? 0
        };
    }
}
