using Microsoft.EntityFrameworkCore;
using TalentMobility.Domain.Entities;

namespace TalentMobility.Application.Abstractions;

public interface IApplicationDbContext
{
    DbSet<EmployeeProfile> EmployeeProfiles { get; }
    DbSet<UserCredential> UserCredentials { get; }
    DbSet<UserRoleAssignment> UserRoleAssignments { get; }
    DbSet<AssessmentAttempt> AssessmentAttempts { get; }
    DbSet<AttemptQuestion> AttemptQuestions { get; }
    DbSet<TestAssignment> TestAssignments { get; }
    DbSet<AssessmentConfiguration> AssessmentConfigurations { get; }
    DbSet<MatchingWeightConfig> MatchingWeightConfigs { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
