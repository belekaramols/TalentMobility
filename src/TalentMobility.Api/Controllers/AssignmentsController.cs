using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Application.Dtos;
using TalentMobility.Infrastructure.Services;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly AssignmentService _assignments;
    private readonly AuthService _auth;

    public AssignmentsController(AssignmentService assignments, AuthService auth)
    {
        _assignments = assignments;
        _auth = auth;
    }

    [HttpGet("me")]
    public async Task<IActionResult> MyAssignments()
    {
        var id = _auth.GetCurrentUserId();
        if (id is null) return Unauthorized();
        return Ok(await _assignments.GetForEmployeeAsync(id.Value));
    }
}

[ApiController]
[Route("api/manager/assignments")]
[Authorize(Roles = "Manager,Administrator")]
public class ManagerAssignmentsController : ControllerBase
{
    private readonly AssignmentService _assignments;
    private readonly AuthService _auth;

    public ManagerAssignmentsController(AssignmentService assignments, AuthService auth)
    {
        _assignments = assignments;
        _auth = auth;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentRequest request)
    {
        var id = _auth.GetCurrentUserId();
        if (id is null) return Unauthorized();
        var result = await _assignments.CreateAsync(id.Value, request);
        return result is null ? BadRequest() : Ok(result);
    }
}
