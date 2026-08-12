using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Data;

public static class SeedData
{
    // Fixed GUIDs for seeding consistency
    private static readonly Guid AdminRoleId = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
    private static readonly Guid ManagerRoleId = Guid.Parse("b2c3d4e5-f6a7-8901-bcde-f12345678901");
    private static readonly Guid ViewerRoleId = Guid.Parse("c3d4e5f6-a7b8-9012-cdef-123456789012");

    private static readonly Guid AdminUserId = Guid.Parse("d4e5f6a7-b8c9-0123-defa-234567890123");
    private static readonly Guid ManagerUserId = Guid.Parse("e5f6a7b8-c9d0-1234-efab-345678901234");
    private static readonly Guid ViewerUserId = Guid.Parse("f6a7b8c9-d0e1-2345-fabc-456789012345");

    private static readonly Guid RootOrgId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly Guid EngOrgId = Guid.Parse("10000000-0000-0000-0000-000000000002");
    private static readonly Guid OpsOrgId = Guid.Parse("10000000-0000-0000-0000-000000000003");
    private static readonly Guid FinOrgId = Guid.Parse("10000000-0000-0000-0000-000000000004");
    private static readonly Guid DevTeamOrgId = Guid.Parse("10000000-0000-0000-0000-000000000005");
    private static readonly Guid QaTeamOrgId = Guid.Parse("10000000-0000-0000-0000-000000000006");

    private static readonly Guid HardwareCatId = Guid.Parse("20000000-0000-0000-0000-000000000001");
    private static readonly Guid SoftwareCatId = Guid.Parse("20000000-0000-0000-0000-000000000002");
    private static readonly Guid FurnitureCatId = Guid.Parse("20000000-0000-0000-0000-000000000003");
    private static readonly Guid VehicleCatId = Guid.Parse("20000000-0000-0000-0000-000000000004");
    private static readonly Guid EquipmentCatId = Guid.Parse("20000000-0000-0000-0000-000000000005");

    private static readonly Guid DellLatitudeAssetId = Guid.Parse("30000000-0000-0000-0000-000000000001");

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await context.Database.MigrateAsync();

        if (await context.Roles.AnyAsync())
            return; // Already seeded

        // Roles
        var roles = new[]
        {
            new Role { Id = AdminRoleId, Name = "Administrator" },
            new Role { Id = ManagerRoleId, Name = "Manager" },
            new Role { Id = ViewerRoleId, Name = "Viewer" }
        };
        context.Roles.AddRange(roles);

        // Organization Units (hierarchy)
        var orgUnits = new[]
        {
            new OrganizationUnit { Id = RootOrgId, Name = "RARAS Technologies HQ", Code = "HQ", ParentId = null, Path = $"/{RootOrgId}/", Level = 0 },
            new OrganizationUnit { Id = EngOrgId, Name = "Engineering Department", Code = "ENG", ParentId = RootOrgId, Path = $"/{RootOrgId}/{EngOrgId}/", Level = 1 },
            new OrganizationUnit { Id = OpsOrgId, Name = "Operations Department", Code = "OPS", ParentId = RootOrgId, Path = $"/{RootOrgId}/{OpsOrgId}/", Level = 1 },
            new OrganizationUnit { Id = FinOrgId, Name = "Finance Department", Code = "FIN", ParentId = RootOrgId, Path = $"/{RootOrgId}/{FinOrgId}/", Level = 1 },
            new OrganizationUnit { Id = DevTeamOrgId, Name = "Development Team", Code = "DEV", ParentId = EngOrgId, Path = $"/{RootOrgId}/{EngOrgId}/{DevTeamOrgId}/", Level = 2 },
            new OrganizationUnit { Id = QaTeamOrgId, Name = "QA Team", Code = "QA", ParentId = EngOrgId, Path = $"/{RootOrgId}/{EngOrgId}/{QaTeamOrgId}/", Level = 2 },
        };
        context.OrganizationUnits.AddRange(orgUnits);

