using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Application.Dtos;
using TalentMobility.Infrastructure.Services;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttemptsController : ControllerBase
{
    private readonly AssessmentService _assessments;
    private readonly AuthService _auth;

    public AttemptsController(AssessmentService assessments, AuthService auth)
    {
        _assessments = assessments;
        _auth = auth;
    }

    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartAttemptRequest request)
    {
        var id = _auth.GetCurrentUserId();
        if (id is null) return Unauthorized();
        var attempt = await _assessments.StartAttemptAsync(id.Value, request);
        return attempt is null ? BadRequest() : Ok(attempt);
    }

    [HttpGet("{attemptId:guid}")]
    public async Task<IActionResult> Get(Guid attemptId)
    {
        var id = _auth.GetCurrentUserId();
        if (id is null) return Unauthorized();
        var attempt = await _assessments.GetAttemptAsync(id.Value, attemptId);
        return attempt is null ? NotFound() : Ok(attempt);
    }

    [HttpPost("{attemptId:guid}/submit")]
    public async Task<IActionResult> Submit(Guid attemptId, [FromBody] SubmitAttemptRequest request)
    {
        var id = _auth.GetCurrentUserId();
        if (id is null) return Unauthorized();
        var result = await _assessments.SubmitAsync(id.Value, attemptId, request);
        return result is null ? BadRequest() : Ok(result);
    }

    [HttpGet("me")]
    public async Task<IActionResult> History()
    {
        var id = _auth.GetCurrentUserId();
        if (id is null) return Unauthorized();
        return Ok(await _assessments.GetHistoryAsync(id.Value));
    }

    [HttpGet("{attemptId:guid}/detail")]
    public async Task<IActionResult> Detail(Guid attemptId)
    {
        var id = _auth.GetCurrentUserId();
        if (id is null) return Unauthorized();
        var isManager = User.IsInRole("Manager") || User.IsInRole("Administrator");
        var result = await _assessments.GetDetailAsync(id.Value, attemptId, isManager);
        return result is null ? NotFound() : Ok(result);
    }
}
