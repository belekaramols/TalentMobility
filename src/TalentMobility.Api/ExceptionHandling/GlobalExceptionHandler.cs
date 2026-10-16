using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Application.Constants;
using TalentMobility.Application.Exceptions;

namespace TalentMobility.Api.ExceptionHandling;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, title, detail, errors, extensions) = MapException(exception);

        if (status == StatusCodes.Status500InternalServerError)
            _logger.LogError(exception, "Unhandled exception for {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
        else
            _logger.LogWarning("Request failed with status {Status} for {Method} {Path}", status, httpContext.Request.Method, httpContext.Request.Path);

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Type = status switch
            {
                StatusCodes.Status400BadRequest => "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.1",
                StatusCodes.Status403Forbidden => "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.4",
                StatusCodes.Status503ServiceUnavailable => "https://datatracker.ietf.org/doc/html/rfc9110#section-15.6.4",
                _ => "https://datatracker.ietf.org/doc/html/rfc9110#section-15.6.1"
            },
            Instance = httpContext.Request.Path
        };
        problem.Extensions["traceId"] = httpContext.TraceIdentifier;
        if (errors is not null)
            problem.Extensions["errors"] = errors;
        foreach (var (key, value) in extensions)
            problem.Extensions[key] = value;

        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json", cancellationToken);
        return true;
    }

    private static (int Status, string Title, string? Detail, IReadOnlyDictionary<string, string[]>? Errors, Dictionary<string, object?> Extensions)
        MapException(Exception exception) => exception switch
    {
        RequestValidationException validation => (
            StatusCodes.Status400BadRequest,
            Messages.Problems.ValidationFailed,
            null,
            validation.Errors,
            new Dictionary<string, object?>()),
        AccessDeniedException => (
            StatusCodes.Status403Forbidden,
            Messages.Problems.AccessDenied,
            null,
            null,
            new Dictionary<string, object?>()),
        QuestionGenerationException generation => (
            generation.Retryable ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status502BadGateway,
            Messages.Problems.QuestionGenerationFailed,
            generation.UserMessage,
            null,
            new Dictionary<string, object?>
            {
                ["code"] = "question_generation_failed",
                ["source"] = generation.Provider,
                ["retryable"] = generation.Retryable,
                ["canUseBank"] = generation.CanUseBank,
                ["providerStatus"] = generation.StatusCode
            }),
        _ => (
            StatusCodes.Status500InternalServerError,
            Messages.Problems.UnexpectedError,
            null,
            null,
            new Dictionary<string, object?>())
    };
}
