using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CatalogController : ControllerBase
{
    private readonly IAssessmentCatalogService _catalog;

    public CatalogController(IAssessmentCatalogService catalog) => _catalog = catalog;

    [HttpGet("competencies")]
    public IActionResult Competencies() => Ok(_catalog.GetCompetencies());

    [HttpGet("skill-levels")]
    public IActionResult SkillLevels() => Ok(_catalog.GetSkillLevels());
}
