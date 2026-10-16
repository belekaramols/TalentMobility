using TalentMobility.Application.Dtos;

namespace TalentMobility.Application.Interfaces;

public interface IQuestionGenerator
{
    Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(
        string competencyId,
        string technologyId,
        string skillLevel,
        int count,
        CancellationToken cancellationToken = default);
}

public record GeneratedQuestion(string Stem, IReadOnlyList<string> Options, int CorrectIndex);
