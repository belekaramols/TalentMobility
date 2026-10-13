namespace TalentMobility.Application.Dtos;

public record StartAttemptRequest(
    string CompetencyId,
    string TechnologyId,
    string SkillLevel,
    Guid? AssignmentId);

public record AttemptSummaryDto(
    Guid Id,
    string CompetencyLabel,
    string TechnologyLabel,
    string SkillLevel,
    int? Score,
    int MaxScore,
    string Status,
    string Source,
    DateTime StartedAtUtc,
    DateTime? CompletedAtUtc);

public record QuestionClientDto(Guid Id, int SortOrder, string Stem, IReadOnlyList<string> Options);

public record AttemptInProgressDto(
    Guid Id,
    string CompetencyLabel,
    string TechnologyLabel,
    string SkillLevel,
    IReadOnlyList<QuestionClientDto> Questions);

public record SubmitAttemptRequest(IReadOnlyList<AnswerSubmissionDto> Answers);
public record AnswerSubmissionDto(Guid QuestionId, int SelectedOptionIndex);

public record AttemptResultDto(
    Guid Id,
    int Score,
    int MaxScore,
    int CorrectCount,
    int IncorrectCount,
    IReadOnlyList<QuestionResultDto> Questions);

public record QuestionResultDto(
    Guid Id,
    int SortOrder,
    string Stem,
    IReadOnlyList<string> Options,
    int? SelectedOptionIndex,
    int CorrectOptionIndex,
    bool IsCorrect);

public record CompetencyCatalogDto(string Id, string Label, IReadOnlyList<TechnologyCatalogDto> Technologies);
public record TechnologyCatalogDto(string Id, string Label);
public record SkillLevelDto(string Id, string Label, string Description);
