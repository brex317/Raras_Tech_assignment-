namespace Domain.Entities;

public class Asset
{
    public Guid Id { get; set; }
    public string AssetTag { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AssetStatus Status { get; set; } = AssetStatus.Active;
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? PurchaseCost { get; set; }
    public DateTime? WarrantyExpiryDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Guid CategoryId { get; set; }
    public AssetCategory Category { get; set; } = null!;

    public Guid OrganizationUnitId { get; set; }
    public OrganizationUnit OrganizationUnit { get; set; } = null!;

    public ICollection<AssetDocument> Documents { get; set; } = new List<AssetDocument>();
    public ICollection<AssetHistory> History { get; set; } = new List<AssetHistory>();
}