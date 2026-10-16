using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;
using TalentMobility.Infrastructure.Persistence;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CatalogController : ControllerBase
{
    private readonly IAssessmentCatalogService _catalog;
    private readonly ICatalogQuestionBank _bank;
    private readonly ApplicationDbContext _db;

    public CatalogController(IAssessmentCatalogService catalog, ICatalogQuestionBank bank, ApplicationDbContext db)
    {
        _catalog = catalog;
        _bank = bank;
        _db = db;
    }

    [HttpGet("competencies")]
    public IActionResult Competencies() => Ok(_catalog.GetCompetencies());

    [HttpGet("skill-levels")]
    public IActionResult SkillLevels() => Ok(_catalog.GetSkillLevels());

    [HttpGet("bank-availability")]
    public async Task<ActionResult<BankAvailabilityDto>> BankAvailability(
        [FromQuery] string competencyId,
        [FromQuery] string technologyId,
        [FromQuery] string skillLevel,
        CancellationToken cancellationToken)
    {
        var config = await _db.AssessmentConfigurations.AsNoTracking().FirstAsync(cancellationToken);
        var available = await _bank.CountAvailableAsync(competencyId, technologyId, skillLevel, cancellationToken);
        return Ok(new BankAvailabilityDto(available, config.QuestionCount, available >= config.QuestionCount));
    }
}
