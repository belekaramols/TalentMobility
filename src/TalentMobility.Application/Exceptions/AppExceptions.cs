using TalentMobility.Application.Constants;

namespace TalentMobility.Application.Exceptions;

public sealed class RequestValidationException : Exception
{
    public RequestValidationException(IReadOnlyDictionary<string, string[]> errors)
        : base(Messages.Problems.RequestValidationFailed)
    {
        Errors = errors;
    }

    public IReadOnlyDictionary<string, string[]> Errors { get; }
}

public sealed class AccessDeniedException : Exception
{
    public AccessDeniedException()
        : base(Messages.Problems.AccessDeniedShort)
    {
    }
}
