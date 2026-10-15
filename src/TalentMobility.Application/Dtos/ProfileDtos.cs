namespace TalentMobility.Application.Dtos;

public record EmployeeProfileDto(
    Guid Id,
    int NewerId,
    string Email,
    string FullName,
    string? Designation,
    string? CompetencyName,
    string? BusinessUnitName,
    string? ProfilePicUrl,
    string? HrRoleName);

public record AuditLogDto(Guid Id, string Action, DateTime CreatedAtUtc, string? ActorName);
