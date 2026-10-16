using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TalentMobility.Application.Constants;
using TalentMobility.Application.Interfaces;
using TalentMobility.Application.Services;
using TalentMobility.Infrastructure.Options;

namespace TalentMobility.Infrastructure.Services;

public class GeminiQuestionGenerator
{
    private readonly HttpClient _http;
    private readonly GeminiOptions _options;
    private readonly IAssessmentCatalogService _catalog;
    private readonly ILogger<GeminiQuestionGenerator> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public GeminiQuestionGenerator(
        HttpClient http,
        IOptions<GeminiOptions> options,
        IAssessmentCatalogService catalog,
        ILogger<GeminiQuestionGenerator> logger)
    {
        _http = http;
        _options = options.Value;
        _catalog = catalog;
        _logger = logger;
        _http.Timeout = TimeSpan.FromSeconds(Math.Clamp(_options.TimeoutSeconds, 30, 300));
    }

    public async Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(
        string competencyId,
        string technologyId,
        string skillLevel,
        int count,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled || string.IsNullOrWhiteSpace(_options.ApiKey))
            throw new InvalidOperationException(Messages.Generation.GeminiDisabledOrMissingKey);

        var competency = _catalog.GetCompetencies().FirstOrDefault(c => c.Id == competencyId);
        var technology = competency?.Technologies.FirstOrDefault(t => t.Id == technologyId);
        var level = _catalog.GetSkillLevels().FirstOrDefault(l => l.Id == skillLevel);
        if (competency is null || technology is null || level is null)
            throw new InvalidOperationException(Messages.Generation.UnknownCatalogSelection);

