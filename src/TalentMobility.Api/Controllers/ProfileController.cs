using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalentMobility.Infrastructure.Persistence;
using TalentMobility.Infrastructure.Services;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly AuthService _auth;

    public ProfileController(ApplicationDbContext db, AuthService auth)
    {
        _db = db;
        _auth = auth;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var id = _auth.GetCurrentUserId();
        if (id is null) return Unauthorized();
        var profile = await _db.EmployeeProfiles.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);
        return profile is null ? NotFound() : Ok(profile);
    }
}
