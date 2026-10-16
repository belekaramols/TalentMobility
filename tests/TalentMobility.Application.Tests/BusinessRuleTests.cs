using TalentMobility.Application.Authorization;
using TalentMobility.Application.Constants;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Validation;
using TalentMobility.Domain.Enums;

namespace TalentMobility.Application.Tests;

public class BusinessRuleTests
{
    private static readonly Guid ManagerId = Guid.Parse("11111111-1111-1111-1111-111111111103");
    private static readonly Guid OtherManagerId = Guid.Parse("22222222-2222-2222-2222-222222222203");

    [Fact]
    public void Retake_limit_message_includes_configured_maximum()
    {
        var message = Messages.Validation.RetakeLimitReached(5);
        Assert.Contains("5", message);
    }

    [Fact]
    public void Login_rejects_invalid_email_and_short_password()
    {
        var errors = RequestRules.ValidateLogin(new LoginRequest("not-an-email", "short"));
        Assert.Contains("email", errors.Keys);
        Assert.Contains("password", errors.Keys);
    }

    [Fact]
    public void Login_accepts_seeded_credentials_shape()
    {
        var errors = RequestRules.ValidateLogin(new LoginRequest("amol.belekar@tothenew.com", "ChangeMe@Dev"));
        Assert.Empty(errors);
    }

    [Fact]
    public void Assignment_rejects_empty_employee_and_past_due_date()
    {
        var errors = RequestRules.ValidateAssignment(new CreateAssignmentRequest(
            Guid.Empty, "dotnet", "efcore", "intermediate", DateTime.UtcNow.AddDays(-1), "notes"));
        Assert.Contains("employeeId", errors.Keys);
        Assert.Contains("dueDateUtc", errors.Keys);
    }

    [Fact]
    public void Weights_must_total_100()
    {
        var invalid = RequestRules.ValidateWeights(new MatchingWeightsDto(10, 10, 10, 10));
        Assert.Contains("weights", invalid.Keys);
        var valid = RequestRules.ValidateWeights(new MatchingWeightsDto(60, 20, 15, 5));
        Assert.Empty(valid);
    }

    [Fact]
    public void Answers_require_distinct_questions()
    {
        var id = Guid.NewGuid();
        var errors = RequestRules.ValidateAnswers(new SubmitAttemptRequest(
        [
            new AnswerSubmissionDto(id, 0),
            new AnswerSubmissionDto(id, 1)
        ]));
        Assert.Contains("answers", errors.Keys);
    }

    [Theory]
    [InlineData(0, 0, 1, 20)]
    [InlineData(2, 500, 2, 100)]
    [InlineData(3, 25, 3, 25)]
    public void Paging_is_clamped(int page, int pageSize, int expectedPage, int expectedSize)
    {
        var (normalizedPage, normalizedSize) = Paging.Normalize(page, pageSize);
        Assert.Equal(expectedPage, normalizedPage);
        Assert.Equal(expectedSize, normalizedSize);
    }

    [Fact]
    public void Manager_can_access_only_a_direct_report()
    {
        Assert.True(TeamAccessRules.CanManage(false, ManagerId, ManagerId));
        Assert.False(TeamAccessRules.CanManage(false, ManagerId, OtherManagerId));
        Assert.False(TeamAccessRules.CanManage(false, ManagerId, null));
        Assert.True(TeamAccessRules.CanManage(true, ManagerId, OtherManagerId));
    }

    [Fact]
    public void Permissions_come_from_capability_map_not_a_controller_role_string()
    {
        Assert.Equal([Permissions.ManageTeam], PermissionMap.ForRole(nameof(AppRole.Manager)));
        Assert.Contains(Permissions.PlatformAdmin, PermissionMap.ForRole(nameof(AppRole.Administrator)));
        Assert.Empty(PermissionMap.ForRole(nameof(AppRole.Employee)));
    }
}
