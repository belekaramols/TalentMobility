namespace TalentMobility.Application.Dtos;

public record LoginRequest(string Email, string Password);
public record LoginResponse(Guid UserId, string Email, string FullName, IReadOnlyList<string> Roles);

public record CurrentUserDto(
    Guid Id,
    string Email,
    string FullName,
    string? Designation,
    string? CompetencyName,
    string? ProfilePicUrl,
    IReadOnlyList<string> Roles);
