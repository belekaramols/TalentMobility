using TalentMobility.Application.Dtos;

namespace TalentMobility.Application.Interfaces;

public interface IAssessmentCatalogService
{
    IReadOnlyList<CompetencyCatalogDto> GetCompetencies();
    IReadOnlyList<SkillLevelDto> GetSkillLevels();
}
