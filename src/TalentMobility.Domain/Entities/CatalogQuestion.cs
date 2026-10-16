namespace TalentMobility.Domain.Entities;

public class CatalogQuestion
{
    public Guid Id { get; set; }
    public string CompetencyId { get; set; } = string.Empty;
    public string TechnologyId { get; set; } = string.Empty;
    public string SkillLevelId { get; set; } = string.Empty;
    public string Stem { get; set; } = string.Empty;
    public string OptionsJson { get; set; } = "[]";
    public int CorrectOptionIndex { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
