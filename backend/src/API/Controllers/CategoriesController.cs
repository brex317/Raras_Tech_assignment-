using Application.DTOs.Categories;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly IRepository<AssetCategory> _categoryRepository;

    public CategoriesController(IRepository<AssetCategory> categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _categoryRepository.GetAllAsync();
        var dtos = categories.Select(c => new AssetCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            AssetCount = c.Assets?.Count ?? 0
        }).ToList();

        return Ok(dtos);
    }
}
