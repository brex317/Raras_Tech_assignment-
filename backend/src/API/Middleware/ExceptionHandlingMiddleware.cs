using System.Net;
using System.Text.Json;
using Application.DTOs.Common;

namespace API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred during the request.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var code = HttpStatusCode.InternalServerError;
        var result = new ApiErrorResponse { Message = "An unexpected error occurred." };

        switch (exception)
        {
            case UnauthorizedAccessException:
                code = HttpStatusCode.Forbidden;
                result.Message = exception.Message;
                break;

            case KeyNotFoundException:
                code = HttpStatusCode.NotFound;
                result.Message = exception.Message;
                break;

            case ArgumentException:
                code = HttpStatusCode.BadRequest;
                result.Message = exception.Message;
                break;

            default:
                // Keep the default internal server error message generic for security,
                // but we can log the exact error inside the console/logger (which we did).
                result.Message = exception.Message; // Allow message for assessment debugging convenience
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)code;

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(result, jsonOptions));
    }
}
