using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        // Repositories - register specialized implementations
        services.AddScoped<IRepository<User>, UserRepository>();
        services.AddScoped<IRepository<Asset>, AssetRepository>();
        services.AddScoped<IRepository<OrganizationUnit>, OrganizationUnitRepository>();
        services.AddScoped<IRepository<AssetDocument>, AssetDocumentRepository>();
        services.AddScoped<IRepository<AssetCategory>, Repository<AssetCategory>>();
        services.AddScoped<IRepository<AssetHistory>, Repository<AssetHistory>>();
        services.AddScoped<IRepository<Role>, Repository<Role>>();

        // Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Services
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();

        return services;
    }
}
