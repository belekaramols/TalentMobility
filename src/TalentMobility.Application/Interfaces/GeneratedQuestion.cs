namespace TalentMobility.Application.Interfaces;

public record GeneratedQuestion(string Stem, IReadOnlyList<string> Options, int CorrectIndex);
