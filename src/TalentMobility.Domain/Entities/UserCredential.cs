namespace TalentMobility.Domain.Entities;

public class UserCredential
{
    public Guid EmployeeProfileId { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public EmployeeProfile Employee { get; set; } = null!;
}
