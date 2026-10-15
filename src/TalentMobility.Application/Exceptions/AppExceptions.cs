namespace TalentMobility.Application.Exceptions;

public sealed class RequestValidationException : Exception
{
    public RequestValidationException(IReadOnlyDictionary<string, string[]> errors)
        : base("Request validation failed.")
    {
        Errors = errors;
    }

    public IReadOnlyDictionary<string, string[]> Errors { get; }
}

public sealed class AccessDeniedException : Exception
{
    public AccessDeniedException()
        : base("Access denied.")
    {
    }
}
