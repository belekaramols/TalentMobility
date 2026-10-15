using System.Security.Cryptography;
using System.Text;
using TalentMobility.Application.Interfaces;

namespace TalentMobility.Infrastructure.Security;

public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password) => PasswordHasherService.Hash(password);
    public bool Verify(string password, string storedHash) => PasswordHasherService.Verify(password, storedHash);
}

public static class PasswordHasherService
{
    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            100_000,
            HashAlgorithmName.SHA256,
            32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string stored)
    {
        var parts = stored.Split('.', 2);
        if (parts.Length != 2) return false;
        var salt = Convert.FromBase64String(parts[0]);
        var expected = Convert.FromBase64String(parts[1]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            100_000,
            HashAlgorithmName.SHA256,
            32);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
