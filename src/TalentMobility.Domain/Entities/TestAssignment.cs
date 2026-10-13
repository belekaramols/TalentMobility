using TalentMobility.Domain.Enums;

namespace TalentMobility.Domain.Entities;

public class TestAssignment
{
    public Guid Id { get; set; }
    public Guid EmployeeProfileId { get; set; }
    public Guid AssignedByEmployeeId { get; set; }
    public string CompetencyId { get; set; } = string.Empty;
    public string CompetencyLabel { get; set; } = string.Empty;
    public string TechnologyId { get; set; } = string.Empty;
    public string TechnologyLabel { get; set; } = string.Empty;
    public string SkillLevel { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime? DueDateUtc { get; set; }
    public AssignmentStatus Status { get; set; }
    public Guid? AssessmentAttemptId { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public EmployeeProfile Employee { get; set; } = null!;
    public EmployeeProfile AssignedBy { get; set; } = null!;
}
