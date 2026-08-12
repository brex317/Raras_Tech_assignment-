using Application.DTOs.OrganizationUnits;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services;

public class OrganizationUnitService : IOrganizationUnitService
{
    private readonly IRepository<OrganizationUnit> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public OrganizationUnitService(IRepository<OrganizationUnit> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<OrganizationUnitTreeDto>> GetTreeAsync()
    {
        var allUnits = await _repository.GetAllAsync();
        var lookup = allUnits.ToLookup(u => u.ParentId);

        return BuildTree(lookup, null);
    }

    public async Task<List<OrganizationUnitDto>> GetAllAsync()
    {
        var units = await _repository.GetAllAsync();
        return units.Select(MapToDto).ToList();
    }

    public async Task<OrganizationUnitDto> GetByIdAsync(Guid id)
    {
        var unit = await _repository.GetByIdAsync(id);
        if (unit == null)
            throw new KeyNotFoundException($"Organization unit with ID {id} not found.");

        return MapToDto(unit);
    }

    public async Task<OrganizationUnitDto> CreateAsync(CreateOrganizationUnitRequest request)
    {
        // Validate unique code
        var existing = await _repository.FindAsync(u => u.Code == request.Code);
        if (existing.Any())
            throw new ArgumentException($"An organization unit with code '{request.Code}' already exists.");

        var unit = new OrganizationUnit
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Code = request.Code,
            IsActive = true
        };

        if (request.ParentId.HasValue)
        {
            var parent = await _repository.GetByIdAsync(request.ParentId.Value);
            if (parent == null)
                throw new ArgumentException("Parent organization unit not found.");
            if (!parent.IsActive)
                throw new ArgumentException("Cannot create a child under an inactive organization unit.");

            unit.ParentId = parent.Id;
            unit.Path = $"{parent.Path}{unit.Id}/";
            unit.Level = parent.Level + 1;
        }
        else
        {
            // Root unit - check if one already exists
            var roots = await _repository.FindAsync(u => u.ParentId == null);
            if (roots.Any())
                throw new ArgumentException("A root organization unit already exists. Each unit must have a parent except the root.");

            unit.Path = $"/{unit.Id}/";
            unit.Level = 0;
        }

        await _repository.AddAsync(unit);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(unit);
    }

    public async Task<OrganizationUnitDto> UpdateAsync(Guid id, UpdateOrganizationUnitRequest request)
    {
        var unit = await _repository.GetByIdAsync(id);
        if (unit == null)
            throw new KeyNotFoundException($"Organization unit with ID {id} not found.");

        // Validate unique code (excluding self)
        var existingWithCode = await _repository.FindAsync(u => u.Code == request.Code && u.Id != id);
        if (existingWithCode.Any())
            throw new ArgumentException($"An organization unit with code '{request.Code}' already exists.");

        // Validate parent change
        if (request.ParentId != unit.ParentId)
        {
            if (request.ParentId.HasValue)
            {
                // Prevent setting self as parent
                if (request.ParentId.Value == id)
                    throw new ArgumentException("An organization unit cannot be its own parent.");

                var newParent = await _repository.GetByIdAsync(request.ParentId.Value);
                if (newParent == null)
                    throw new ArgumentException("Parent organization unit not found.");

                // Prevent circular hierarchy: check if the new parent is a descendant of this unit
                if (newParent.Path.Contains($"/{id}/"))
                    throw new ArgumentException("Cannot set a descendant as the parent. This would create a circular hierarchy.");

                unit.ParentId = newParent.Id;
                unit.Path = $"{newParent.Path}{unit.Id}/";
                unit.Level = newParent.Level + 1;

                // Update all descendant paths
                await UpdateDescendantPathsAsync(unit);
            }
            else
            {
                // Trying to make it root - check if root already exists (and it's not this unit)
                var roots = await _repository.FindAsync(u => u.ParentId == null && u.Id != id);
                if (roots.Any())
                    throw new ArgumentException("A root organization unit already exists.");

                unit.ParentId = null;
                unit.Path = $"/{unit.Id}/";
                unit.Level = 0;

                await UpdateDescendantPathsAsync(unit);
            }
        }

        unit.Name = request.Name;
        unit.Code = request.Code;
        unit.IsActive = request.IsActive;

        _repository.Update(unit);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(unit);
    }

    private async Task UpdateDescendantPathsAsync(OrganizationUnit parent)
    {
        var allUnits = await _repository.GetAllAsync();
        var children = allUnits.Where(u => u.ParentId == parent.Id).ToList();

        foreach (var child in children)
        {
            child.Path = $"{parent.Path}{child.Id}/";
            child.Level = parent.Level + 1;
            _repository.Update(child);
            await UpdateDescendantPathsAsync(child);
        }
    }

    private List<OrganizationUnitTreeDto> BuildTree(ILookup<Guid?, OrganizationUnit> lookup, Guid? parentId)
    {
        return lookup[parentId]
            .OrderBy(u => u.Name)
            .Select(u => new OrganizationUnitTreeDto
            {
                Id = u.Id,
                Name = u.Name,
                Code = u.Code,
                IsActive = u.IsActive,
                Level = u.Level,
                AssetCount = u.Assets?.Count ?? 0,
                Children = BuildTree(lookup, u.Id)
            })
            .ToList();
    }

    private static OrganizationUnitDto MapToDto(OrganizationUnit unit)
    {
        return new OrganizationUnitDto
        {
            Id = unit.Id,
            Name = unit.Name,
            Code = unit.Code,
            IsActive = unit.IsActive,
            ParentId = unit.ParentId,
            ParentName = unit.Parent?.Name,
            Level = unit.Level,
            AssetCount = unit.Assets?.Count ?? 0
        };
    }
}
