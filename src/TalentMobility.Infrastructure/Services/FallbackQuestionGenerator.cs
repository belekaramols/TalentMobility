using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TalentMobility.Application.Interfaces;
using TalentMobility.Infrastructure.Options;

namespace TalentMobility.Infrastructure.Services;

public class FallbackQuestionGenerator : IQuestionGenerator
{
    private readonly GeminiQuestionGenerator _gemini;
    private readonly TemplateQuestionGenerator _template;
    private readonly GeminiOptions _options;
    private readonly ILogger<FallbackQuestionGenerator> _logger;

    public FallbackQuestionGenerator(
        GeminiQuestionGenerator gemini,
        TemplateQuestionGenerator template,
        IOptions<GeminiOptions> options,
        ILogger<FallbackQuestionGenerator> logger)
    {
        _gemini = gemini;
        _template = template;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(
        string competencyId,
        string technologyId,
        string skillLevel,
        int count,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled || string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            _logger.LogInformation("Using template questions (Gemini disabled or API key missing).");
            return await _template.GenerateAsync(competencyId, technologyId, skillLevel, count, cancellationToken);
        }

        try
        {
            return await _gemini.GenerateAsync(competencyId, technologyId, skillLevel, count, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Gemini question generation failed after retries (503, timeout, etc.). Using template questions for this attempt.");
            return await _template.GenerateAsync(competencyId, technologyId, skillLevel, count, cancellationToken);
        }
    }
}
