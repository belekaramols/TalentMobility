using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TalentMobility.Application.Abstractions;
using TalentMobility.Application.Authorization;

namespace TalentMobility.Infrastructure.Authorization;

public sealed class TeamMemberRequirement : IAuthorizationRequirement
{
}

public class TeamMemberHandler : AuthorizationHandler<TeamMemberRequirement, Guid>
{
    private readonly IApplicationDbContext _db;

    public TeamMemberHandler(IApplicationDbContext db) => _db = db;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        TeamMemberRequirement requirement,
        Guid employeeId)
    {
        if (employeeId == Guid.Empty || !context.User.HasClaim(Permissions.ClaimType, Permissions.ManageTeam))
            return;

        var userIdValue = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdValue, out var userId))
            return;

        var managerId = await _db.EmployeeProfiles.AsNoTracking()
            .Where(e => e.Id == employeeId)
            .Select(e => e.ManagerEmployeeId)
            .FirstOrDefaultAsync();
        var isPlatformAdmin = context.User.HasClaim(Permissions.ClaimType, Permissions.PlatformAdmin);
        if (TeamAccessRules.CanManage(isPlatformAdmin, userId, managerId))
            context.Succeed(requirement);
    }
}
