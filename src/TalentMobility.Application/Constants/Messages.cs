namespace TalentMobility.Application.Constants;

public static partial class Messages
{
    public static class Validation
    {
        public const string InvalidEmail = "Enter a valid email address.";
        public const string InvalidPassword = "Password must be between 8 and 128 characters.";
        public const string InvalidAssignmentId = "Assignment id is not valid.";
        public const string SelectEmployee = "Select an employee.";
        public const string NotesTooLong = "Notes must be 1000 characters or fewer.";
        public const string DueDateInPast = "Due date must be in the future.";
        public const string DefaultDueDaysRange = "Default due days must be between 1 and 365.";
        public const string MatchingWeightsTotal = "Matching weights must add up to 100%.";
        public const string AnswersRequired = "Submit one answer for every question.";
        public const string AnswerQuestionIdRequired = "Each answer must include a valid question id.";
        public const string AnswerDuplicateQuestion = "Each question can be answered only once.";
        public const string AnswerInvalidOption = "Select a valid option for every question.";
        public const string InvalidCatalogSelection = "Select a valid competency, technology, and skill level.";
        public const string ManualAssignmentDisabled = "Manual assignment is disabled.";
        public const string AssignmentNotAvailable = "This assignment is no longer available to start.";
        public const string AssignmentCatalogMismatch = "Assessment selections must match the manager assignment.";
        public const string PercentOutOfRange = "Enter a percentage from 0 to 100.";

        public static string FieldRequired(string field) =>
            $"{field} is required and must be {AppLimits.MaxCatalogFieldLength} characters or fewer.";

        public static string QuestionCountRange(int min, int max) =>
            $"Question count must be between {min} and {max}.";

        public static string RetakeLimitReached(int maxRetakes) =>
            $"You have reached the maximum of {maxRetakes} completed attempts for this skill.";
    }

    public static class Audit
    {
        public const string Login = "Login";
        public const string AssessmentSubmitted = "AssessmentSubmitted";
        public const string AssignmentCreated = "AssignmentCreated";
    }

    public static class Problems
    {
        public const string ValidationFailed = "One or more validation errors occurred.";
        public const string RequestValidationFailed = "Request validation failed.";
        public const string AccessDenied = "You do not have access to this resource.";
        public const string AccessDeniedShort = "Access denied.";
        public const string UnexpectedError = "An unexpected error occurred.";
        public const string AuthenticationRequired = "Authentication is required.";
        public const string AntiforgeryValidationFailed = "The request could not be validated.";
    }

    public static class Generation
    {
        public static string QuestionCountMismatch(int expected, int received) =>
            $"Expected {expected} questions but received {received}.";

        public const string DuplicateQuestionStems = "Duplicate question stems are not allowed.";

        public static string QuestionStemTooShort(int minLength) =>
            $"Each question stem must be at least {minLength} characters.";

        public static string QuestionOptionCount(int expected) =>
            $"Each question must have exactly {expected} options.";

        public const string QuestionOptionsEmpty = "Question options cannot be empty.";
        public const string QuestionOptionsNotUnique = "Question options must be unique.";
        public const string CorrectOptionIndexOutOfRange = "Correct option index is out of range.";

        public const string GeminiDisabledOrMissingKey = "Gemini is disabled or no API key is configured.";
        public const string UnknownCatalogSelection = "Unknown competency, technology, or skill level.";
        public const string GeminiApiRequestFailed = "Gemini API request failed.";
        public const string GeminiEmptyResponse = "Gemini returned an empty response.";
        public const string GeminiNoGeneratedText = "Gemini returned no generated text.";
        public const string GeminiJsonNotParsed = "Gemini JSON could not be parsed.";
        public const string GeminiNoQuestions = "Gemini returned no questions.";

        public static string GeminiHttpStatus(int statusCode) =>
            $"Gemini returned HTTP {statusCode}.";
    }

    public static class System
    {
        public const string AssessmentCatalogNotFound = "assessment-catalog.json not found.";
    }
}
