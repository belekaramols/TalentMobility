using TalentMobility.Application.Constants;
using TalentMobility.Application.Exceptions;
using TalentMobility.Application.Interfaces;
using TalentMobility.Domain.Enums;

namespace TalentMobility.Infrastructure.Services;

public sealed class QuestionGenerationOrchestrator : IQuestionGenerationService
{
    private readonly GeminiQuestionGenerator _gemini;
    private readonly ICatalogQuestionBank _bank;

    public QuestionGenerationOrchestrator(GeminiQuestionGenerator gemini, ICatalogQuestionBank bank)
    {
        _gemini = gemini;
        _bank = bank;
    }

    public async Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(
        string competencyId,
        string technologyId,
        string skillLevel,
        int count,
        QuestionSourceMode source,
        CancellationToken cancellationToken = default)
    {
        if (source == QuestionSourceMode.Bank)
        {
            var available = await _bank.CountAvailableAsync(competencyId, technologyId, skillLevel, cancellationToken);
            if (available < count)
                throw new RequestValidationException(new Dictionary<string, string[]>
                {
                    ["questionSource"] = [Messages.Validation.InsufficientBankQuestions(count, available)]
                });

            return await _bank.TakeAsync(competencyId, technologyId, skillLevel, count, cancellationToken);
        }

        return await _gemini.GenerateAsync(competencyId, technologyId, skillLevel, count, cancellationToken);
    }
}
