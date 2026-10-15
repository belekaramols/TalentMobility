using System.Net.Mail;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Exceptions;

namespace TalentMobility.Application.Validation;

public static class Paging
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    public static (int Page, int PageSize) Normalize(int page, int pageSize)
    {
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedSize = pageSize switch
        {
            < 1 => DefaultPageSize,
            > MaxPageSize => MaxPageSize,
            _ => pageSize
        };
        return (normalizedPage, normalizedSize);
    }
}

public static class RequestRules
{
    public static void EnsureValid(IReadOnlyDictionary<string, string[]> errors)
    {
        if (errors.Count > 0)
            throw new RequestValidationException(errors);
    }

    public static IReadOnlyDictionary<string, string[]> ValidateLogin(LoginRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        var email = request.Email?.Trim() ?? "";
        if (email.Length is 0 or > 256 || !MailAddress.TryCreate(email, out var parsed) || parsed.Address != email)
            errors["email"] = ["Enter a valid email address."];
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length is < 8 or > 128)
            errors["password"] = ["Password must be between 8 and 128 characters."];
        return errors;
    }

    public static IReadOnlyDictionary<string, string[]> ValidateStart(StartAttemptRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        RequireId(errors, "competencyId", request.CompetencyId);
        RequireId(errors, "technologyId", request.TechnologyId);
        RequireId(errors, "skillLevel", request.SkillLevel);
        if (request.AssignmentId == Guid.Empty)
            errors["assignmentId"] = ["Assignment id is not valid."];
        return errors;
    }

    public static IReadOnlyDictionary<string, string[]> ValidateAssignment(CreateAssignmentRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.EmployeeId == Guid.Empty)
            errors["employeeId"] = ["Select an employee."];
        RequireId(errors, "competencyId", request.CompetencyId);
        RequireId(errors, "technologyId", request.TechnologyId);
        RequireId(errors, "skillLevel", request.SkillLevel);
        if (request.Notes is { Length: > 1000 })
            errors["notes"] = ["Notes must be 1000 characters or fewer."];
        if (request.DueDateUtc is DateTime due && due < DateTime.UtcNow.AddMinutes(-1))
            errors["dueDateUtc"] = ["Due date must be in the future."];
        return errors;
    }

    public static IReadOnlyDictionary<string, string[]> ValidateConfig(UpdateAssessmentConfigRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.DefaultDueDays is < 1 or > 365)
            errors["defaultDueDays"] = ["Default due days must be between 1 and 365."];
        return errors;
    }

    public static IReadOnlyDictionary<string, string[]> ValidateWeights(MatchingWeightsDto request)
    {
        var errors = new Dictionary<string, string[]>();
        RequirePercent(errors, "requiredSkillMatchPercent", request.RequiredSkillMatchPercent);
        RequirePercent(errors, "experiencePercent", request.ExperiencePercent);
        RequirePercent(errors, "availabilityPercent", request.AvailabilityPercent);
        RequirePercent(errors, "certificationPercent", request.CertificationPercent);
        var total = request.RequiredSkillMatchPercent + request.ExperiencePercent + request.AvailabilityPercent + request.CertificationPercent;
        if (!errors.ContainsKey("requiredSkillMatchPercent") && Math.Abs(total - 100m) > 0.01m)
            errors["weights"] = ["Matching weights must add up to 100%."];
        return errors;
    }

    public static IReadOnlyDictionary<string, string[]> ValidateAnswers(SubmitAttemptRequest? request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request?.Answers is null || request.Answers.Count == 0)
        {
            errors["answers"] = ["Submit one answer for every question."];
            return errors;
        }

        if (request.Answers.Any(a => a.QuestionId == Guid.Empty))
            errors["answers"] = ["Each answer must include a valid question id."];
        else if (request.Answers.Select(a => a.QuestionId).Distinct().Count() != request.Answers.Count)
            errors["answers"] = ["Each question can be answered only once."];
        else if (request.Answers.Any(a => a.SelectedOptionIndex < 0))
            errors["answers"] = ["Select a valid option for every question."];
        return errors;
    }

    private static void RequireId(IDictionary<string, string[]> errors, string field, string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > 64)
            errors[field] = [$"{field} is required and must be 64 characters or fewer."];
    }

    private static void RequirePercent(IDictionary<string, string[]> errors, string field, decimal value)
    {
        if (value is < 0 or > 100)
            errors[field] = ["Enter a percentage from 0 to 100."];
    }
}
