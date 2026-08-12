using System.Security.Claims;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetDocumentsController : ControllerBase
{
    private readonly IAssetDocumentService _documentService;

    public AssetDocumentsController(IAssetDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpPost("upload")]
    [Authorize(Roles = "Administrator,Manager")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        [FromForm] Guid assetId,
        [FromForm] DocumentType documentType,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty or not provided.");

        var userId = GetUserId();
        using var stream = file.OpenReadStream();

        var result = await _documentService.UploadDocumentAsync(
            assetId,
            file.FileName,
            file.ContentType,
            file.Length,
            stream,
            documentType,
            userId);

        return Ok(result);
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var (fileStream, contentType, fileName) = await _documentService.DownloadDocumentAsync(id);
        return File(fileStream, contentType, fileName);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        await _documentService.DeleteDocumentAsync(id, userId);
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
}
