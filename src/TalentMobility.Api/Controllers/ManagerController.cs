using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Application.Dtos;
using TalentMobility.Infrastructure.Services;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/manager")]
[Authorize(Roles = "Manager,Administrator")]
public class ManagerController : ControllerBase
{
    private readonly ManagerService _manager;
    private readonly AssignmentService _assignments;
    private readonly AssessmentService _assessments;
    private readonly AuthService _auth;

    public ManagerController(ManagerService manager, AssignmentService assignments, AssessmentService assessments, AuthService auth)
    {
        _manager = manager;
        _assignments = assignments;
        _assessments = assessments;
        _auth = auth;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard() => Ok(await _manager.GetDashboardAsync());

    [HttpGet("employees")]
    public async Task<IActionResult> Employees() => Ok(await _manager.GetEmployeesAsync());

    [HttpGet("employees/{employeeId:guid}/attempts")]
    public async Task<IActionResult> EmployeeAttempts(Guid employeeId)
    {
        return Ok(await _assessments.GetHistoryAsync(employeeId));
    }

    [HttpGet("employees/{employeeId:guid}/attempts/{attemptId:guid}/detail")]
    public async Task<IActionResult> EmployeeAttemptDetail(Guid employeeId, Guid attemptId)
    {
        var result = await _assessments.GetDetailAsync(employeeId, attemptId, true);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("matching-weights")]
    public async Task<IActionResult> GetWeights() => Ok(await _manager.GetWeightsAsync());

    [HttpPut("matching-weights")]
    public async Task<IActionResult> PutWeights([FromBody] MatchingWeightsDto dto) =>
        Ok(await _manager.UpdateWeightsAsync(dto));

    [HttpGet("assessment-config")]
    public async Task<IActionResult> GetConfig() => Ok(await _assignments.GetConfigAsync());

    [HttpPut("assessment-config")]
    public async Task<IActionResult> PutConfig([FromBody] UpdateAssessmentConfigRequest request) =>
        Ok(await _assignments.UpdateConfigAsync(request));

    [HttpGet("audit")]
    public async Task<IActionResult> Audit() => Ok(await _manager.GetAuditAsync());
}
