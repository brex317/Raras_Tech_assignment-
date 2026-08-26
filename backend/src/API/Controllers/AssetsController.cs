using System.Security.Claims;
using Application.DTOs.Assets;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly IAssetService _assetService;

    public AssetsController(IAssetService assetService)
    {
        _assetService = assetService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAssets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? status = null)
    {
        var result = await _assetService.GetAssetsAsync(page, pageSize, search, categoryId, status);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAssetById(Guid id)
    {
        var result = await _assetService.GetAssetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> CreateAsset([FromBody] CreateAssetRequest request)
    {
        var userId = GetUserId();
        var userRole = GetUserRole();
        var userOrgUnitId = GetUserOrgUnitId();
        var result = await _assetService.CreateAssetAsync(request, userId, userRole, userOrgUnitId);
        return CreatedAtAction(nameof(GetAssetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> UpdateAsset(Guid id, [FromBody] UpdateAssetRequest request)
    {
        var userId = GetUserId();
        var userRole = GetUserRole();
        var userOrgUnitId = GetUserOrgUnitId();
        var result = await _assetService.UpdateAssetAsync(id, request, userId, userRole, userOrgUnitId);
        return Ok(result);
    }

    [HttpPut("{id:guid}/assign")]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> AssignAsset(Guid id, [FromBody] AssignAssetRequest request)
    {
        var userId = GetUserId();
        var userRole = GetUserRole();
        var userOrgUnitId = GetUserOrgUnitId();
        var result = await _assetService.AssignAssetAsync(id, request, userId, userRole, userOrgUnitId);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> DeleteAsset(Guid id)
    {
        var userId = GetUserId();
        var userRole = GetUserRole();
        var userOrgUnitId = GetUserOrgUnitId();
        await _assetService.DeleteAssetAsync(id, userId, userRole, userOrgUnitId);
        return NoContent();
    }

    private Guid GetUserId()
    {
        var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(nameIdentifier) || !Guid.TryParse(nameIdentifier, out var userId))
        {
            throw new UnauthorizedAccessException("User context is missing or invalid.");
        }
        return userId;
    }

    private string GetUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
    }

    private Guid? GetUserOrgUnitId()
    {
        var orgUnitIdClaim = User.FindFirst("OrganizationUnitId")?.Value;
        if (string.IsNullOrEmpty(orgUnitIdClaim) || !Guid.TryParse(orgUnitIdClaim, out var orgUnitId))
        {
            return null;
        }
        return orgUnitId;
    }
}