        // Users
        var users = new[]
        {
            new User
            {
                Id = AdminUserId,
                FullName = "Admin User",
                Email = "admin@raras.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                RoleId = AdminRoleId,
                OrganizationUnitId = RootOrgId
            },
            new User
            {
                Id = ManagerUserId,
                FullName = "Manager User",
                Email = "manager@raras.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
                RoleId = ManagerRoleId,
                OrganizationUnitId = EngOrgId
            },
            new User
            {
                Id = ViewerUserId,
                FullName = "Viewer User",
                Email = "viewer@raras.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Viewer@123"),
                RoleId = ViewerRoleId,
                OrganizationUnitId = DevTeamOrgId
            }
        };
        context.Users.AddRange(users);

        // Asset Categories
        var categories = new[]
        {
            new AssetCategory { Id = HardwareCatId, Name = "Hardware", Description = "Computer hardware and peripherals" },
            new AssetCategory { Id = SoftwareCatId, Name = "Software", Description = "Software licenses and subscriptions" },
            new AssetCategory { Id = FurnitureCatId, Name = "Furniture", Description = "Office furniture and fixtures" },
            new AssetCategory { Id = VehicleCatId, Name = "Vehicles", Description = "Company vehicles" },
            new AssetCategory { Id = EquipmentCatId, Name = "Equipment", Description = "General office and industrial equipment" },
        };
        context.AssetCategories.AddRange(categories);

        // Sample Assets
        var assets = new[]
        {
            new Asset
            {
                Id = DellLatitudeAssetId,
                AssetTag = "AST-00001",
                Name = "Dell Latitude 5420",
                Description = "High-performance enterprise laptop workstation for development and engineering teams",
                Status = AssetStatus.Active,
                SerialNumber = "DL5420-2024-001",
                PurchaseDate = new DateTime(2024, 3, 15, 0, 0, 0, DateTimeKind.Utc),
                PurchaseCost = 1450.00m,
                WarrantyExpiryDate = new DateTime(2027, 3, 15, 0, 0, 0, DateTimeKind.Utc),
                CategoryId = HardwareCatId,
                OrganizationUnitId = DevTeamOrgId,
                CreatedAt = DateTime.UtcNow
            },
            new Asset
            {
                Id = Guid.NewGuid(),
                AssetTag = "AST-00002",
                Name = "Microsoft Office 365 License",
                Description = "Enterprise E3 license",
                Status = AssetStatus.Active,
                PurchaseDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                PurchaseCost = 432.00m,
                CategoryId = SoftwareCatId,
                OrganizationUnitId = RootOrgId,
                CreatedAt = DateTime.UtcNow
            },
            new Asset
            {
                Id = Guid.NewGuid(),
                AssetTag = "AST-00003",
                Name = "Herman Miller Aeron Chair",
                Description = "Ergonomic office chair",
                Status = AssetStatus.Active,
                SerialNumber = "HMA-2024-042",
                PurchaseDate = new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                PurchaseCost = 1395.00m,
                WarrantyExpiryDate = new DateTime(2036, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                CategoryId = FurnitureCatId,
                OrganizationUnitId = EngOrgId,
                CreatedAt = DateTime.UtcNow
            },
            new Asset
            {
                Id = Guid.NewGuid(),
                AssetTag = "AST-00004",
                Name = "HP LaserJet Pro MFP",
                Description = "Multifunction printer for Operations",
                Status = AssetStatus.Active,
                SerialNumber = "HPLJ-2023-789",
                PurchaseDate = new DateTime(2023, 11, 20, 0, 0, 0, DateTimeKind.Utc),
                PurchaseCost = 549.99m,
                WarrantyExpiryDate = new DateTime(2025, 11, 20, 0, 0, 0, DateTimeKind.Utc),
                CategoryId = EquipmentCatId,
                OrganizationUnitId = OpsOrgId,
                CreatedAt = DateTime.UtcNow
            },
        };
        context.Assets.AddRange(assets);

        // Add creation history for each asset
        foreach (var asset in assets)
        {
            context.AssetHistories.Add(new AssetHistory
            {
                Id = Guid.NewGuid(),
                ChangeType = AssetChangeType.Created,
                NewValue = $"Asset '{asset.Name}' created",
                Timestamp = asset.CreatedAt,
                AssetId = asset.Id,
                ChangedByUserId = AdminUserId
            });
        }

        // Seed sample documents for Dell Latitude 5420 across all 5 document categories
        var documents = new[]
        {
            new AssetDocument
            {
                Id = Guid.Parse("40000000-0000-0000-0000-000000000001"),
                FileName = "dell-latitude-invoice.pdf",
                ContentType = "application/pdf",
                FileSizeBytes = 245760,
                StoragePath = "dell-latitude-invoice.pdf",
                DocumentType = DocumentType.Invoice,
                UploadedAt = new DateTime(2024, 3, 15, 10, 0, 0, DateTimeKind.Utc),
                UploadedByUserId = AdminUserId,
                AssetId = DellLatitudeAssetId
            },
            new AssetDocument
            {
                Id = Guid.Parse("40000000-0000-0000-0000-000000000002"),
                FileName = "dell-latitude-warranty.pdf",
                ContentType = "application/pdf",
                FileSizeBytes = 184320,
                StoragePath = "dell-latitude-warranty.pdf",
                DocumentType = DocumentType.Warranty,
                UploadedAt = new DateTime(2024, 3, 15, 10, 5, 0, DateTimeKind.Utc),
                UploadedByUserId = AdminUserId,
                AssetId = DellLatitudeAssetId
            },
            new AssetDocument
            {
                Id = Guid.Parse("40000000-0000-0000-0000-000000000003"),
                FileName = "dell-latitude.jpg",
                ContentType = "image/jpeg",
                FileSizeBytes = 512000,
                StoragePath = "dell-latitude.jpg",
                DocumentType = DocumentType.Image,
                UploadedAt = new DateTime(2024, 3, 15, 10, 10, 0, DateTimeKind.Utc),
                UploadedByUserId = AdminUserId,
                AssetId = DellLatitudeAssetId
            },
            new AssetDocument
            {
                Id = Guid.Parse("40000000-0000-0000-0000-000000000004"),
                FileName = "dell-latitude-manual.pdf",
                ContentType = "application/pdf",
                FileSizeBytes = 1048576,
                StoragePath = "dell-latitude-manual.pdf",
                DocumentType = DocumentType.Manual,
                UploadedAt = new DateTime(2024, 3, 15, 10, 15, 0, DateTimeKind.Utc),
                UploadedByUserId = AdminUserId,
                AssetId = DellLatitudeAssetId
            },
            new AssetDocument
            {
                Id = Guid.Parse("40000000-0000-0000-0000-000000000005"),
                FileName = "dell-latitude-certificate.pdf",
                ContentType = "application/pdf",
                FileSizeBytes = 307200,
                StoragePath = "dell-latitude-certificate.pdf",
                DocumentType = DocumentType.Certificate,
                UploadedAt = new DateTime(2024, 3, 15, 10, 20, 0, DateTimeKind.Utc),
                UploadedByUserId = AdminUserId,
                AssetId = DellLatitudeAssetId
            }
        };
        context.AssetDocuments.AddRange(documents);

        await context.SaveChangesAsync();
    }
}
