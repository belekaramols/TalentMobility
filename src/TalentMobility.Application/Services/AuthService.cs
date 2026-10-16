using Microsoft.EntityFrameworkCore;
using TalentMobility.Application.Abstractions;
using TalentMobility.Application.Constants;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;
using TalentMobility.Application.Validation;
using TalentMobility.Domain.Entities;

namespace TalentMobility.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _db;
    private readonly IUserSession _session;
    private readonly IPasswordHasher _passwords;

    public AuthService(IApplicationDbContext db, IUserSession session, IPasswordHasher passwords)
    {
        _db = db;
        _session = session;
        _passwords = passwords;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        RequestRules.EnsureValid(RequestRules.ValidateLogin(request));
        var email = request.Email.Trim();
        var user = await _db.EmployeeProfiles
            .Include(e => e.Credential)
            .Include(e => e.Roles)
            .FirstOrDefaultAsync(e => e.UserName.ToLower() == email.ToLower(), cancellationToken);

        if (user?.Credential is null || !_passwords.Verify(request.Password, user.Credential.PasswordHash))
            return null;

        var roles = user.Roles.Select(r => r.Role.ToString()).ToList();
        await _session.SignInAsync(user.Id, user.UserName, user.FullName, roles, cancellationToken);
        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            EmployeeProfileId = user.Id,
            Action = Messages.Audit.Login,
            CreatedAtUtc = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(cancellationToken);
        return new LoginResponse(user.Id, user.UserName, user.FullName, roles);
    }

    public Task LogoutAsync(CancellationToken cancellationToken) => _session.SignOutAsync(cancellationToken);

    public async Task<CurrentUserDto?> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var id = _session.UserId;
        if (id is null) return null;
        var user = await _db.EmployeeProfiles.AsNoTracking()
            .Include(e => e.Roles)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (user is null) return null;
        return new CurrentUserDto(
            user.Id,
            user.UserName,
            user.FullName,
            user.Designation,
            user.CompetencyName,
            user.ProfilePicUrl,
            user.Roles.Select(r => r.Role.ToString()).ToList());
    }
}
