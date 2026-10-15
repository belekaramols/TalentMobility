namespace TalentMobility.Application.Dtos;

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);

public sealed class PageQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
