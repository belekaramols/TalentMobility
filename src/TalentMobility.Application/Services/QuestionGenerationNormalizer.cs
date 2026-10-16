using TalentMobility.Application.Constants;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Application.Services;

public static class QuestionGenerationNormalizer
{
    public const int OptionsPerQuestion = AppLimits.OptionsPerQuestion;
    public const int MinQuestionCount = AppLimits.MinQuestionCount;
    public const int MaxQuestionCount = AppLimits.MaxQuestionCount;

    public static IReadOnlyList<GeneratedQuestion> Prepare(
        IReadOnlyList<GeneratedQuestion> questions,
        int expectedCount,
        bool shuffleOptions = true)
    {
        if (expectedCount < MinQuestionCount || expectedCount > MaxQuestionCount)
            throw new ArgumentOutOfRangeException(nameof(expectedCount));

        if (questions.Count != expectedCount)
            throw new InvalidOperationException(Messages.Generation.QuestionCountMismatch(expectedCount, questions.Count));

        var stems = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var prepared = new List<GeneratedQuestion>(expectedCount);
        foreach (var question in questions)
        {
            var normalized = NormalizeOne(question);
            if (!stems.Add(normalized.Stem.Trim()))
                throw new InvalidOperationException(Messages.Generation.DuplicateQuestionStems);
            prepared.Add(shuffleOptions ? ShuffleOptions(normalized) : normalized);
        }

        return prepared;
    }

    public static GeneratedQuestion NormalizeOne(GeneratedQuestion question)
    {
        var stem = question.Stem?.Trim() ?? "";
        if (stem.Length < AppLimits.MinQuestionStemLength)
            throw new InvalidOperationException(Messages.Generation.QuestionStemTooShort(AppLimits.MinQuestionStemLength));

        if (question.Options.Count != OptionsPerQuestion)
            throw new InvalidOperationException(Messages.Generation.QuestionOptionCount(OptionsPerQuestion));

        var options = question.Options.Select(o => o?.Trim() ?? "").ToList();
        if (options.Any(string.IsNullOrWhiteSpace))
            throw new InvalidOperationException(Messages.Generation.QuestionOptionsEmpty);

        if (options.Distinct(StringComparer.OrdinalIgnoreCase).Count() != OptionsPerQuestion)
            throw new InvalidOperationException(Messages.Generation.QuestionOptionsNotUnique);

        if (question.CorrectIndex is < 0 or >= OptionsPerQuestion)
            throw new InvalidOperationException(Messages.Generation.CorrectOptionIndexOutOfRange);

        return new GeneratedQuestion(stem, options, question.CorrectIndex);
    }

    public static GeneratedQuestion ShuffleOptions(GeneratedQuestion question)
    {
        var indexed = question.Options.Select((text, index) => (text, index)).ToList();
        for (var i = indexed.Count - 1; i > 0; i--)
        {
            var j = Random.Shared.Next(i + 1);
            (indexed[i], indexed[j]) = (indexed[j], indexed[i]);
        }

        var shuffled = indexed.Select(x => x.text).ToList();
        var correctIndex = indexed.FindIndex(x => x.index == question.CorrectIndex);
        return new GeneratedQuestion(question.Stem, shuffled, correctIndex);
    }
}
