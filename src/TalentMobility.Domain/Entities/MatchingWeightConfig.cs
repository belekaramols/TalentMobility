namespace TalentMobility.Domain.Entities;

public class MatchingWeightConfig
{
    public int Id { get; set; }
    public decimal RequiredSkillMatchPercent { get; set; } = 60;
    public decimal ExperiencePercent { get; set; } = 20;
    public decimal AvailabilityPercent { get; set; } = 15;
    public decimal CertificationPercent { get; set; } = 5;
}
