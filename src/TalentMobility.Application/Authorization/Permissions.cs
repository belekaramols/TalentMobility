using TalentMobility.Domain.Enums;

namespace TalentMobility.Application.Authorization;

public static class Permissions
{
    public const string ClaimType = "permission";
    public const string ManageTeam = "team.manage";
    public const string PlatformAdmin = "platform.admin";
}

public static class Policies
{
    public const string ManageTeam = "ManageTeam";
    public const string AccessTeamMember = "AccessTeamMember";
}

public static class PermissionMap
{
    public static IReadOnlyList<string> ForRole(string role) => role switch
    {
        nameof(AppRole.Manager) => [Permissions.ManageTeam],
        nameof(AppRole.Administrator) => [Permissions.ManageTeam, Permissions.PlatformAdmin],
        _ => []
    };
}

public static class TeamAccessRules
{
    public static bool CanManage(bool isPlatformAdmin, Guid currentUserId, Guid? employeeManagerId) =>
        isPlatformAdmin || employeeManagerId == currentUserId;
}
