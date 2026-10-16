using TalentMobility.Application.Interfaces;
using TalentMobility.Application.Services;

namespace TalentMobility.Infrastructure.Services;

/// <summary>Deterministic fallback when Gemini is unavailable or misconfigured.</summary>
public class TemplateQuestionGenerator : IQuestionGenerator
{
    public Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(
        string competencyId,
        string technologyId,
        string skillLevel,
        int count,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(Build(competencyId, technologyId, skillLevel, count));

    private static IReadOnlyList<GeneratedQuestion> Build(string competencyId, string technologyId, string skillLevel, int count)
    {
        var tech = technologyId.Replace('-', ' ');
        var level = skillLevel.Replace('-', ' ');
        var list = new List<GeneratedQuestion>();
        for (var i = 1; i <= count; i++)
        {
            var stem = $"[{competencyId} · {tech} · {level}] Question {i}: Which practice best reflects {tech} at {level} level?";
            var correct = Pick(i, new[]
            {
                $"Apply {tech} patterns with clear tradeoffs and measurable quality checks",
                $"Use {tech} idioms appropriate for {level} complexity and team standards",
                $"Design {tech} solutions with testing, observability, and maintainability in mind",
                $"Align {tech} implementation choices with security and performance goals",
            });
            var options = new List<string> { correct };
            options.AddRange(PickDistractors(i, tech, level));
            var shuffled = QuestionGenerationNormalizer.ShuffleOptions(
                new GeneratedQuestion(stem, options, 0));
            list.Add(shuffled);
        }

        return list;
    }

    private static string Pick(int index, string[] values) => values[(index - 1) % values.Length];

    private static IEnumerable<string> PickDistractors(int index, string tech, string level)
    {
        yield return $"Skip code review and rely only on informal {tech} knowledge";
        yield return $"Ignore edge cases because {level} work should stay minimal";
        yield return $"Disable automated tests to ship {tech} changes faster";
    }
}
