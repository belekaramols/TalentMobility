using Microsoft.EntityFrameworkCore;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;
using TalentMobility.Infrastructure.Persistence;

namespace TalentMobility.Infrastructure.Services;

public sealed class DbAssessmentCatalogService : IAssessmentCatalogService
{
    private readonly ApplicationDbContext _db;

    public DbAssessmentCatalogService(ApplicationDbContext db) => _db = db;

    public IReadOnlyList<CompetencyCatalogDto> GetCompetencies()
    {
        return _db.CatalogCompetencies.AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .Include(c => c.Technologies)
            .AsEnumerable()
            .Select(c => new CompetencyCatalogDto(
                c.Id,
                c.Label,
                c.Technologies
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.SortOrder)
                    .Select(t => new TechnologyCatalogDto(t.Id, t.Label))
                    .ToList()))
            .ToList();
    }

    public IReadOnlyList<SkillLevelDto> GetSkillLevels() =>
        _db.CatalogSkillLevels.AsNoTracking()
            .Where(l => l.IsActive)
            .OrderBy(l => l.SortOrder)
            .Select(l => new SkillLevelDto(l.Id, l.Label, l.Description))
            .ToList();
}
