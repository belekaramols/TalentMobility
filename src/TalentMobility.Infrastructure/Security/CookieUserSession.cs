using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using TalentMobility.Application.Authorization;
using TalentMobility.Application.Constants;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Infrastructure.Security;

public class CookieUserSession : IUserSession
{
    private readonly IHttpContextAccessor _http;

    public CookieUserSession(IHttpContextAccessor http) => _http = http;

    public Guid? UserId
    {
        get
        {
            var id = _http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(id, out var parsed) ? parsed : null;
        }
    }

    public bool IsPlatformAdmin =>
        _http.HttpContext?.User.HasClaim(Permissions.ClaimType, Permissions.PlatformAdmin) == true;

    public async Task SignInAsync(Guid userId, string email, string fullName, IReadOnlyList<string> roles, CancellationToken cancellationToken)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, fullName)
        };
        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));
        foreach (var permission in roles.SelectMany(PermissionMap.ForRole).Distinct())
            claims.Add(new Claim(Permissions.ClaimType, permission));

        var identity = new ClaimsIdentity(claims, AuthConstants.CookieScheme);
        await _http.HttpContext!.SignInAsync(
            AuthConstants.CookieScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true, ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8) });
    }

    public Task SignOutAsync(CancellationToken cancellationToken) =>
        _http.HttpContext!.SignOutAsync(AuthConstants.CookieScheme);
}
