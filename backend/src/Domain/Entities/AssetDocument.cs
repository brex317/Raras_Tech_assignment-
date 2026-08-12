namespace Domain.Entities;

public class AssetDocument
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public DocumentType DocumentType { get; set; } = DocumentType.Other;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public Guid UploadedByUserId { get; set; }
    public User UploadedByUser { get; set; } = null!;

    public Guid AssetId { get; set; }
    public Asset Asset { get; set; } = null!;
}