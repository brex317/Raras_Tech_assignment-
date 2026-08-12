using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<AssetCategory> AssetCategories => Set<AssetCategory>();
    public DbSet<AssetDocument> AssetDocuments => Set<AssetDocument>();
    public DbSet<AssetHistory> AssetHistories => Set<AssetHistory>();
    public DbSet<OrganizationUnit> OrganizationUnits => Set<OrganizationUnit>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Role
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(200).IsRequired();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.HasIndex(e => e.Email).IsUnique();

            entity.HasOne(e => e.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.OrganizationUnit)
                .WithMany(o => o.Users)
                .HasForeignKey(e => e.OrganizationUnitId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // OrganizationUnit
        modelBuilder.Entity<OrganizationUnit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Code).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Path).HasMaxLength(1000);
            entity.HasIndex(e => e.Code).IsUnique();

            entity.HasOne(e => e.Parent)
                .WithMany(e => e.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetCategory
        modelBuilder.Entity<AssetCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Asset
        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AssetTag).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.SerialNumber).HasMaxLength(100);
            entity.Property(e => e.PurchaseCost).HasPrecision(18, 2);
            entity.HasIndex(e => e.AssetTag).IsUnique();

            entity.HasOne(e => e.Category)
                .WithMany(c => c.Assets)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.OrganizationUnit)
                .WithMany(o => o.Assets)
                .HasForeignKey(e => e.OrganizationUnitId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetDocument
        modelBuilder.Entity<AssetDocument>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.StoragePath).HasMaxLength(500).IsRequired();

            entity.HasOne(e => e.Asset)
                .WithMany(a => a.Documents)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.UploadedByUser)
                .WithMany()
                .HasForeignKey(e => e.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AssetHistory
        modelBuilder.Entity<AssetHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OldValue).HasMaxLength(500);
            entity.Property(e => e.NewValue).HasMaxLength(500);

            entity.HasOne(e => e.Asset)
                .WithMany(a => a.History)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ChangedByUser)
                .WithMany()
                .HasForeignKey(e => e.ChangedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
