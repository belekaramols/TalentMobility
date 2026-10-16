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
        var (status, title, errors) = exception switch
        {
            RequestValidationException validation => (
                StatusCodes.Status400BadRequest,
                Messages.Problems.ValidationFailed,
                validation.Errors),
            AccessDeniedException => (
                StatusCodes.Status403Forbidden,
                Messages.Problems.AccessDenied,
                null),
            _ => (
                StatusCodes.Status500InternalServerError,
                Messages.Problems.UnexpectedError,
                null)
        };

        if (status == StatusCodes.Status500InternalServerError)
            _logger.LogError(exception, "Unhandled exception for {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
        else
            _logger.LogWarning("Request failed with status {Status} for {Method} {Path}", status, httpContext.Request.Method, httpContext.Request.Path);

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Type = status switch
            {
                StatusCodes.Status400BadRequest => "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.1",
                StatusCodes.Status403Forbidden => "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.4",
                _ => "https://datatracker.ietf.org/doc/html/rfc9110#section-15.6.1"
            },
            Instance = httpContext.Request.Path
        };
        problem.Extensions["traceId"] = httpContext.TraceIdentifier;
        if (errors is not null)
            problem.Extensions["errors"] = errors;

        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json", cancellationToken);
        return true;
    }
}
