using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NavigationController : ControllerBase
{
    private readonly INavigationService _navigation;
    private readonly IAuthService _auth;

    public NavigationController(INavigationService navigation, IAuthService auth)
    {
        _navigation = navigation;
        _auth = auth;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var user = await _auth.GetCurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();
        return Ok(_navigation.GetForRoles(user.Roles));
    }
}
