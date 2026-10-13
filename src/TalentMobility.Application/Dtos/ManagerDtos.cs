namespace TalentMobility.Application.Dtos;

public record ManagerDashboardDto(
    int TeamSize,
    int TestsThisMonth,
    decimal AverageScorePercent,
    IReadOnlyList<TeamMemberAssessmentSummaryDto> Members);

public record TeamMemberAssessmentSummaryDto(
    Guid EmployeeId,
    string FullName,
    string Email,
    string? CompetencyName,
    int AttemptCount,
    decimal? LatestScorePercent,
    decimal? BestScorePercent);

public record MatchingWeightsDto(
    decimal RequiredSkillMatchPercent,
    decimal ExperiencePercent,
    decimal AvailabilityPercent,
    decimal CertificationPercent);

public record EmployeeListItemDto(Guid Id, string FullName, string Email, string? Designation, string? BusinessUnitName);
