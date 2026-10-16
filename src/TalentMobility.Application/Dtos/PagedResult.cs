namespace TalentMobility.Application.Dtos;

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);

public sealed class PageQuery
{
    public int Page { get; set; } = 1;
    /// <summary>0 uses <see cref="Options.PaginationOptions.DefaultPageSize"/> from configuration.</summary>
    public int PageSize { get; set; }
}
