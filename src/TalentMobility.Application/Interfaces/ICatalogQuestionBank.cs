namespace TalentMobility.Application.Interfaces;

public interface ICatalogQuestionBank
{
    Task<int> CountAvailableAsync(
        string competencyId,
        string technologyId,
        string skillLevelId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<GeneratedQuestion>> TakeAsync(
        string competencyId,
        string technologyId,
        string skillLevelId,
        int count,
        CancellationToken cancellationToken = default);
}
