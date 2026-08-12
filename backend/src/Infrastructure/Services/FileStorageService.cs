using Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _storagePath;

    public FileStorageService(IConfiguration configuration)
    {
        _storagePath = configuration["FileStorage:Path"] ?? "uploads";

        if (!Directory.Exists(_storagePath))
            Directory.CreateDirectory(_storagePath);
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName)
    {
        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(_storagePath, uniqueFileName);

        using var outputStream = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(outputStream);

        return uniqueFileName;
    }

    public Task<Stream> GetFileAsync(string storagePath)
    {
        var filePath = Path.Combine(_storagePath, storagePath);

        if (!File.Exists(filePath))
            throw new FileNotFoundException("File not found.", storagePath);

        Stream stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteFileAsync(string storagePath)
    {
        var filePath = Path.Combine(_storagePath, storagePath);

        if (File.Exists(filePath))
            File.Delete(filePath);

        return Task.CompletedTask;
    }
}
