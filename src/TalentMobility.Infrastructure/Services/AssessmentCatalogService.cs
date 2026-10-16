using System.Reflection;
using System.Text.Json;
using TalentMobility.Application.Constants;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Infrastructure.Services;

public class AssessmentCatalogService : IAssessmentCatalogService
{
    private readonly CatalogRoot _root;

    public AssessmentCatalogService()
    {
        var asm = Assembly.GetExecutingAssembly();
        using var stream = asm.GetManifestResourceStream("TalentMobility.Infrastructure.Data.assessment-catalog.json")
            ?? throw new InvalidOperationException(Messages.System.AssessmentCatalogNotFound);
        using var reader = new StreamReader(stream);
        _root = JsonSerializer.Deserialize<CatalogRoot>(reader.ReadToEnd(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new CatalogRoot();
    }

    public IReadOnlyList<CompetencyCatalogDto> GetCompetencies() =>
        _root.Competencies.Select(c => new CompetencyCatalogDto(
            c.Id,
            c.Label,
            c.Technologies.Select(t => new TechnologyCatalogDto(t.Id, t.Label)).ToList())).ToList();

    public IReadOnlyList<SkillLevelDto> GetSkillLevels() =>
        _root.SkillLevels.Select(s => new SkillLevelDto(s.Id, s.Label, s.Description)).ToList();

    private sealed class CatalogRoot
    {
        public List<SkillLevelItem> SkillLevels { get; set; } = new();
        public List<CompetencyItem> Competencies { get; set; } = new();
    }

    private sealed class SkillLevelItem
    {
        public string Id { get; set; } = "";
        public string Label { get; set; } = "";
        public string Description { get; set; } = "";
    }

    private sealed class CompetencyItem
    {
        public string Id { get; set; } = "";
        public string Label { get; set; } = "";
        public List<TechItem> Technologies { get; set; } = new();
    }

    private sealed class TechItem
    {
        public string Id { get; set; } = "";
        public string Label { get; set; } = "";
    }
}
