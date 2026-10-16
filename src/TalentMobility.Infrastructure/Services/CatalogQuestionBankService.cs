using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TalentMobility.Application.Interfaces;
using TalentMobility.Application.Services;
using TalentMobility.Infrastructure.Persistence;

namespace TalentMobility.Infrastructure.Services;

public sealed class CatalogQuestionBankService : ICatalogQuestionBank
{
    private readonly ApplicationDbContext _db;

    public CatalogQuestionBankService(ApplicationDbContext db) => _db = db;

    public Task<int> CountAvailableAsync(
        string competencyId,
        string technologyId,
        string skillLevelId,
        CancellationToken cancellationToken = default) =>
        _db.CatalogQuestions.AsNoTracking()
            .CountAsync(
                q => q.IsActive
                    && q.CompetencyId == competencyId
                    && q.TechnologyId == technologyId
                    && q.SkillLevelId == skillLevelId,
                cancellationToken);

    public async Task<IReadOnlyList<GeneratedQuestion>> TakeAsync(
        string competencyId,
        string technologyId,
        string skillLevelId,
        int count,
        CancellationToken cancellationToken = default)
    {
        var pool = await _db.CatalogQuestions.AsNoTracking()
            .Where(q => q.IsActive
                && q.CompetencyId == competencyId
                && q.TechnologyId == technologyId
                && q.SkillLevelId == skillLevelId)
            .ToListAsync(cancellationToken);

        if (pool.Count < count)
            return Array.Empty<GeneratedQuestion>();

        var rows = pool
            .OrderBy(_ => Random.Shared.Next())
            .Take(count)
            .ToList();

        var mapped = rows.Select(row =>
        {
            var options = JsonSerializer.Deserialize<List<string>>(row.OptionsJson) ?? [];
            return new GeneratedQuestion(row.Stem, options, row.CorrectOptionIndex);
        }).ToList();

        return QuestionGenerationNormalizer.Prepare(mapped, count, shuffleOptions: true);
    }
}
