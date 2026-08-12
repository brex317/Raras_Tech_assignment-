using Application.DTOs.Assets;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services;

public class AssetDocumentService : IAssetDocumentService
{
    private readonly IRepository<AssetDocument> _documentRepository;
    private readonly IRepository<Asset> _assetRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain"
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public AssetDocumentService(
        IRepository<AssetDocument> documentRepository,
        IRepository<Asset> assetRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork)
    {
        _documentRepository = documentRepository;
        _assetRepository = assetRepository;
        _fileStorageService = fileStorageService;
        _unitOfWork = unitOfWork;
    }

    public async Task<AssetDocumentDto> UploadDocumentAsync(
        Guid assetId, string fileName, string contentType, long fileSize,
        Stream fileStream, DocumentType documentType, Guid userId)
    {
        // Validate asset exists
        var asset = await _assetRepository.GetByIdAsync(assetId);
        if (asset == null)
            throw new KeyNotFoundException($"Asset with ID {assetId} not found.");

        // Validate file type
        if (!AllowedContentTypes.Contains(contentType))
            throw new ArgumentException($"File type '{contentType}' is not supported. Allowed types: PDF, JPEG, PNG, GIF, WebP, Word, Excel, Text.");

        // Validate file size
        if (fileSize > MaxFileSizeBytes)
            throw new ArgumentException($"File size exceeds the maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB.");

        if (fileSize == 0)
            throw new ArgumentException("File is empty.");

        // Save file to storage
        var storagePath = await _fileStorageService.SaveFileAsync(fileStream, fileName);

        var document = new AssetDocument
        {
            Id = Guid.NewGuid(),
            FileName = fileName,
            ContentType = contentType,
            FileSizeBytes = fileSize,
            StoragePath = storagePath,
            DocumentType = documentType,
            UploadedAt = DateTime.UtcNow,
            UploadedByUserId = userId,
            AssetId = assetId
        };

        await _documentRepository.AddAsync(document);

        // Add history entry
        asset.History.Add(new AssetHistory
        {
            Id = Guid.NewGuid(),
            ChangeType = AssetChangeType.DocumentAdded,
            NewValue = $"Document '{fileName}' uploaded ({documentType})",
            Timestamp = DateTime.UtcNow,
            AssetId = assetId,
            ChangedByUserId = userId
        });

        await _unitOfWork.SaveChangesAsync();

        return new AssetDocumentDto
        {
            Id = document.Id,
            FileName = document.FileName,
            ContentType = document.ContentType,
            FileSizeBytes = document.FileSizeBytes,
            DocumentType = document.DocumentType.ToString(),
            UploadedAt = document.UploadedAt,
            UploadedByUserName = string.Empty
        };
    }

    public async Task<(Stream FileStream, string ContentType, string FileName)> DownloadDocumentAsync(Guid documentId)
    {
        var document = await _documentRepository.GetByIdAsync(documentId);
        if (document == null)
            throw new KeyNotFoundException($"Document with ID {documentId} not found.");

        var fileStream = await _fileStorageService.GetFileAsync(document.StoragePath);
        return (fileStream, document.ContentType, document.FileName);
    }

    public async Task DeleteDocumentAsync(Guid documentId, Guid userId)
    {
        var document = await _documentRepository.GetByIdAsync(documentId);
        if (document == null)
            throw new KeyNotFoundException($"Document with ID {documentId} not found.");

        // Delete from storage
        await _fileStorageService.DeleteFileAsync(document.StoragePath);

        // Add history entry
        var asset = await _assetRepository.GetByIdAsync(document.AssetId);
        if (asset != null)
        {
            asset.History.Add(new AssetHistory
            {
                Id = Guid.NewGuid(),
                ChangeType = AssetChangeType.DocumentRemoved,
                OldValue = $"Document '{document.FileName}' removed",
                Timestamp = DateTime.UtcNow,
                AssetId = document.AssetId,
                ChangedByUserId = userId
            });
        }

        _documentRepository.Delete(document);
        await _unitOfWork.SaveChangesAsync();
    }
}
