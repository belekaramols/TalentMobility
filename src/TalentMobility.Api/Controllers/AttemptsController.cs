using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttemptsController : ControllerBase
{
    private readonly IAssessmentService _assessments;
    private readonly IUserSession _session;

    public AttemptsController(IAssessmentService assessments, IUserSession session)
    {
        _assessments = assessments;
        _session = session;
    }

    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartAttemptRequest request, CancellationToken cancellationToken)
    {
        var id = _session.UserId;
        if (id is null) return Unauthorized();
        var attempt = await _assessments.StartAttemptAsync(id.Value, request, cancellationToken);
        return attempt is null ? NotFound() : Ok(attempt);
    }

    [HttpGet("{attemptId:guid}")]
    public async Task<IActionResult> Get(Guid attemptId, CancellationToken cancellationToken)
    {
        var id = _session.UserId;
        if (id is null) return Unauthorized();
        var attempt = await _assessments.GetAttemptAsync(id.Value, attemptId, cancellationToken);
        return attempt is null ? NotFound() : Ok(attempt);
    }

    [HttpPost("{attemptId:guid}/submit")]
    public async Task<IActionResult> Submit(Guid attemptId, [FromBody] SubmitAttemptRequest request, CancellationToken cancellationToken)
    {
        var id = _session.UserId;
        if (id is null) return Unauthorized();
        var result = await _assessments.SubmitAsync(id.Value, attemptId, request, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("me")]
    public async Task<IActionResult> History([FromQuery] PageQuery page, CancellationToken cancellationToken)
    {
        var id = _session.UserId;
        if (id is null) return Unauthorized();
        return Ok(await _assessments.GetHistoryAsync(id.Value, page.Page, page.PageSize, cancellationToken));
    }

    [HttpGet("{attemptId:guid}/detail")]
    public async Task<IActionResult> Detail(Guid attemptId, CancellationToken cancellationToken)
    {
        var id = _session.UserId;
        if (id is null) return Unauthorized();
        var result = await _assessments.GetOwnDetailAsync(id.Value, attemptId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}
