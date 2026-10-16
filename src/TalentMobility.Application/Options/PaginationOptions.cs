namespace TalentMobility.Application.Options;

public sealed class PaginationOptions
{
    public const string SectionName = "Pagination";

    public int DefaultPageSize { get; set; } = 10;
    public int MaxPageSize { get; set; } = 100;
}

public static class PaginationOptionsAccessor
{
    public static PaginationOptions Value { get; set; } = new();
}
