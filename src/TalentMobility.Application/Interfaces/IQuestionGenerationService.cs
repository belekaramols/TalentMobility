using TalentMobility.Domain.Enums;

namespace TalentMobility.Application.Interfaces;

public interface IQuestionGenerationService
{
    Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(
        string competencyId,
        string technologyId,
        string skillLevel,
        int count,
        QuestionSourceMode source,
        CancellationToken cancellationToken = default);
}
