using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TalentMobility.Application.Constants;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;
using TalentMobility.Domain.Entities;
using TalentMobility.Domain.Enums;
using TalentMobility.Infrastructure.Persistence;
using TalentMobility.Infrastructure.Security;

namespace TalentMobility.Infrastructure.Services;

public class AuthService
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;

    public AuthService(ApplicationDbContext db, IHttpContextAccessor http)
    {
        _db = db;
        _http = http;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.EmployeeProfiles
            .Include(e => e.Credential)
            .Include(e => e.Roles)
            .FirstOrDefaultAsync(e => e.UserName.ToLower() == request.Email.Trim().ToLower());

        if (user?.Credential is null || !PasswordHasherService.Verify(request.Password, user.Credential.PasswordHash))
            return null;

        var roles = user.Roles.Select(r => r.Role.ToString()).ToList();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.UserName),
            new(ClaimTypes.Name, user.FullName)
        };
        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var identity = new ClaimsIdentity(claims, AuthConstants.CookieScheme);
        await _http.HttpContext!.SignInAsync(AuthConstants.CookieScheme, new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true, ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8) });

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            EmployeeProfileId = user.Id,
            Action = "Login",
            CreatedAtUtc = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        return new LoginResponse(user.Id, user.UserName, user.FullName, roles);
    }

    public async Task LogoutAsync() => await _http.HttpContext!.SignOutAsync(AuthConstants.CookieScheme);

    public Guid? GetCurrentUserId()
    {
        var id = _http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var g) ? g : null;
    }

    public async Task<CurrentUserDto?> GetCurrentUserAsync()
    {
        var id = GetCurrentUserId();
        if (id is null) return null;
        var user = await _db.EmployeeProfiles.Include(e => e.Roles).FirstOrDefaultAsync(e => e.Id == id);
        if (user is null) return null;
        return new CurrentUserDto(
            user.Id,
            user.UserName,
            user.FullName,
            user.Designation,
            user.CompetencyName,
            user.ProfilePicUrl,
            user.Roles.Select(r => r.Role.ToString()).ToList());
    }
}

