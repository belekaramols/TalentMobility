using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Application.Authorization;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/manager")]
[Authorize(Policy = Policies.ManageTeam)]
public class ManagerController : ControllerBase
{
    private readonly IManagerService _manager;
    private readonly IAssessmentService _assessments;
    private readonly IAssignmentService _assignments;
    private readonly IUserSession _session;
    private readonly IAuthorizationService _authorization;

    public ManagerController(
        IManagerService manager,
        IAssessmentService assessments,
        IAssignmentService assignments,
        IUserSession session,
        IAuthorizationService authorization)
    {
        _manager = manager;
        _assessments = assessments;
        _assignments = assignments;
        _session = session;
        _authorization = authorization;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        var id = RequireUser();
        if (id is null) return Unauthorized();
        return Ok(await _manager.GetDashboardAsync(id.Value, _session.IsPlatformAdmin, cancellationToken));
    }

    [HttpGet("employees")]
    public async Task<IActionResult> Employees([FromQuery] PageQuery page, CancellationToken cancellationToken)
    {
        var id = RequireUser();
        if (id is null) return Unauthorized();
        return Ok(await _manager.GetEmployeesAsync(id.Value, _session.IsPlatformAdmin, page.Page, page.PageSize, cancellationToken));
    }

    [HttpGet("employees/{employeeId:guid}/attempts")]
    public async Task<IActionResult> EmployeeAttempts(Guid employeeId, [FromQuery] PageQuery page, CancellationToken cancellationToken)
    {
        var id = RequireUser();
        if (id is null) return Unauthorized();
        if (await DenyOutsideTeam(employeeId) is { } denied) return denied;
        return Ok(await _assessments.GetTeamHistoryAsync(id.Value, employeeId, _session.IsPlatformAdmin, page.Page, page.PageSize, cancellationToken));
    }

    [HttpGet("employees/{employeeId:guid}/attempts/{attemptId:guid}/detail")]
    public async Task<IActionResult> EmployeeAttemptDetail(Guid employeeId, Guid attemptId, CancellationToken cancellationToken)
    {
        var id = RequireUser();
        if (id is null) return Unauthorized();
        if (await DenyOutsideTeam(employeeId) is { } denied) return denied;
        var result = await _assessments.GetTeamDetailAsync(id.Value, employeeId, attemptId, _session.IsPlatformAdmin, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("matching-weights")]
    public async Task<IActionResult> GetWeights(CancellationToken cancellationToken) =>
        Ok(await _manager.GetWeightsAsync(cancellationToken));

    [HttpPut("matching-weights")]
    public async Task<IActionResult> PutWeights([FromBody] MatchingWeightsDto dto, CancellationToken cancellationToken) =>
        Ok(await _manager.UpdateWeightsAsync(dto, cancellationToken));

    [HttpGet("assessment-config")]
    public async Task<IActionResult> GetConfig(CancellationToken cancellationToken) =>
        Ok(await _assignments.GetConfigAsync(cancellationToken));

    [HttpPut("assessment-config")]
    public async Task<IActionResult> PutConfig([FromBody] UpdateAssessmentConfigRequest request, CancellationToken cancellationToken) =>
        Ok(await _assignments.UpdateConfigAsync(request, cancellationToken));

    [HttpGet("audit")]
    public async Task<IActionResult> Audit([FromQuery] PageQuery page, CancellationToken cancellationToken) =>
        Ok(await _manager.GetAuditAsync(page.Page, page.PageSize, cancellationToken));

    private Guid? RequireUser() => _session.UserId;

    private async Task<IActionResult?> DenyOutsideTeam(Guid employeeId)
    {
        var access = await _authorization.AuthorizeAsync(User, employeeId, Policies.AccessTeamMember);
        return access.Succeeded ? null : Forbid();
    }
}
