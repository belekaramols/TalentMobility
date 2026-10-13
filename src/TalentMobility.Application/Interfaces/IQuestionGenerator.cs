using TalentMobility.Application.Dtos;

namespace TalentMobility.Application.Interfaces;

public interface IQuestionGenerator
{
    IReadOnlyList<GeneratedQuestion> Generate(string competencyId, string technologyId, string skillLevel, int count);
}

public record GeneratedQuestion(string Stem, IReadOnlyList<string> Options, int CorrectIndex);
