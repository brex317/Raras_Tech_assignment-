using Application.DTOs.OrganizationUnits;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganizationUnitsController : ControllerBase
{
    private readonly IOrganizationUnitService _organizationUnitService;

    public OrganizationUnitsController(IOrganizationUnitService organizationUnitService)
    {
        _organizationUnitService = organizationUnitService;
    }

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        var result = await _organizationUnitService.GetTreeAsync();
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _organizationUnitService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _organizationUnitService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] CreateOrganizationUnitRequest request)
    {
        var result = await _organizationUnitService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOrganizationUnitRequest request)
    {
        var result = await _organizationUnitService.UpdateAsync(id, request);
        return Ok(result);
    }
}
