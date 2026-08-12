using Application.Interfaces;
using Application.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAssetService, AssetService>();
        services.AddScoped<IOrganizationUnitService, OrganizationUnitService>();
        services.AddScoped<IAssetDocumentService, AssetDocumentService>();

        services.AddValidatorsFromAssemblyContaining<Validators.LoginRequestValidator>();

        return services;
    }
}
