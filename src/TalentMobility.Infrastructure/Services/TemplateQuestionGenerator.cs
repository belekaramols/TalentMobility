using TalentMobility.Application.Interfaces;

namespace TalentMobility.Infrastructure.Services;

/// <summary>Deterministic placeholder generator until OpenAI/Azure OpenAI is configured.</summary>
public class TemplateQuestionGenerator : IQuestionGenerator
{
    public IReadOnlyList<GeneratedQuestion> Generate(string competencyId, string technologyId, string skillLevel, int count)
    {
        var list = new List<GeneratedQuestion>();
        var tech = technologyId.Replace("-", " ");
        var level = skillLevel;
        for (var i = 1; i <= count; i++)
        {
            var stem = $"[{competencyId}/{tech}/{level}] Question {i}: Which statement best reflects professional practice in this area?";
            var options = new[]
            {
                "Apply established patterns with clear tradeoff reasoning",
                "Ignore non-functional requirements during implementation",
                "Skip validation and testing for speed",
                "Avoid documentation and code review"
            };
            list.Add(new GeneratedQuestion(stem, options, 0));
        }
        return list;
    }
}
