namespace Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(Guid userId, string email, string role, Guid? organizationUnitId = null);
}