public class NavigationService
{
    public IReadOnlyList<NavigationGroupDto> GetForRoles(IEnumerable<string> roles)
    {
        var isManager = roles.Any(r => r is "Manager" or "Administrator");
        if (isManager) return ManagerNav();
        return EmployeeNav();
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

public class AssessmentService
{
    private readonly ApplicationDbContext _db;
    private readonly IAssessmentCatalogService _catalog;
    private readonly IQuestionGenerator _generator;

    public AssessmentService(ApplicationDbContext db, IAssessmentCatalogService catalog, IQuestionGenerator generator)
    {
        _db = db;
        _catalog = catalog;
        _generator = generator;
    }

    public async Task<AttemptInProgressDto?> StartAttemptAsync(Guid userId, StartAttemptRequest request)
    {
        var comp = _catalog.GetCompetencies().FirstOrDefault(c => c.Id == request.CompetencyId);
        var tech = comp?.Technologies.FirstOrDefault(t => t.Id == request.TechnologyId);
        if (comp is null || tech is null) return null;

        var config = await _db.AssessmentConfigurations.FirstAsync();
        var source = AttemptSource.Self;
        Guid? assignedBy = null;
        Guid? assignmentId = null;

        if (request.AssignmentId is Guid aid)
        {
            var assignment = await _db.TestAssignments.FirstOrDefaultAsync(a => a.Id == aid && a.EmployeeProfileId == userId);
            if (assignment is null) return null;
            assignment.Status = AssignmentStatus.InProgress;
            assignmentId = assignment.Id;
            source = AttemptSource.ManagerAssigned;
            assignedBy = assignment.AssignedByEmployeeId;
        }

        var attempt = new AssessmentAttempt
        {
            Id = Guid.NewGuid(),
            EmployeeProfileId = userId,
            CompetencyId = comp.Id,
            CompetencyLabel = comp.Label,
            TechnologyId = tech.Id,
            TechnologyLabel = tech.Label,
            SkillLevel = request.SkillLevel,
            Status = AttemptStatus.InProgress,
            Source = source,
            AssignedByEmployeeId = assignedBy,
            TestAssignmentId = assignmentId,
            StartedAtUtc = DateTime.UtcNow,
            MaxScore = config.QuestionCount
        };

        var generated = _generator.Generate(comp.Id, tech.Id, request.SkillLevel, config.QuestionCount);
        var order = 1;
        foreach (var q in generated)
        {
            attempt.Questions.Add(new AttemptQuestion
            {
                Id = Guid.NewGuid(),
                AssessmentAttemptId = attempt.Id,
                SortOrder = order++,
                QuestionStem = q.Stem,
                OptionsJson = JsonSerializer.Serialize(q.Options),
                CorrectOptionIndex = q.CorrectIndex
            });
        }

        _db.AssessmentAttempts.Add(attempt);
        await _db.SaveChangesAsync();
        return MapInProgress(attempt);
    }

    public async Task<AttemptInProgressDto?> GetAttemptAsync(Guid userId, Guid attemptId)
    {
        var attempt = await _db.AssessmentAttempts
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.EmployeeProfileId == userId && a.Status == AttemptStatus.InProgress);
        return attempt is null ? null : MapInProgress(attempt);
    }

    public async Task<AttemptResultDto?> SubmitAsync(Guid userId, Guid attemptId, SubmitAttemptRequest request)
    {
        var attempt = await _db.AssessmentAttempts
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.EmployeeProfileId == userId);
        if (attempt is null || attempt.Status != AttemptStatus.InProgress) return null;

        foreach (var answer in request.Answers)
        {
            var q = attempt.Questions.FirstOrDefault(x => x.Id == answer.QuestionId);
            if (q is null) continue;
            q.SelectedOptionIndex = answer.SelectedOptionIndex;
            q.IsCorrect = answer.SelectedOptionIndex == q.CorrectOptionIndex;
        }

        attempt.Score = attempt.Questions.Count(q => q.IsCorrect == true);
        attempt.Status = AttemptStatus.Completed;
        attempt.CompletedAtUtc = DateTime.UtcNow;

        if (attempt.TestAssignmentId is Guid tid)
        {
            var assignment = await _db.TestAssignments.FindAsync(tid);
            if (assignment is not null)
            {
                assignment.Status = AssignmentStatus.Completed;
                assignment.AssessmentAttemptId = attempt.Id;
            }
        }

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            EmployeeProfileId = userId,
            Action = "AssessmentSubmitted",
            MetadataJson = JsonSerializer.Serialize(new { attemptId, attempt.Score, attempt.MaxScore }),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return MapResult(attempt);
    }

    public async Task<IReadOnlyList<AttemptSummaryDto>> GetHistoryAsync(Guid userId) =>
        await _db.AssessmentAttempts
            .Where(a => a.EmployeeProfileId == userId)
            .OrderByDescending(a => a.StartedAtUtc)
            .Select(a => new AttemptSummaryDto(
                a.Id,
                a.CompetencyLabel,
                a.TechnologyLabel,
                a.SkillLevel,
                a.Status == AttemptStatus.Completed ? a.Score : null,
                a.MaxScore,
                a.Status.ToString(),
                a.Source.ToString(),
                a.StartedAtUtc,
                a.CompletedAtUtc))
            .ToListAsync();

