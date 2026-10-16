namespace TalentMobility.Application.Dtos;

public record CreateAssignmentRequest(
    Guid EmployeeId,
    string CompetencyId,
    string TechnologyId,
    string SkillLevel,
    DateTime? DueDateUtc,
    string? Notes);

public record AssignmentDto(
    Guid Id,
    string AssignedByName,
    string CompetencyId,
    string CompetencyLabel,
    string TechnologyId,
    string TechnologyLabel,
    string SkillLevel,
    DateTime? DueDateUtc,
    string Status,
    Guid? AttemptId,
    Guid? InProgressAttemptId);

public record AssessmentConfigDto(
    bool ManualAssignmentEnabled,
    bool NotifyEmployeeOnAssignment,
    int DefaultDueDays,
    int MaxRetakeCount,
    int QuestionCount);

public record UpdateAssessmentConfigRequest(
    bool ManualAssignmentEnabled,
    bool NotifyEmployeeOnAssignment,
    int DefaultDueDays,
    int QuestionCount);
