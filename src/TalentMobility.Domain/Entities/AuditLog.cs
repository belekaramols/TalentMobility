namespace TalentMobility.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? EmployeeProfileId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? MetadataJson { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