        var prompt = BuildPrompt(competency.Label, technology.Label, level.Label, level.Description, count);
        var rawJson = await CallGeminiAsync(prompt, cancellationToken);
        var batch = ParseModelJson(rawJson);
        var mapped = batch.Questions.Select(q => new GeneratedQuestion(q.Stem, q.Options, q.CorrectIndex)).ToList();
        return QuestionGenerationNormalizer.Prepare(mapped, count, shuffleOptions: true);
    }

    private async Task<string> CallGeminiAsync(string prompt, CancellationToken cancellationToken)
    {
        var model = ResolveModel();
        var maxRetries = Math.Clamp(_options.MaxRetries, 1, 5);
        var baseDelayMs = Math.Clamp(_options.RetryBaseDelayMilliseconds, 500, 15_000);
        Exception? lastError = null;

        for (var attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                    return await RequestModelAsync(model, prompt, cancellationToken);
            }
            catch (GeminiTransientException ex) when (attempt < maxRetries)
            {
                lastError = ex;
                var delay = TimeSpan.FromMilliseconds(baseDelayMs * attempt);
                _logger.LogWarning(
                    "Gemini {Model} transient failure ({Detail}, attempt {Attempt}/{MaxRetries}). Retrying in {DelayMs}ms.",
                    model, ex.Message, attempt, maxRetries, (int)delay.TotalMilliseconds);
                await Task.Delay(delay, cancellationToken);
            }
            catch (Exception ex) when (IsTransientTimeout(ex) && attempt < maxRetries)
            {
                lastError = ex;
                var delay = TimeSpan.FromMilliseconds(baseDelayMs * attempt);
                _logger.LogWarning(
                    ex,
                    "Gemini {Model} request timed out (attempt {Attempt}/{MaxRetries}, HttpClient timeout {TimeoutSeconds}s). Retrying in {DelayMs}ms.",
                    model, attempt, maxRetries, _http.Timeout.TotalSeconds, (int)delay.TotalMilliseconds);
                await Task.Delay(delay, cancellationToken);
            }
            catch (Exception ex)
            {
                lastError = ex;
                break;
            }
        }

        throw lastError ?? new InvalidOperationException(Messages.Generation.GeminiApiRequestFailed);
    }

    private string ResolveModel()
    {
        var configured = string.IsNullOrWhiteSpace(_options.Model) ? "gemini-3.8-flash" : _options.Model.Trim();
        if (!configured.Equals("gemini-3.8-flash", StringComparison.OrdinalIgnoreCase))
            _logger.LogWarning("Gemini model is set to {Configured}; this application expects gemini-3.8-flash.", configured);
        return configured;
    }

    private async Task<string> RequestModelAsync(string model, string prompt, CancellationToken cancellationToken)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:generateContent?key={Uri.EscapeDataString(_options.ApiKey!)}";
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(new
            {
                contents = new[] { new { parts = new[] { new { text = prompt } } } },
                generationConfig = new { responseMimeType = "application/json", temperature = 0.7 },
            }),
        };

        using var response = await _http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            var apiMessage = TryReadApiMessage(body);
            if (IsTransientStatus(response.StatusCode))
                throw new GeminiTransientException((int)response.StatusCode, apiMessage);

            _logger.LogWarning("Gemini API returned {StatusCode} for {Model}: {Message}", (int)response.StatusCode, model, apiMessage);
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(apiMessage) ? Messages.Generation.GeminiApiRequestFailed : apiMessage);
        }

        var envelope = JsonSerializer.Deserialize<GeminiResponseEnvelope>(body, JsonOptions)
            ?? throw new InvalidOperationException(Messages.Generation.GeminiEmptyResponse);
        var text = envelope.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;
        if (string.IsNullOrWhiteSpace(text))
            throw new InvalidOperationException(Messages.Generation.GeminiNoGeneratedText);
        return text;
    }

    private static bool IsTransientStatus(HttpStatusCode statusCode) =>
        statusCode is HttpStatusCode.TooManyRequests
            or HttpStatusCode.ServiceUnavailable
            or HttpStatusCode.BadGateway
            or HttpStatusCode.GatewayTimeout
            or HttpStatusCode.InternalServerError;

    private static bool IsTransientTimeout(Exception ex) =>
        ex is TaskCanceledException or TimeoutException
        || ex.InnerException is TimeoutException;

    private static string? TryReadApiMessage(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("error", out var error)
                && error.TryGetProperty("message", out var message))
                return message.GetString();
        }
        catch (JsonException)
        {
            // ignore non-JSON error bodies
        }

        return null;
    }

    internal static string BuildPrompt(
        string competencyLabel,
        string technologyLabel,
        string skillLevelLabel,
        string skillLevelDescription,
        int count)
    {
        return $"""
            You are an expert technical assessor. Create exactly {count} multiple-choice questions for an internal skills assessment.

            Context:
            - Competency: {competencyLabel}
            - Technology: {technologyLabel}
            - Skill level: {skillLevelLabel} ({skillLevelDescription})

            Requirements:
            - Every question must be specific to {technologyLabel} at the {skillLevelLabel} level.
            - Do not reuse generic software engineering questions unrelated to {technologyLabel}.
            - Each question has exactly 4 distinct answer options.
            - Exactly one option is correct per question.
            - Wording must be professional and unambiguous.
            - Questions must be different from each other (no duplicate stems).

            Return ONLY valid JSON (no markdown, no commentary) with this schema:
            - root object with a "questions" array
            - each item: "stem" (string), "options" (array of 4 strings), "correctIndex" (0-3 integer)

            The "questions" array must contain exactly {count} items. "correctIndex" is 0-based.
            """;
    }

    private static GeminiQuestionBatch ParseModelJson(string text)
    {
        var json = text.Trim();
        if (json.StartsWith("```", StringComparison.Ordinal))
        {
            var firstLine = json.IndexOf('\n');
            var lastFence = json.LastIndexOf("```", StringComparison.Ordinal);
            if (firstLine >= 0 && lastFence > firstLine)
                json = json[(firstLine + 1)..lastFence].Trim();
        }

        var batch = JsonSerializer.Deserialize<GeminiQuestionBatch>(json, JsonOptions)
            ?? throw new InvalidOperationException(Messages.Generation.GeminiJsonNotParsed);
        if (batch.Questions is null || batch.Questions.Count == 0)
            throw new InvalidOperationException(Messages.Generation.GeminiNoQuestions);
        return batch;
    }

    private sealed class GeminiTransientException : Exception
    {
        public GeminiTransientException(int statusCode, string? message)
            : base(string.IsNullOrWhiteSpace(message) ? Messages.Generation.GeminiHttpStatus(statusCode) : message)
        {
        }
    }

    private sealed class GeminiResponseEnvelope
    {
        public List<GeminiCandidate>? Candidates { get; set; }
    }

    private sealed class GeminiCandidate
    {
        public GeminiContent? Content { get; set; }
    }

    private sealed class GeminiContent
    {
        public List<GeminiPart>? Parts { get; set; }
    }

    private sealed class GeminiPart
    {
        public string? Text { get; set; }
    }

    private sealed class GeminiQuestionBatch
    {
        public List<GeminiQuestionItem> Questions { get; set; } = new();
    }

    private sealed class GeminiQuestionItem
    {
        public string Stem { get; set; } = "";
        public List<string> Options { get; set; } = new();
        public int CorrectIndex { get; set; }
    }
}
