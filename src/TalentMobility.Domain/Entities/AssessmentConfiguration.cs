namespace TalentMobility.Domain.Entities;

public class AssessmentConfiguration
{
    public int Id { get; set; }
    public bool ManualAssignmentEnabled { get; set; } = true;
    public bool NotifyEmployeeOnAssignment { get; set; } = true;
    public int DefaultDueDays { get; set; } = 7;
    public int MaxRetakeCount { get; set; } = 5;
    public int QuestionCount { get; set; } = 10;
}
