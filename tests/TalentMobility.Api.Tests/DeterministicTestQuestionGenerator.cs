using TalentMobility.Application.Interfaces;
using TalentMobility.Domain.Enums;

namespace TalentMobility.Api.Tests;

internal sealed class DeterministicTestQuestionGenerator : IQuestionGenerationService
{
    public Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(
        string competencyId,
        string technologyId,
        string skillLevel,
        int count,
        QuestionSourceMode source,
        CancellationToken cancellationToken = default)
    {
        var prefix = source == QuestionSourceMode.Bank ? "Bank" : "Ai";
        var questions = Enumerable.Range(1, count).Select(i => new GeneratedQuestion(
            $"{prefix} integration-test question {i} for {technologyId} at {skillLevel} level.",
            ["Correct option", "Incorrect option A", "Incorrect option B", "Incorrect option C"],
            0)).ToList();
        return Task.FromResult<IReadOnlyList<GeneratedQuestion>>(questions);
    }
}
