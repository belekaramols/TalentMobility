using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Application.Authorization;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignments;
    private readonly IUserSession _session;

    public AssignmentsController(IAssignmentService assignments, IUserSession session)
    {
        _assignments = assignments;
        _session = session;
    }

    [HttpGet("me")]
    public async Task<IActionResult> MyAssignments([FromQuery] PageQuery page, CancellationToken cancellationToken)
    {
        var id = _session.UserId;
        if (id is null) return Unauthorized();
        return Ok(await _assignments.GetForEmployeeAsync(id.Value, page.Page, page.PageSize, cancellationToken));
    }
}

[ApiController]
[Route("api/manager/assignments")]
[Authorize(Policy = Policies.ManageTeam)]
public class ManagerAssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignments;
    private readonly IUserSession _session;
    private readonly IAuthorizationService _authorization;

    public ManagerAssignmentsController(IAssignmentService assignments, IUserSession session, IAuthorizationService authorization)
    {
        _assignments = assignments;
        _session = session;
        _authorization = authorization;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentRequest request, CancellationToken cancellationToken)
    {
        var id = _session.UserId;
        if (id is null) return Unauthorized();
        var access = await _authorization.AuthorizeAsync(User, request.EmployeeId, Policies.AccessTeamMember);
        if (!access.Succeeded) return Forbid();
        var result = await _assignments.CreateAsync(id.Value, _session.IsPlatformAdmin, request, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}