    public async Task<AttemptResultDto?> GetDetailAsync(Guid userId, Guid attemptId, bool isManager)
    {
        var attempt = await _db.AssessmentAttempts
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.Status == AttemptStatus.Completed);
        if (attempt is null) return null;
        if (!isManager && attempt.EmployeeProfileId != userId) return null;
        return MapResult(attempt);
    }

    private static AttemptInProgressDto MapInProgress(AssessmentAttempt attempt)
    {
        var questions = attempt.Questions.OrderBy(q => q.SortOrder).Select(q =>
        {
            var opts = JsonSerializer.Deserialize<List<string>>(q.OptionsJson) ?? new List<string>();
            return new QuestionClientDto(q.Id, q.SortOrder, q.QuestionStem, opts);
        }).ToList();

        return new AttemptInProgressDto(
            attempt.Id,
            attempt.CompetencyLabel,
            attempt.TechnologyLabel,
            attempt.SkillLevel,
            questions);
    }

    private static AttemptResultDto MapResult(AssessmentAttempt attempt)
    {
        var questions = attempt.Questions.OrderBy(q => q.SortOrder).Select(q =>
        {
            var opts = JsonSerializer.Deserialize<List<string>>(q.OptionsJson) ?? new List<string>();
            return new QuestionResultDto(
                q.Id,
                q.SortOrder,
                q.QuestionStem,
                opts,
                q.SelectedOptionIndex,
                q.CorrectOptionIndex,
                q.IsCorrect == true);
        }).ToList();

        var correct = questions.Count(q => q.IsCorrect);
        return new AttemptResultDto(
            attempt.Id,
            attempt.Score,
            attempt.MaxScore,
            correct,
            questions.Count - correct,
            questions);
    }
}

public class AssignmentService
{
    private readonly ApplicationDbContext _db;

    public AssignmentService(ApplicationDbContext db) => _db = db;

    public async Task<AssessmentConfigDto> GetConfigAsync()
    {
        var c = await _db.AssessmentConfigurations.FirstAsync();
        return new AssessmentConfigDto(c.ManualAssignmentEnabled, c.NotifyEmployeeOnAssignment, c.DefaultDueDays, c.MaxRetakeCount, c.QuestionCount);
    }

    public async Task<AssessmentConfigDto> UpdateConfigAsync(UpdateAssessmentConfigRequest request)
    {
        var c = await _db.AssessmentConfigurations.FirstAsync();
        c.ManualAssignmentEnabled = request.ManualAssignmentEnabled;
        c.NotifyEmployeeOnAssignment = request.NotifyEmployeeOnAssignment;
        c.DefaultDueDays = request.DefaultDueDays;
        await _db.SaveChangesAsync();
        return new AssessmentConfigDto(c.ManualAssignmentEnabled, c.NotifyEmployeeOnAssignment, c.DefaultDueDays, c.MaxRetakeCount, c.QuestionCount);
    }

    public async Task<AssignmentDto?> CreateAsync(Guid managerId, CreateAssignmentRequest request)
    {
        var config = await _db.AssessmentConfigurations.FirstAsync();
        if (!config.ManualAssignmentEnabled) return null;

        var comp = await _db.EmployeeProfiles.FindAsync(request.EmployeeId);
        if (comp is null) return null;

        var catalog = new AssessmentCatalogService();
        var competency = catalog.GetCompetencies().FirstOrDefault(c => c.Id == request.CompetencyId);
        var tech = competency?.Technologies.FirstOrDefault(t => t.Id == request.TechnologyId);
        if (competency is null || tech is null) return null;

        var due = request.DueDateUtc ?? DateTime.UtcNow.AddDays(config.DefaultDueDays);
        var assignment = new TestAssignment
        {
            Id = Guid.NewGuid(),
            EmployeeProfileId = request.EmployeeId,
            AssignedByEmployeeId = managerId,
            CompetencyId = competency.Id,
            CompetencyLabel = competency.Label,
            TechnologyId = tech.Id,
            TechnologyLabel = tech.Label,
            SkillLevel = request.SkillLevel,
            Notes = request.Notes,
            DueDateUtc = due,
            Status = AssignmentStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.TestAssignments.Add(assignment);
        await _db.SaveChangesAsync();

        var manager = await _db.EmployeeProfiles.FindAsync(managerId);
        return new AssignmentDto(assignment.Id, manager?.FullName ?? "Manager", assignment.CompetencyLabel,
            assignment.TechnologyLabel, assignment.SkillLevel, assignment.DueDateUtc, assignment.Status.ToString(), null);
    }

    public async Task<IReadOnlyList<AssignmentDto>> GetForEmployeeAsync(Guid userId)
    {
        var list = await _db.TestAssignments
            .Where(a => a.EmployeeProfileId == userId && a.Status != AssignmentStatus.Cancelled)
            .OrderByDescending(a => a.CreatedAtUtc)
            .ToListAsync();

        var result = new List<AssignmentDto>();
        foreach (var a in list)
        {
            var by = await _db.EmployeeProfiles.FindAsync(a.AssignedByEmployeeId);
            result.Add(new AssignmentDto(a.Id, by?.FullName ?? "Manager", a.CompetencyLabel, a.TechnologyLabel,
                a.SkillLevel, a.DueDateUtc, a.Status.ToString(), a.AssessmentAttemptId));
        }
        return result;
    }
}

public class ManagerService
{
    private readonly ApplicationDbContext _db;

