namespace TalentMobility.Infrastructure.Options;

public class GeminiOptions
{
    public const string SectionName = "Gemini";

    public bool Enabled { get; set; } = true;
    public string? ApiKey { get; set; }

    /// <summary>Only gemini-3.8-flash is used for generation.</summary>
    public string Model { get; set; } = "gemini-3.8-flash";

    /// <summary>Per-request HTTP timeout (large question batches can take several minutes).</summary>
    public int TimeoutSeconds { get; set; } = 180;
}
