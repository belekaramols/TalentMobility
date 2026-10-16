namespace TalentMobility.Application.Exceptions;

public sealed class QuestionGenerationException : Exception
{
    public QuestionGenerationException(
        string userMessage,
        string provider,
        int? statusCode,
        bool retryable,
        bool canUseBank = false)
        : base(userMessage)
    {
        UserMessage = userMessage;
        Provider = provider;
        StatusCode = statusCode;
        Retryable = retryable;
        CanUseBank = canUseBank;
    }

    public string UserMessage { get; }
    public string Provider { get; }
    public int? StatusCode { get; }
    public bool Retryable { get; }
    public bool CanUseBank { get; }
}
