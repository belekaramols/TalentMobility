using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Infrastructure.Services;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NavigationController : ControllerBase
{
    private readonly NavigationService _navigation;
    private readonly AuthService _auth;

    public NavigationController(NavigationService navigation, AuthService auth)
    {
        _navigation = navigation;
        _auth = auth;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await _auth.GetCurrentUserAsync();
        if (user is null) return Unauthorized();
        return Ok(_navigation.GetForRoles(user.Roles));
    }
}
