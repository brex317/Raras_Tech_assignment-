using Application.DTOs.Assets;
using Application.DTOs.Common;

namespace Application.Interfaces;

public interface IAssetService
{
    Task<PagedResult<AssetDto>> GetAssetsAsync(int page, int pageSize, string? search, Guid? categoryId, string? status);
    Task<AssetDetailDto> GetAssetByIdAsync(Guid id);
     Task<AssetDto> CreateAssetAsync(CreateAssetRequest request, Guid userId, string userRole, Guid? userOrgUnitId);
     Task<AssetDto> UpdateAssetAsync(Guid id, UpdateAssetRequest request, Guid userId, string userRole, Guid? userOrgUnitId);
     Task<AssetDto> AssignAssetAsync(Guid id, AssignAssetRequest request, Guid userId, string userRole, Guid? userOrgUnitId);
     Task DeleteAssetAsync(Guid id, Guid userId, string userRole, Guid? userOrgUnitId);
}
