namespace TalentMobility.Domain.Entities;

public class EmployeeProfile
{
    public Guid Id { get; set; }
    public int NewerId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? ProfilePicUrl { get; set; }
    public string? MobileNumber { get; set; }
    public string? Designation { get; set; }
    public int? CompetencyId { get; set; }
    public string? CompetencyName { get; set; }
    public string? TechCompetencyId { get; set; }
    public string? BusinessUnitName { get; set; }
    public int? BusinessUnitId { get; set; }
    public string? HrRoleName { get; set; }
    public int? HrRoleId { get; set; }
    public string? CompetencyHeadNames { get; set; }
    public string? CompetencyHeadEmails { get; set; }
    public string? DeveloperSkillLevel { get; set; }
    public string? RawLoginJson { get; set; }
    public Guid? ManagerEmployeeId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public UserCredential? Credential { get; set; }
    public ICollection<UserRoleAssignment> Roles { get; set; } = new List<UserRoleAssignment>();
    public ICollection<AssessmentAttempt> Attempts { get; set; } = new List<AssessmentAttempt>();
    public ICollection<TestAssignment> AssignmentsReceived { get; set; } = new List<TestAssignment>();
}
