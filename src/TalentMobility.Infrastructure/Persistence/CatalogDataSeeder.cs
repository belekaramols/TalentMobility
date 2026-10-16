using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TalentMobility.Application.Constants;
using TalentMobility.Domain.Entities;

namespace TalentMobility.Infrastructure.Persistence;

public static class CatalogDataSeeder
{
    public static async Task SeedIfEmptyAsync(ApplicationDbContext db, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (await db.CatalogCompetencies.AnyAsync(cancellationToken))
            return;

        logger.LogInformation("Seeding assessment catalog from embedded definition...");
        var root = LoadCatalogRoot()
            ?? throw new InvalidOperationException(Messages.System.AssessmentCatalogNotFound);

        var competencyOrder = 0;
        foreach (var competency in root.Competencies)
        {
            db.CatalogCompetencies.Add(new CatalogCompetency
            {
                Id = competency.Id,
                Label = competency.Label,
                SortOrder = competencyOrder++,
                IsActive = true
            });

            var techOrder = 0;
            foreach (var technology in competency.Technologies)
            {
                db.CatalogTechnologies.Add(new CatalogTechnology
                {
                    Id = technology.Id,
                    CompetencyId = competency.Id,
                    Label = technology.Label,
                    SortOrder = techOrder++,
                    IsActive = true
                });
            }
        }

        var levelOrder = 0;
        foreach (var level in root.SkillLevels)
        {
            db.CatalogSkillLevels.Add(new CatalogSkillLevel
            {
                Id = level.Id,
                Label = level.Label,
                Description = level.Description,
                SortOrder = levelOrder++,
                IsActive = true
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        await SeedQuestionsAsync(db, logger, cancellationToken);
    }

    public static async Task SeedQuestionsIfEmptyAsync(ApplicationDbContext db, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (await db.CatalogQuestions.AnyAsync(cancellationToken))
            return;

        if (!await db.CatalogCompetencies.AnyAsync(cancellationToken))
            return;

        await SeedQuestionsAsync(db, logger, cancellationToken);
    }

    /// <summary>Replaces the old generic seed template with level-specific distinct questions.</summary>
    public static async Task RefreshLegacyQuestionBankAsync(ApplicationDbContext db, ILogger logger, CancellationToken cancellationToken = default)
    {
        var hasLegacy = await db.CatalogQuestions.AsNoTracking()
            .AnyAsync(q => q.Stem.Contains("Which practice best reflects"), cancellationToken);
        if (!hasLegacy)
            return;

        logger.LogInformation("Refreshing configured question bank with level-specific items...");
        await db.CatalogQuestions.ExecuteDeleteAsync(cancellationToken);
        await SeedQuestionsAsync(db, logger, cancellationToken);
    }

    private static async Task SeedQuestionsAsync(ApplicationDbContext db, ILogger logger, CancellationToken cancellationToken)
    {
        logger.LogInformation("Seeding configured question bank...");
        var competencies = await db.CatalogCompetencies.AsNoTracking()
            .Include(c => c.Technologies)
            .Where(c => c.IsActive)
            .ToListAsync(cancellationToken);
        var levels = await db.CatalogSkillLevels.AsNoTracking().Where(l => l.IsActive).ToListAsync(cancellationToken);

        foreach (var competency in competencies)
        {
            foreach (var technology in competency.Technologies.Where(t => t.IsActive))
            {
                foreach (var level in levels)
                {
                    for (var i = 1; i <= AppLimits.SeedQuestionsPerBankCombo; i++)
                    {
                        db.CatalogQuestions.Add(CatalogQuestionSeedBuilder.Create(
                            competency.Id,
                            technology.Id,
                            level.Id,
                            i,
                            competency.Label,
                            technology.Label,
                            level.Label));
                    }
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static CatalogRoot? LoadCatalogRoot()
    {
        var asm = Assembly.GetExecutingAssembly();
        using var stream = asm.GetManifestResourceStream("TalentMobility.Infrastructure.Data.assessment-catalog.json");
        if (stream is null)
            return null;

        using var reader = new StreamReader(stream);
        return JsonSerializer.Deserialize<CatalogRoot>(reader.ReadToEnd(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    private sealed class CatalogRoot
    {
        public List<SkillLevelItem> SkillLevels { get; set; } = new();
        public List<CompetencyItem> Competencies { get; set; } = new();
    }

    private sealed class SkillLevelItem
    {
        public string Id { get; set; } = "";
        public string Label { get; set; } = "";
        public string Description { get; set; } = "";
    }

    private sealed class CompetencyItem
    {
        public string Id { get; set; } = "";
        public string Label { get; set; } = "";
        public List<TechItem> Technologies { get; set; } = new();
    }

    private sealed class TechItem
    {
        public string Id { get; set; } = "";
        public string Label { get; set; } = "";
    }
}
