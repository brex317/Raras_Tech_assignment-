using Application.DTOs.Assets;
using Domain.Entities;

namespace Application.Interfaces;

public interface IAssetDocumentService
{
    Task<AssetDocumentDto> UploadDocumentAsync(Guid assetId, string fileName, string contentType, long fileSize, Stream fileStream, DocumentType documentType, Guid userId);
    Task<(Stream FileStream, string ContentType, string FileName)> DownloadDocumentAsync(Guid documentId);
    Task DeleteDocumentAsync(Guid documentId, Guid userId);
}
