using TalentMobility.Application.Dtos;

namespace TalentMobility.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task LogoutAsync(CancellationToken cancellationToken);
    Task<CurrentUserDto?> GetCurrentUserAsync(CancellationToken cancellationToken);
}

public interface INavigationService
{
    IReadOnlyList<NavigationGroupDto> GetForRoles(IEnumerable<string> roles);
}

public interface IAssessmentService
{
    Task<AttemptInProgressDto?> StartAttemptAsync(Guid userId, StartAttemptRequest request, CancellationToken cancellationToken);
    Task<AttemptInProgressDto?> GetAttemptAsync(Guid userId, Guid attemptId, CancellationToken cancellationToken);
    Task<AttemptResultDto?> SubmitAsync(Guid userId, Guid attemptId, SubmitAttemptRequest request, CancellationToken cancellationToken);
    Task<PagedResult<AttemptSummaryDto>> GetHistoryAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken);
    Task<AttemptResultDto?> GetOwnDetailAsync(Guid userId, Guid attemptId, CancellationToken cancellationToken);
    Task<PagedResult<AttemptSummaryDto>> GetTeamHistoryAsync(Guid managerId, Guid employeeId, bool isPlatformAdmin, int page, int pageSize, CancellationToken cancellationToken);
    Task<AttemptResultDto?> GetTeamDetailAsync(Guid managerId, Guid employeeId, Guid attemptId, bool isPlatformAdmin, CancellationToken cancellationToken);
}

public interface IAssignmentService
{
    Task<AssessmentConfigDto> GetConfigAsync(CancellationToken cancellationToken);
    Task<AssessmentConfigDto> UpdateConfigAsync(UpdateAssessmentConfigRequest request, CancellationToken cancellationToken);
    Task<AssignmentDto?> CreateAsync(Guid managerId, bool isPlatformAdmin, CreateAssignmentRequest request, CancellationToken cancellationToken);
    Task<PagedResult<AssignmentDto>> GetForEmployeeAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken);
}

public interface IManagerService
{
    Task<ManagerDashboardDto> GetDashboardAsync(Guid managerId, bool isPlatformAdmin, CancellationToken cancellationToken);
    Task<PagedResult<EmployeeListItemDto>> GetEmployeesAsync(Guid managerId, bool isPlatformAdmin, int page, int pageSize, CancellationToken cancellationToken);
    Task<MatchingWeightsDto> GetWeightsAsync(CancellationToken cancellationToken);
    Task<MatchingWeightsDto> UpdateWeightsAsync(MatchingWeightsDto request, CancellationToken cancellationToken);
    Task<PagedResult<AuditLogDto>> GetAuditAsync(int page, int pageSize, CancellationToken cancellationToken);
}

public interface IProfileService
{
    Task<EmployeeProfileDto?> GetOwnAsync(Guid userId, CancellationToken cancellationToken);
}
