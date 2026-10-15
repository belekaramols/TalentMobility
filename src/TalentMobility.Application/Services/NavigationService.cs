using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Application.Services;

public class NavigationService : INavigationService
{
    public IReadOnlyList<NavigationGroupDto> GetForRoles(IEnumerable<string> roles)
    {
        var isManager = roles.Any(r => r is "Manager" or "Administrator");
        return isManager ? ManagerNav() : EmployeeNav();
    }

    private static IReadOnlyList<NavigationGroupDto> EmployeeNav() =>
        new[]
        {
            new NavigationGroupDto("Home", new[] { new NavigationItemDto("Dashboard", "/dashboard", true) }),
            new NavigationGroupDto("Assessment", new[]
            {
                new NavigationItemDto("New Test", "/assessment/new", true),
                new NavigationItemDto("Assigned Tests", "/assessment/assigned", true),
                new NavigationItemDto("Test History", "/assessment/history", true)
            }),
            new NavigationGroupDto("My talent", new[]
            {
                new NavigationItemDto("Profile", "/profile", true),
                new NavigationItemDto("Skills", "/skills", true)
            }),
            new NavigationGroupDto("Mobility", new[]
            {
                new NavigationItemDto("Opportunities", "/opportunities", true),
                new NavigationItemDto("My applications", "/applications", true),
                new NavigationItemDto("Availability", "/availability", true)
            }),
            new NavigationGroupDto("Growth", new[]
            {
                new NavigationItemDto("Career interests", "/career-interests", true),
                new NavigationItemDto("Growth plan", "/growth-plan", true)
            }),
            new NavigationGroupDto("Insights", new[] { new NavigationItemDto("Analytics", "/analytics", true) })
        };

    private static IReadOnlyList<NavigationGroupDto> ManagerNav() =>
        new[]
        {
            new NavigationGroupDto("Home", new[] { new NavigationItemDto("Dashboard", "/manager/dashboard", true) }),
            new NavigationGroupDto("Team", new[]
            {
                new NavigationItemDto("Team roster", "/manager/team", true),
                new NavigationItemDto("Team assessments", "/manager/assessments", true)
            }),
            new NavigationGroupDto("Talent deployment", new[]
            {
                new NavigationItemDto("Talent search", "/manager/talent-search", true),
                new NavigationItemDto("Requirements", "/manager/requirements", true),
                new NavigationItemDto("Shortlists", "/manager/shortlists", true)
            }),
            new NavigationGroupDto("Matching", new[]
            {
                new NavigationItemDto("Candidate matching", "/manager/matching", true),
                new NavigationItemDto("Matching configuration", "/manager/matching-config", true)
            }),
            new NavigationGroupDto("Approvals", new[] { new NavigationItemDto("Mobility approvals", "/manager/approvals", true) }),
            new NavigationGroupDto("Governance", new[] { new NavigationItemDto("Audit history", "/manager/audit", true) }),
            new NavigationGroupDto("Settings", new[]
            {
                new NavigationItemDto("Configurations", "/manager/config", true),
                new NavigationItemDto("Manual test assignment", "/manager/config/assignment", true),
                new NavigationItemDto("Assign test", "/manager/assign-test", true)
            })
        };
}
