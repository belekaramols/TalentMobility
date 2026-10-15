using Microsoft.EntityFrameworkCore;
using TalentMobility.Application.Abstractions;
using TalentMobility.Application.Authorization;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Exceptions;
using TalentMobility.Application.Interfaces;
using TalentMobility.Application.Validation;
using TalentMobility.Domain.Entities;
using TalentMobility.Domain.Enums;

namespace TalentMobility.Application.Services;

public class AssignmentService : IAssignmentService
{
    private readonly IApplicationDbContext _db;
    private readonly IAssessmentCatalogService _catalog;

    public AssignmentService(IApplicationDbContext db, IAssessmentCatalogService catalog)
    {
        _db = db;
        _catalog = catalog;
    }

    public async Task<AssessmentConfigDto> GetConfigAsync(CancellationToken cancellationToken)
    {
        var config = await _db.AssessmentConfigurations.AsNoTracking().FirstAsync(cancellationToken);
        return Map(config);
    }

    public async Task<AssessmentConfigDto> UpdateConfigAsync(UpdateAssessmentConfigRequest request, CancellationToken cancellationToken)
    {
        RequestRules.EnsureValid(RequestRules.ValidateConfig(request));
        var config = await _db.AssessmentConfigurations.FirstAsync(cancellationToken);
        config.ManualAssignmentEnabled = request.ManualAssignmentEnabled;
        config.NotifyEmployeeOnAssignment = request.NotifyEmployeeOnAssignment;
        config.DefaultDueDays = request.DefaultDueDays;
        await _db.SaveChangesAsync(cancellationToken);
        return Map(config);
    }

    public async Task<AssignmentDto?> CreateAsync(Guid managerId, bool isPlatformAdmin, CreateAssignmentRequest request, CancellationToken cancellationToken)
    {
        RequestRules.EnsureValid(RequestRules.ValidateAssignment(request));
        var config = await _db.AssessmentConfigurations.AsNoTracking().FirstAsync(cancellationToken);
        if (!config.ManualAssignmentEnabled)
            throw new RequestValidationException(new Dictionary<string, string[]> { ["manualAssignmentEnabled"] = ["Manual assignment is disabled."] });

        var employee = await _db.EmployeeProfiles.AsNoTracking()
            .Where(e => e.Id == request.EmployeeId)
            .Select(e => new { e.Id, e.ManagerEmployeeId })
            .FirstOrDefaultAsync(cancellationToken);
        if (employee is null) return null;
        if (!TeamAccessRules.CanManage(isPlatformAdmin, managerId, employee.ManagerEmployeeId))
            throw new AccessDeniedException();

        var competency = _catalog.GetCompetencies().FirstOrDefault(c => c.Id == request.CompetencyId);
        var technology = competency?.Technologies.FirstOrDefault(t => t.Id == request.TechnologyId);
        var level = _catalog.GetSkillLevels().FirstOrDefault(l => l.Id == request.SkillLevel);
        if (competency is null || technology is null || level is null)
            throw new RequestValidationException(new Dictionary<string, string[]> { ["catalog"] = ["Select a valid competency, technology, and skill level."] });

        var managerName = await _db.EmployeeProfiles.AsNoTracking()
            .Where(e => e.Id == managerId)
            .Select(e => e.FullName)
            .FirstAsync(cancellationToken);
        var assignment = new TestAssignment
        {
            Id = Guid.NewGuid(),
            EmployeeProfileId = request.EmployeeId,
            AssignedByEmployeeId = managerId,
            CompetencyId = competency.Id,
            CompetencyLabel = competency.Label,
            TechnologyId = technology.Id,
            TechnologyLabel = technology.Label,
            SkillLevel = level.Id,
            Notes = request.Notes,
            DueDateUtc = request.DueDateUtc ?? DateTime.UtcNow.AddDays(config.DefaultDueDays),
            Status = AssignmentStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.TestAssignments.Add(assignment);
        await _db.SaveChangesAsync(cancellationToken);
        return new AssignmentDto(assignment.Id, managerName, assignment.CompetencyLabel, assignment.TechnologyLabel,
            assignment.SkillLevel, assignment.DueDateUtc, assignment.Status.ToString(), null);
    }

    public async Task<PagedResult<AssignmentDto>> GetForEmployeeAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken)
    {
        var (normalizedPage, normalizedSize) = Paging.Normalize(page, pageSize);
        var query = _db.TestAssignments.AsNoTracking()
            .Where(a => a.EmployeeProfileId == userId && a.Status != AssignmentStatus.Cancelled);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.CreatedAtUtc)
            .Skip((normalizedPage - 1) * normalizedSize)
            .Take(normalizedSize)
            .Select(a => new AssignmentDto(
                a.Id,
                a.AssignedBy.FullName,
                a.CompetencyLabel,
                a.TechnologyLabel,
                a.SkillLevel,
                a.DueDateUtc,
                a.Status.ToString(),
                a.AssessmentAttemptId))
            .ToListAsync(cancellationToken);
        return new PagedResult<AssignmentDto>(items, normalizedPage, normalizedSize, total);
    }

    private static AssessmentConfigDto Map(AssessmentConfiguration config) =>
        new(config.ManualAssignmentEnabled, config.NotifyEmployeeOnAssignment, config.DefaultDueDays, config.MaxRetakeCount, config.QuestionCount);
}
