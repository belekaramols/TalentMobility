using TalentMobility.Domain.Enums;

namespace TalentMobility.Domain.Entities;

public class AssessmentAttempt
{
    public Guid Id { get; set; }
    public Guid EmployeeProfileId { get; set; }
    public string CompetencyId { get; set; } = string.Empty;
    public string CompetencyLabel { get; set; } = string.Empty;
    public string TechnologyId { get; set; } = string.Empty;
    public string TechnologyLabel { get; set; } = string.Empty;
    public string SkillLevel { get; set; } = string.Empty;
    public int Score { get; set; }
    public int MaxScore { get; set; } = 10;
    public AttemptStatus Status { get; set; }
    public AttemptSource Source { get; set; }
    public QuestionSourceMode QuestionSource { get; set; }
    public Guid? AssignedByEmployeeId { get; set; }
    public Guid? TestAssignmentId { get; set; }
    public DateTime StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }

    public EmployeeProfile Employee { get; set; } = null!;
    public ICollection<AttemptQuestion> Questions { get; set; } = new List<AttemptQuestion>();
}
