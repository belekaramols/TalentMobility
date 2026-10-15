using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TalentMobility.Application.Constants;
using TalentMobility.Domain.Entities;
using TalentMobility.Domain.Enums;
using TalentMobility.Infrastructure.Security;

namespace TalentMobility.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        await db.Database.EnsureCreatedAsync();
        if (db.Database.IsSqlServer())
            await EnsureManagerColumnAsync(db);

        if (!await db.EmployeeProfiles.AnyAsync())
        {
            logger.LogInformation("Seeding database...");
            await SeedAsync(db);
        }

        await BackfillTeamAsync(db);
    }

    private static async Task EnsureManagerColumnAsync(ApplicationDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            IF COL_LENGTH(N'EmployeeProfiles', N'ManagerEmployeeId') IS NULL
                ALTER TABLE EmployeeProfiles ADD ManagerEmployeeId uniqueidentifier NULL;
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_EmployeeProfiles_ManagerEmployeeId' AND object_id = OBJECT_ID(N'EmployeeProfiles'))
                CREATE INDEX IX_EmployeeProfiles_ManagerEmployeeId ON EmployeeProfiles(ManagerEmployeeId);
            """);
    }

    private static async Task BackfillTeamAsync(ApplicationDbContext db)
    {
        var leadId = Guid.Parse("11111111-1111-1111-1111-111111111103");
        Guid[] team = [Guid.Parse("11111111-1111-1111-1111-111111111101"), Guid.Parse("11111111-1111-1111-1111-111111111102")];
        await db.EmployeeProfiles
            .Where(e => team.Contains(e.Id) && e.ManagerEmployeeId == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(e => e.ManagerEmployeeId, leadId));
    }

    private static async Task SeedAsync(ApplicationDbContext db)
    {
        var amolId = Guid.Parse("11111111-1111-1111-1111-111111111101");
        var rahulId = Guid.Parse("11111111-1111-1111-1111-111111111102");
        var leadId = Guid.Parse("11111111-1111-1111-1111-111111111103");

        var amol = new EmployeeProfile
        {
            Id = amolId,
            NewerId = 6419,
            UserName = "amol.belekar@tothenew.com",
            FullName = "Amol Sambhaji Belekar",
            FirstName = "Amol",
            MiddleName = "Sambhaji",
            LastName = "Belekar",
            ProfilePicUrl = "https://newersworld-sf-static.tothenew.net/prod/profilePicFolder/c0237ac7-e6ec-42ab-abe8-e2daf4ec9a34_Amol-Sambhaji-Belekar-Profile-Pitcure.jpeg",
            MobileNumber = "+91-7218900400",
            Designation = "Associate Technical Lead",
            CompetencyId = 65,
            CompetencyName = ".Net",
            TechCompetencyId = "65",
            BusinessUnitName = "Beach",
            BusinessUnitId = 23,
            HrRoleName = "Newer",
            HrRoleId = 1,
            ManagerEmployeeId = leadId,
            CompetencyHeadNames = "Sushil Ramsukh Jethaliya,Sachin Gupta,Bharat Aggarwal",
            CompetencyHeadEmails = "sushil.jethaliya@tothenew.com,sachin.gupta@tothenew.com,bharat.aggarwal@tothenew.com",
            CreatedAtUtc = DateTime.UtcNow
        };

        var rahul = new EmployeeProfile
        {
            Id = rahulId,
            NewerId = 7001,
            UserName = "rahul.kumar@tothenew.com",
            FullName = "Rahul Kumar",
            FirstName = "Rahul",
            LastName = "Kumar",
            Designation = "Software Engineer",
            CompetencyName = ".Net",
            BusinessUnitName = "Beach",
            HrRoleName = "Newer",
            ManagerEmployeeId = leadId,
            CreatedAtUtc = DateTime.UtcNow
        };

        var lead = new EmployeeProfile
        {
            Id = leadId,
            NewerId = 8001,
            UserName = "team.lead@tothenew.com",
            FullName = "Team Lead",
            Designation = "Engineering Manager",
            CompetencyName = ".Net",
            BusinessUnitName = "Beach",
            CreatedAtUtc = DateTime.UtcNow
        };

        var hash = PasswordHasherService.Hash(AuthConstants.DevDefaultPassword);

        db.EmployeeProfiles.AddRange(amol, rahul, lead);
        db.UserCredentials.AddRange(
            new UserCredential { EmployeeProfileId = amolId, PasswordHash = hash },
            new UserCredential { EmployeeProfileId = rahulId, PasswordHash = hash },
            new UserCredential { EmployeeProfileId = leadId, PasswordHash = hash });

        db.UserRoleAssignments.AddRange(
            new UserRoleAssignment { Id = Guid.NewGuid(), EmployeeProfileId = amolId, Role = AppRole.Employee },
            new UserRoleAssignment { Id = Guid.NewGuid(), EmployeeProfileId = rahulId, Role = AppRole.Employee },
            new UserRoleAssignment { Id = Guid.NewGuid(), EmployeeProfileId = leadId, Role = AppRole.Manager });

        db.AssessmentConfigurations.Add(new AssessmentConfiguration
        {
            ManualAssignmentEnabled = true,
            NotifyEmployeeOnAssignment = true,
            DefaultDueDays = 7,
            MaxRetakeCount = 5,
            QuestionCount = 10
        });

        db.MatchingWeightConfigs.Add(new MatchingWeightConfig());

        await db.SaveChangesAsync();
    }
}
