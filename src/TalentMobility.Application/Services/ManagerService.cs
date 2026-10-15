using Microsoft.EntityFrameworkCore;
using TalentMobility.Application.Abstractions;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;
using TalentMobility.Application.Validation;
using TalentMobility.Domain.Entities;
using TalentMobility.Domain.Enums;

namespace TalentMobility.Application.Services;

public class ManagerService : IManagerService
{
    private readonly IApplicationDbContext _db;

    public ManagerService(IApplicationDbContext db) => _db = db;

    public async Task<ManagerDashboardDto> GetDashboardAsync(Guid managerId, bool isPlatformAdmin, CancellationToken cancellationToken)
    {
        var people = await Team(managerId, isPlatformAdmin)
            .Select(e => new { e.Id, e.FullName, e.UserName, e.CompetencyName })
            .ToListAsync(cancellationToken);
        var ids = people.Select(p => p.Id).ToList();
        var attempts = await _db.AssessmentAttempts.AsNoTracking()
            .Where(a => ids.Contains(a.EmployeeProfileId) && a.Status == AttemptStatus.Completed)
            .Select(a => new { a.EmployeeProfileId, a.Score, a.MaxScore, a.CompletedAtUtc })
            .ToListAsync(cancellationToken);

        var members = people.Select(person =>
        {
            var own = attempts.Where(a => a.EmployeeProfileId == person.Id).ToList();
            decimal? latest = own.OrderByDescending(a => a.CompletedAtUtc)
                .Select(a => a.MaxScore == 0 ? (decimal?)null : a.Score * 100m / a.MaxScore)
                .FirstOrDefault();
            decimal? best = own.Count == 0 ? null : own.Max(a => a.MaxScore == 0 ? 0 : a.Score * 100m / a.MaxScore);
            return new TeamMemberAssessmentSummaryDto(person.Id, person.FullName, person.UserName, person.CompetencyName, own.Count, latest, best);
        }).ToList();

        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthAttempts = await _db.AssessmentAttempts.AsNoTracking()
            .CountAsync(a => ids.Contains(a.EmployeeProfileId) && a.CompletedAtUtc >= monthStart, cancellationToken);
        var average = members.Where(m => m.LatestScorePercent.HasValue).Select(m => m.LatestScorePercent!.Value).DefaultIfEmpty(0).Average();
        return new ManagerDashboardDto(members.Count, monthAttempts, Math.Round(average, 1), members);
    }

    public async Task<PagedResult<EmployeeListItemDto>> GetEmployeesAsync(Guid managerId, bool isPlatformAdmin, int page, int pageSize, CancellationToken cancellationToken)
    {
        var (normalizedPage, normalizedSize) = Paging.Normalize(page, pageSize);
        var query = Team(managerId, isPlatformAdmin);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(e => e.FullName)
            .Skip((normalizedPage - 1) * normalizedSize)
            .Take(normalizedSize)
            .Select(e => new EmployeeListItemDto(e.Id, e.FullName, e.UserName, e.Designation, e.BusinessUnitName))
            .ToListAsync(cancellationToken);
        return new PagedResult<EmployeeListItemDto>(items, normalizedPage, normalizedSize, total);
    }

    public async Task<MatchingWeightsDto> GetWeightsAsync(CancellationToken cancellationToken)
    {
        var weights = await _db.MatchingWeightConfigs.AsNoTracking().FirstAsync(cancellationToken);
        return Map(weights);
    }

    public async Task<MatchingWeightsDto> UpdateWeightsAsync(MatchingWeightsDto request, CancellationToken cancellationToken)
    {
        RequestRules.EnsureValid(RequestRules.ValidateWeights(request));
        var weights = await _db.MatchingWeightConfigs.FirstAsync(cancellationToken);
        weights.RequiredSkillMatchPercent = request.RequiredSkillMatchPercent;
        weights.ExperiencePercent = request.ExperiencePercent;
        weights.AvailabilityPercent = request.AvailabilityPercent;
        weights.CertificationPercent = request.CertificationPercent;
        await _db.SaveChangesAsync(cancellationToken);
        return Map(weights);
    }

    public async Task<PagedResult<AuditLogDto>> GetAuditAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var (normalizedPage, normalizedSize) = Paging.Normalize(page, pageSize);
        var query = _db.AuditLogs.AsNoTracking();
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.CreatedAtUtc)
            .Skip((normalizedPage - 1) * normalizedSize)
            .Take(normalizedSize)
            .Select(a => new AuditLogDto(
                a.Id,
                a.Action,
                a.CreatedAtUtc,
                _db.EmployeeProfiles.Where(e => a.EmployeeProfileId == e.Id).Select(e => e.FullName).FirstOrDefault()))
            .ToListAsync(cancellationToken);
        return new PagedResult<AuditLogDto>(items, normalizedPage, normalizedSize, total);
    }

    private IQueryable<EmployeeProfile> Team(Guid managerId, bool isPlatformAdmin) =>
        _db.EmployeeProfiles.AsNoTracking().Where(e => isPlatformAdmin || e.ManagerEmployeeId == managerId);

    private static MatchingWeightsDto Map(MatchingWeightConfig weights) =>
        new(weights.RequiredSkillMatchPercent, weights.ExperiencePercent, weights.AvailabilityPercent, weights.CertificationPercent);
}
