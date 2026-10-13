namespace TalentMobility.Domain.Entities;

public class AttemptQuestion
{
    public Guid Id { get; set; }
    public Guid AssessmentAttemptId { get; set; }
    public int SortOrder { get; set; }
    public string QuestionStem { get; set; } = string.Empty;
    public string OptionsJson { get; set; } = "[]";
    public int CorrectOptionIndex { get; set; }
    public int? SelectedOptionIndex { get; set; }
    public bool? IsCorrect { get; set; }

    public AssessmentAttempt Attempt { get; set; } = null!;
}
