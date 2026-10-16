using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TalentMobility.Application.Constants;

namespace TalentMobility.Api.Security;

public sealed class AntiforgeryFilter : IAsyncAuthorizationFilter
{
    private readonly IAntiforgery _antiforgery;

    public AntiforgeryFilter(IAntiforgery antiforgery) => _antiforgery = antiforgery;

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var method = context.HttpContext.Request.Method;
        if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method) || HttpMethods.IsTrace(method))
            return;

        if (await _antiforgery.IsRequestValidAsync(context.HttpContext))
            return;

        context.Result = new ObjectResult(new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = Messages.Problems.AntiforgeryValidationFailed,
            Type = "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.1"
        })
        {
            StatusCode = StatusCodes.Status400BadRequest,
            ContentTypes = { "application/problem+json" }
        };
    }
}
