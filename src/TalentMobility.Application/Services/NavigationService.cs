using TalentMobility.Application.Constants;
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
            new NavigationGroupDto(Messages.Navigation.Employee.GroupHome, new[] { new NavigationItemDto(Messages.Navigation.Employee.Dashboard, "/dashboard", true) }),
            new NavigationGroupDto(Messages.Navigation.Employee.GroupAssessment, new[]
            {
                new NavigationItemDto(Messages.Navigation.Employee.NewTest, "/assessment/new", true),
                new NavigationItemDto(Messages.Navigation.Employee.AssignedTests, "/assessment/assigned", true),
                new NavigationItemDto(Messages.Navigation.Employee.TestHistory, "/assessment/history", true)
            }),
            new NavigationGroupDto(Messages.Navigation.Employee.GroupMyTalent, new[]
            {
                new NavigationItemDto(Messages.Navigation.Employee.Profile, "/profile", true),
                new NavigationItemDto(Messages.Navigation.Employee.Skills, "/skills", true)
            }),
            new NavigationGroupDto(Messages.Navigation.Employee.GroupMobility, new[]
            {
                new NavigationItemDto(Messages.Navigation.Employee.Opportunities, "/opportunities", true),
                new NavigationItemDto(Messages.Navigation.Employee.MyApplications, "/applications", true),
                new NavigationItemDto(Messages.Navigation.Employee.Availability, "/availability", true)
            }),
            new NavigationGroupDto(Messages.Navigation.Employee.GroupGrowth, new[]
            {
                new NavigationItemDto(Messages.Navigation.Employee.CareerInterests, "/career-interests", true),
                new NavigationItemDto(Messages.Navigation.Employee.GrowthPlan, "/growth-plan", true)
            }),
            new NavigationGroupDto(Messages.Navigation.Employee.GroupInsights, new[] { new NavigationItemDto(Messages.Navigation.Employee.Analytics, "/analytics", true) })
        };

    private static IReadOnlyList<NavigationGroupDto> ManagerNav() =>
        new[]
        {
            new NavigationGroupDto(Messages.Navigation.Manager.GroupHome, new[] { new NavigationItemDto(Messages.Navigation.Manager.Dashboard, "/manager/dashboard", true) }),
            new NavigationGroupDto(Messages.Navigation.Manager.GroupTeam, new[]
            {
                new NavigationItemDto(Messages.Navigation.Manager.TeamRoster, "/manager/team", true),
                new NavigationItemDto(Messages.Navigation.Manager.TeamAssessments, "/manager/assessments", true)
            }),
            new NavigationGroupDto(Messages.Navigation.Manager.GroupTalentDeployment, new[]
            {
                new NavigationItemDto(Messages.Navigation.Manager.TalentSearch, "/manager/talent-search", true),
                new NavigationItemDto(Messages.Navigation.Manager.Requirements, "/manager/requirements", true),
                new NavigationItemDto(Messages.Navigation.Manager.Shortlists, "/manager/shortlists", true)
            }),
            new NavigationGroupDto(Messages.Navigation.Manager.GroupMatching, new[]
            {
                new NavigationItemDto(Messages.Navigation.Manager.CandidateMatching, "/manager/matching", true),
                new NavigationItemDto(Messages.Navigation.Manager.MatchingConfiguration, "/manager/matching-config", true)
            }),
            new NavigationGroupDto(Messages.Navigation.Manager.GroupApprovals, new[] { new NavigationItemDto(Messages.Navigation.Manager.MobilityApprovals, "/manager/approvals", true) }),
            new NavigationGroupDto(Messages.Navigation.Manager.GroupGovernance, new[] { new NavigationItemDto(Messages.Navigation.Manager.AuditHistory, "/manager/audit", true) }),
            new NavigationGroupDto(Messages.Navigation.Manager.GroupSettings, new[]
            {
                new NavigationItemDto(Messages.Navigation.Manager.Configurations, "/manager/config", true),
                new NavigationItemDto(Messages.Navigation.Manager.ManualTestAssignment, "/manager/config/assignment", true),
                new NavigationItemDto(Messages.Navigation.Manager.AssignTest, "/manager/assign-test", true)
            })
        };
}