    public ManagerService(ApplicationDbContext db) => _db = db;

    public async Task<ManagerDashboardDto> GetDashboardAsync()
    {
        var employees = await _db.UserRoleAssignments
            .Where(r => r.Role == AppRole.Employee)
            .Select(r => r.EmployeeProfileId)
            .ToListAsync();

        var members = new List<TeamMemberAssessmentSummaryDto>();
        foreach (var id in employees)
        {
            var e = await _db.EmployeeProfiles.FindAsync(id);
            if (e is null) continue;
            var attempts = await _db.AssessmentAttempts.Where(a => a.EmployeeProfileId == id && a.Status == AttemptStatus.Completed).ToListAsync();
            decimal? latest = attempts.OrderByDescending(a => a.CompletedAtUtc).Select(a => (decimal?)a.Score / a.MaxScore * 100).FirstOrDefault();
            decimal? best = attempts.Count == 0 ? null : attempts.Max(a => (decimal)a.Score / a.MaxScore * 100);
            members.Add(new TeamMemberAssessmentSummaryDto(id, e.FullName, e.UserName, e.CompetencyName, attempts.Count, latest, best));
        }

        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthAttempts = await _db.AssessmentAttempts.CountAsync(a => a.CompletedAtUtc >= monthStart);
        var avg = members.Where(m => m.LatestScorePercent.HasValue).Select(m => m.LatestScorePercent!.Value).DefaultIfEmpty(0).Average();

        return new ManagerDashboardDto(members.Count, monthAttempts, Math.Round(avg, 1), members);
    }

    public async Task<IReadOnlyList<EmployeeListItemDto>> GetEmployeesAsync() =>
        await _db.UserRoleAssignments
            .Where(r => r.Role == AppRole.Employee)
            .Join(_db.EmployeeProfiles, r => r.EmployeeProfileId, e => e.Id, (_, e) => e)
            .Select(e => new EmployeeListItemDto(e.Id, e.FullName, e.UserName, e.Designation, e.BusinessUnitName))
            .ToListAsync();

    public async Task<MatchingWeightsDto> GetWeightsAsync()
    {
        var w = await _db.MatchingWeightConfigs.FirstAsync();
        return new MatchingWeightsDto(w.RequiredSkillMatchPercent, w.ExperiencePercent, w.AvailabilityPercent, w.CertificationPercent);
    }

    public async Task<MatchingWeightsDto> UpdateWeightsAsync(MatchingWeightsDto dto)
    {
        var w = await _db.MatchingWeightConfigs.FirstAsync();
        w.RequiredSkillMatchPercent = dto.RequiredSkillMatchPercent;
        w.ExperiencePercent = dto.ExperiencePercent;
        w.AvailabilityPercent = dto.AvailabilityPercent;
        w.CertificationPercent = dto.CertificationPercent;
        await _db.SaveChangesAsync();
        return dto;
    }

    public async Task<IReadOnlyList<AuditLog>> GetAuditAsync(int take = 50) =>
        await _db.AuditLogs.OrderByDescending(a => a.CreatedAtUtc).Take(take).ToListAsync();
}
