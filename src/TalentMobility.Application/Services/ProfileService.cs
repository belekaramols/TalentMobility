using Microsoft.EntityFrameworkCore;
using TalentMobility.Application.Abstractions;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Application.Services;

public class ProfileService : IProfileService
{
    private readonly IApplicationDbContext _db;

    public ProfileService(IApplicationDbContext db) => _db = db;

    public async Task<EmployeeProfileDto?> GetOwnAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _db.EmployeeProfiles.AsNoTracking()
            .Where(e => e.Id == userId)
            .Select(e => new EmployeeProfileDto(
                e.Id,
                e.NewerId,
                e.UserName,
                e.FullName,
                e.Designation,
                e.CompetencyName,
                e.BusinessUnitName,
                e.ProfilePicUrl,
                e.HrRoleName))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
