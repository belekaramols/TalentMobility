using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;
using TalentMobility.Application.Services;
using TalentMobility.Application.Validation;

namespace TalentMobility.Application.Tests;

public class QuestionGenerationNormalizerTests
{
    [Fact]
    public void Prepare_accepts_valid_batch_and_shuffles_options()
    {
        var raw = Enumerable.Range(1, 5).Select(i => new GeneratedQuestion(
            $"What is the best practice for scenario {i} in this technology stack?",
            ["Correct answer", $"Distractor {i}A", $"Distractor {i}B", $"Distractor {i}C"],
            0)).ToList();

        var prepared = QuestionGenerationNormalizer.Prepare(raw, 5, shuffleOptions: true);
        Assert.Equal(5, prepared.Count);
        Assert.All(prepared, q => Assert.Equal(4, q.Options.Count));
    }

    [Fact]
    public void Prepare_rejects_wrong_count()
    {
        var raw = new[] { Sample() };
        Assert.Throws<InvalidOperationException>(() => QuestionGenerationNormalizer.Prepare(raw, 5));
    }

    [Fact]
    public void Config_rejects_question_count_out_of_range()
    {
        var errors = RequestRules.ValidateConfig(new UpdateAssessmentConfigRequest(true, true, 7, 4));
        Assert.Contains("questionCount", errors.Keys);
        var ok = RequestRules.ValidateConfig(new UpdateAssessmentConfigRequest(true, true, 7, 10));
        Assert.Empty(ok);
    }

    private static GeneratedQuestion Sample() =>
        new("Which option reflects sound engineering judgment for this module?", ["A", "B", "C", "D"], 1);
}
