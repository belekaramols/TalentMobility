namespace TalentMobility.Application.Interfaces;

public interface IUserSession
{
    Guid? UserId { get; }
    bool IsPlatformAdmin { get; }
    Task SignInAsync(Guid userId, string email, string fullName, IReadOnlyList<string> roles, CancellationToken cancellationToken);
    Task SignOutAsync(CancellationToken cancellationToken);
}
