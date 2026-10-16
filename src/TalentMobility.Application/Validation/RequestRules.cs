using System.Net.Mail;
using TalentMobility.Application.Constants;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Exceptions;
using TalentMobility.Application.Services;

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
            errors["email"] = [Messages.Validation.InvalidEmail];
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length is < AppLimits.MinPasswordLength or > AppLimits.MaxPasswordLength)
            errors["password"] = [Messages.Validation.InvalidPassword];
        return errors;
    }

    public static IReadOnlyDictionary<string, string[]> ValidateStart(StartAttemptRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        RequireId(errors, "competencyId", request.CompetencyId);
        RequireId(errors, "technologyId", request.TechnologyId);
        RequireId(errors, "skillLevel", request.SkillLevel);
        if (request.AssignmentId is Guid assignmentId && assignmentId == Guid.Empty)
            errors["assignmentId"] = [Messages.Validation.InvalidAssignmentId];
        return errors;
    }

    public static IReadOnlyDictionary<string, string[]> ValidateAssignment(CreateAssignmentRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.EmployeeId == Guid.Empty)
            errors["employeeId"] = [Messages.Validation.SelectEmployee];
        RequireId(errors, "competencyId", request.CompetencyId);
        RequireId(errors, "technologyId", request.TechnologyId);
        RequireId(errors, "skillLevel", request.SkillLevel);
        if (request.Notes is { Length: > AppLimits.MaxNotesLength })
            errors["notes"] = [Messages.Validation.NotesTooLong];
        if (request.DueDateUtc is DateTime due && due < DateTime.UtcNow.AddMinutes(-1))
            errors["dueDateUtc"] = [Messages.Validation.DueDateInPast];
        return errors;
    }

    public static IReadOnlyDictionary<string, string[]> ValidateConfig(UpdateAssessmentConfigRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.DefaultDueDays is < AppLimits.MinDefaultDueDays or > AppLimits.MaxDefaultDueDays)
            errors["defaultDueDays"] = [Messages.Validation.DefaultDueDaysRange];
        if (request.QuestionCount is < QuestionGenerationNormalizer.MinQuestionCount
            or > QuestionGenerationNormalizer.MaxQuestionCount)
            errors["questionCount"] = [Messages.Validation.QuestionCountRange(
                QuestionGenerationNormalizer.MinQuestionCount,
                QuestionGenerationNormalizer.MaxQuestionCount)];
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
            errors["weights"] = [Messages.Validation.MatchingWeightsTotal];
        return errors;
    }

    public static IReadOnlyDictionary<string, string[]> ValidateAnswers(SubmitAttemptRequest? request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request?.Answers is null || request.Answers.Count == 0)
        {
            errors["answers"] = [Messages.Validation.AnswersRequired];
            return errors;
        }

        if (request.Answers.Any(a => a.QuestionId == Guid.Empty))
            errors["answers"] = [Messages.Validation.AnswerQuestionIdRequired];
        else if (request.Answers.Select(a => a.QuestionId).Distinct().Count() != request.Answers.Count)
            errors["answers"] = [Messages.Validation.AnswerDuplicateQuestion];
        else if (request.Answers.Any(a => a.SelectedOptionIndex < 0))
            errors["answers"] = [Messages.Validation.AnswerInvalidOption];
        return errors;
    }

    private static void RequireId(IDictionary<string, string[]> errors, string field, string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > AppLimits.MaxCatalogFieldLength)
            errors[field] = [Messages.Validation.FieldRequired(field)];
    }

    private static void RequirePercent(IDictionary<string, string[]> errors, string field, decimal value)
    {
        if (value is < 0 or > 100)
            errors[field] = [Messages.Validation.PercentOutOfRange];
    }
}
