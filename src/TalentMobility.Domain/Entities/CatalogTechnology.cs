namespace TalentMobility.Domain.Entities;

public class CatalogTechnology
{
    public string Id { get; set; } = string.Empty;
    public string CompetencyId { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public CatalogCompetency Competency { get; set; } = null!;
}
