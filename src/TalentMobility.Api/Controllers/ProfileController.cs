using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profiles;
    private readonly IUserSession _session;

    public ProfileController(IProfileService profiles, IUserSession session)
    {
        _profiles = profiles;
        _session = session;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var id = _session.UserId;
        if (id is null) return Unauthorized();
        var profile = await _profiles.GetOwnAsync(id.Value, cancellationToken);
        return profile is null ? NotFound() : Ok(profile);
    }
}
