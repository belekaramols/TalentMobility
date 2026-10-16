using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace TalentMobility.Infrastructure.Persistence;

/// <summary>
/// Ensures catalog tables exist on databases created before catalog entities were added (EnsureCreated does not upgrade schema).
/// </summary>
internal static class CatalogSchemaBootstrap
{
    public static async Task EnsureAsync(ApplicationDbContext db, ILogger logger, CancellationToken cancellationToken = default)
    {
        var provider = db.Database.ProviderName ?? "";
        if (db.Database.IsSqlServer())
            await db.Database.ExecuteSqlRawAsync(SqlServer, cancellationToken);
        else if (provider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
            await db.Database.ExecuteSqlRawAsync(Sqlite, cancellationToken);
        else
            logger.LogWarning("Catalog schema bootstrap skipped for provider {Provider}.", provider);
    }

    private const string SqlServer = """
        IF OBJECT_ID(N'CatalogCompetencies', N'U') IS NULL
        BEGIN
            CREATE TABLE CatalogCompetencies (
                Id nvarchar(64) NOT NULL PRIMARY KEY,
                Label nvarchar(128) NOT NULL,
                SortOrder int NOT NULL,
                IsActive bit NOT NULL CONSTRAINT DF_CatalogCompetencies_IsActive DEFAULT 1
            );
        END;

        IF OBJECT_ID(N'CatalogSkillLevels', N'U') IS NULL
        BEGIN
            CREATE TABLE CatalogSkillLevels (
                Id nvarchar(64) NOT NULL PRIMARY KEY,
                Label nvarchar(64) NOT NULL,
                Description nvarchar(512) NOT NULL CONSTRAINT DF_CatalogSkillLevels_Description DEFAULT N'',
                SortOrder int NOT NULL,
                IsActive bit NOT NULL CONSTRAINT DF_CatalogSkillLevels_IsActive DEFAULT 1
            );
        END;

        IF OBJECT_ID(N'CatalogTechnologies', N'U') IS NULL
        BEGIN
            CREATE TABLE CatalogTechnologies (
                Id nvarchar(64) NOT NULL,
                CompetencyId nvarchar(64) NOT NULL,
                Label nvarchar(128) NOT NULL,
                SortOrder int NOT NULL,
                IsActive bit NOT NULL CONSTRAINT DF_CatalogTechnologies_IsActive DEFAULT 1,
                CONSTRAINT PK_CatalogTechnologies PRIMARY KEY (CompetencyId, Id),
                CONSTRAINT FK_CatalogTechnologies_CatalogCompetencies
                    FOREIGN KEY (CompetencyId) REFERENCES CatalogCompetencies(Id) ON DELETE CASCADE
            );
        END;

        IF OBJECT_ID(N'CatalogQuestions', N'U') IS NULL
        BEGIN
            CREATE TABLE CatalogQuestions (
                Id uniqueidentifier NOT NULL PRIMARY KEY,
                CompetencyId nvarchar(64) NOT NULL,
                TechnologyId nvarchar(64) NOT NULL,
                SkillLevelId nvarchar(64) NOT NULL,
                Stem nvarchar(max) NOT NULL,
                OptionsJson nvarchar(max) NOT NULL,
                CorrectOptionIndex int NOT NULL,
                SortOrder int NOT NULL,
                IsActive bit NOT NULL CONSTRAINT DF_CatalogQuestions_IsActive DEFAULT 1
            );
            CREATE INDEX IX_CatalogQuestions_Lookup
                ON CatalogQuestions (CompetencyId, TechnologyId, SkillLevelId, IsActive);
        END;
        """;

    private const string Sqlite = """
        CREATE TABLE IF NOT EXISTS CatalogCompetencies (
            Id TEXT NOT NULL PRIMARY KEY,
            Label TEXT NOT NULL,
            SortOrder INTEGER NOT NULL,
            IsActive INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS CatalogSkillLevels (
            Id TEXT NOT NULL PRIMARY KEY,
            Label TEXT NOT NULL,
            Description TEXT NOT NULL DEFAULT '',
            SortOrder INTEGER NOT NULL,
            IsActive INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS CatalogTechnologies (
            Id TEXT NOT NULL,
            CompetencyId TEXT NOT NULL,
            Label TEXT NOT NULL,
            SortOrder INTEGER NOT NULL,
            IsActive INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (CompetencyId, Id),
            FOREIGN KEY (CompetencyId) REFERENCES CatalogCompetencies(Id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS CatalogQuestions (
            Id TEXT NOT NULL PRIMARY KEY,
            CompetencyId TEXT NOT NULL,
            TechnologyId TEXT NOT NULL,
            SkillLevelId TEXT NOT NULL,
            Stem TEXT NOT NULL,
            OptionsJson TEXT NOT NULL,
            CorrectOptionIndex INTEGER NOT NULL,
            SortOrder INTEGER NOT NULL,
            IsActive INTEGER NOT NULL DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS IX_CatalogQuestions_Lookup
            ON CatalogQuestions (CompetencyId, TechnologyId, SkillLevelId, IsActive);
        """;
}
