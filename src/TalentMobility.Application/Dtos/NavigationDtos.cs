namespace TalentMobility.Application.Dtos;

public record NavigationGroupDto(string Label, IReadOnlyList<NavigationItemDto> Items);
public record NavigationItemDto(string Label, string Path, bool IsEnabled);
