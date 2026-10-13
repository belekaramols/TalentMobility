using Microsoft.EntityFrameworkCore;
using TalentMobility.Domain.Entities;

namespace TalentMobility.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<EmployeeProfile> EmployeeProfiles => Set<EmployeeProfile>();
    public DbSet<UserCredential> UserCredentials => Set<UserCredential>();
    public DbSet<UserRoleAssignment> UserRoleAssignments => Set<UserRoleAssignment>();
    public DbSet<AssessmentAttempt> AssessmentAttempts => Set<AssessmentAttempt>();
    public DbSet<AttemptQuestion> AttemptQuestions => Set<AttemptQuestion>();
    public DbSet<TestAssignment> TestAssignments => Set<TestAssignment>();
    public DbSet<AssessmentConfiguration> AssessmentConfigurations => Set<AssessmentConfiguration>();
    public DbSet<MatchingWeightConfig> MatchingWeightConfigs => Set<MatchingWeightConfig>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EmployeeProfile>(e =>
        {
            e.ToTable("EmployeeProfiles");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserName).IsUnique();
            e.Property(x => x.UserName).HasMaxLength(256);
            e.Property(x => x.FullName).HasMaxLength(256);
        });

        modelBuilder.Entity<UserCredential>(e =>
        {
            e.ToTable("UserCredentials");
            e.HasKey(x => x.EmployeeProfileId);
            e.HasOne(x => x.Employee).WithOne(x => x.Credential!).HasForeignKey<UserCredential>(x => x.EmployeeProfileId);
        });

        modelBuilder.Entity<UserRoleAssignment>(e =>
        {
            e.ToTable("UserRoleAssignments");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.EmployeeProfileId, x.Role }).IsUnique();
        });

        modelBuilder.Entity<AssessmentAttempt>(e =>
        {
            e.ToTable("AssessmentAttempts");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.EmployeeProfileId, x.CompletedAtUtc });
        });

        modelBuilder.Entity<AttemptQuestion>(e =>
        {
            e.ToTable("AttemptQuestions");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.AssessmentAttemptId, x.SortOrder }).IsUnique();
        });

        modelBuilder.Entity<TestAssignment>(e =>
        {
            e.ToTable("TestAssignments");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Employee).WithMany(x => x.AssignmentsReceived).HasForeignKey(x => x.EmployeeProfileId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.AssignedBy).WithMany().HasForeignKey(x => x.AssignedByEmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AssessmentConfiguration>(e => e.ToTable("AssessmentConfigurations"));
        modelBuilder.Entity<MatchingWeightConfig>(e =>
        {
            e.ToTable("MatchingWeightConfigs");
            e.Property(x => x.RequiredSkillMatchPercent).HasPrecision(5, 2);
            e.Property(x => x.ExperiencePercent).HasPrecision(5, 2);
            e.Property(x => x.AvailabilityPercent).HasPrecision(5, 2);
            e.Property(x => x.CertificationPercent).HasPrecision(5, 2);
        });
        modelBuilder.Entity<AuditLog>(e => e.ToTable("AuditLogs"));
    }
}
