using TalentMobility.Infrastructure.Persistence;
using Xunit;

namespace TalentMobility.Application.Tests;

public class CatalogQuestionSeedBuilderTests
{
    [Fact]
    public void Bank_items_are_unique_within_level_and_differ_across_levels()
    {
        var beginner = CreateSet("beginner", "Beginner");
        var intermediate = CreateSet("intermediate", "Intermediate");
        var advance = CreateSet("advance", "Advance");

        Assert.Equal(12, beginner.Count);
        Assert.Equal(12, intermediate.Count);
        Assert.Equal(12, advance.Count);

        AssertUniqueStems(beginner);
        AssertUniqueStems(intermediate);
        AssertUniqueStems(advance);

        for (var i = 0; i < 12; i++)
        {
            Assert.NotEqual(beginner[i].Stem, intermediate[i].Stem);
            Assert.NotEqual(beginner[i].Stem, advance[i].Stem);
            Assert.NotEqual(intermediate[i].Stem, advance[i].Stem);
        }
    }

    private static List<(string Stem, string OptionsJson)> CreateSet(string levelId, string levelLabel)
    {
        return Enumerable.Range(1, 12)
            .Select(i => CatalogQuestionSeedBuilder.Create(
                "dotnet",
                "csharp",
                levelId,
                i,
                ".NET",
                "C#",
                levelLabel))
            .Select(q => (q.Stem, q.OptionsJson))
            .ToList();
    }

    private static void AssertUniqueStems(IEnumerable<(string Stem, string OptionsJson)> items)
    {
        var stems = items.Select(i => i.Stem.Trim()).ToList();
        Assert.Equal(stems.Count, stems.Distinct(StringComparer.OrdinalIgnoreCase).Count());
    }
}
