using TalentMobility.Domain.Enums;

namespace TalentMobility.Domain.Entities;

public class UserRoleAssignment
{
    public Guid Id { get; set; }
    public Guid EmployeeProfileId { get; set; }
    public AppRole Role { get; set; }
    public EmployeeProfile Employee { get; set; } = null!;
}
