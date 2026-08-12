using Application.DTOs.OrganizationUnits;

namespace Application.Interfaces;

public interface IOrganizationUnitService
{
    Task<List<OrganizationUnitTreeDto>> GetTreeAsync();
    Task<List<OrganizationUnitDto>> GetAllAsync();
    Task<OrganizationUnitDto> GetByIdAsync(Guid id);
    Task<OrganizationUnitDto> CreateAsync(CreateOrganizationUnitRequest request);
    Task<OrganizationUnitDto> UpdateAsync(Guid id, UpdateOrganizationUnitRequest request);
}
