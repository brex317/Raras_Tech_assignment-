namespace Domain.Entities;

public class AssetHistory
{
    public Guid Id { get; set; }
    public AssetChangeType ChangeType { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Guid AssetId { get; set; }
    public Asset Asset { get; set; } = null!;

    public Guid ChangedByUserId { get; set; }
    public User ChangedByUser { get; set; } = null!;
}