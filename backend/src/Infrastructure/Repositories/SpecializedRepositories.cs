using System.Linq.Expressions;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class UserRepository : Repository<User>
{
    public UserRepository(AppDbContext context) : base(context) { }

    public override async Task<User?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(u => u.Role)
            .Include(u => u.OrganizationUnit)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public override async Task<IReadOnlyList<User>> GetAllAsync()
    {
        return await _dbSet
            .Include(u => u.Role)
            .Include(u => u.OrganizationUnit)
            .ToListAsync();
    }

    public override async Task<IReadOnlyList<User>> FindAsync(Expression<Func<User, bool>> predicate)
    {
        return await _dbSet
            .Include(u => u.Role)
            .Include(u => u.OrganizationUnit)
            .Where(predicate)
            .ToListAsync();
    }
}

public class AssetRepository : Repository<Asset>
{
    public AssetRepository(AppDbContext context) : base(context) { }

    public override async Task<Asset?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(a => a.Category)
            .Include(a => a.OrganizationUnit)
            .Include(a => a.Documents).ThenInclude(d => d.UploadedByUser)
            .Include(a => a.History).ThenInclude(h => h.ChangedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public override async Task<IReadOnlyList<Asset>> GetAllAsync()
    {
        return await _dbSet
            .Include(a => a.Category)
            .Include(a => a.OrganizationUnit)
            .Include(a => a.Documents)
            .ToListAsync();
    }
}

public class OrganizationUnitRepository : Repository<OrganizationUnit>
{
    public OrganizationUnitRepository(AppDbContext context) : base(context) { }

    public override async Task<OrganizationUnit?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(o => o.Parent)
            .Include(o => o.Assets)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public override async Task<IReadOnlyList<OrganizationUnit>> GetAllAsync()
    {
        return await _dbSet
            .Include(o => o.Assets)
            .Include(o => o.Parent)
            .ToListAsync();
    }
}

public class AssetDocumentRepository : Repository<AssetDocument>
{
    public AssetDocumentRepository(AppDbContext context) : base(context) { }

    public override async Task<AssetDocument?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(d => d.UploadedByUser)
            .Include(d => d.Asset)
            .FirstOrDefaultAsync(d => d.Id == id);
    }
}
