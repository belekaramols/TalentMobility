using TalentMobility.Application.Interfaces;

namespace TalentMobility.Api.Tests;

internal sealed class DeterministicTestQuestionGenerator : IQuestionGenerator
{
    public Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(
        string competencyId,
        string technologyId,
        string skillLevel,
        int count,
        CancellationToken cancellationToken = default)
    {
        var questions = Enumerable.Range(1, count).Select(i => new GeneratedQuestion(
            $"Deterministic integration-test question {i} for {technologyId} at {skillLevel} level.",
            ["Correct option", "Incorrect option A", "Incorrect option B", "Incorrect option C"],
            0)).ToList();
        return Task.FromResult<IReadOnlyList<GeneratedQuestion>>(questions);
    }
}
