using TalentMobility.Domain.Enums;

namespace TalentMobility.Application.Validation;

public static class QuestionSourceParser
{
    public static bool TryParse(string? value, out QuestionSourceMode mode)
    {
        if (string.Equals(value, "bank", StringComparison.OrdinalIgnoreCase))
        {
            mode = QuestionSourceMode.Bank;
            return true;
        }

        if (string.IsNullOrWhiteSpace(value) || string.Equals(value, "ai", StringComparison.OrdinalIgnoreCase))
        {
            mode = QuestionSourceMode.Ai;
            return true;
        }

        mode = QuestionSourceMode.Ai;
        return false;
    }

    public static string ToApiValue(QuestionSourceMode mode) =>
        mode == QuestionSourceMode.Bank ? "bank" : "ai";
}
