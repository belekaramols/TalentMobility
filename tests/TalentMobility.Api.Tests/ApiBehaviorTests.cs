using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.SqlClient;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TalentMobility.Application.Abstractions;
using TalentMobility.Application.Interfaces;
using TalentMobility.Domain.Entities;
using TalentMobility.Infrastructure.Persistence;

namespace TalentMobility.Api.Tests;

public class ApiBehaviorTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public ApiBehaviorTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Live_and_ready_health_endpoints_respond()
    {
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/live")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/ready")).StatusCode);
    }

    [Fact]
    public async Task Invalid_login_returns_problem_details_without_exception_text()
    {
        var session = await ApiSession.Open(_factory);
        var response = await session.SendAsync(HttpMethod.Post, "/api/auth/login", new { email = "bad", password = "short" });
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("validation", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Exception", body);
        Assert.DoesNotContain("StackTrace", body);
    }

    [Fact]
    public async Task Employee_cannot_call_manager_endpoints()
    {
        var session = await ApiSession.Open(_factory);
        await session.Login("amol.belekar@tothenew.com");
        var response = await session.Client.GetAsync("/api/manager/employees");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Manager_sees_only_assigned_team_and_cannot_open_another_employee()
    {
        var outsiderId = Guid.NewGuid();
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.EmployeeProfiles.Add(new EmployeeProfile
            {
                Id = outsiderId,
                UserName = $"outsider-{outsiderId:N}@tothenew.com",
                FullName = "Outside Person",
                ManagerEmployeeId = null,
                CreatedAtUtc = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        var session = await ApiSession.Open(_factory);
        await session.Login("team.lead@tothenew.com");
        var team = await session.Client.GetFromJsonAsync<PagedEmployees>("/api/manager/employees", TestJson.Options);
        Assert.NotNull(team);
        Assert.Contains(team!.Items, e => e.FullName == "Amol Sambhaji Belekar");
        Assert.DoesNotContain(team.Items, e => e.Id == outsiderId);

        var denied = await session.Client.GetAsync($"/api/manager/employees/{outsiderId}/attempts");
        Assert.Equal(HttpStatusCode.Forbidden, denied.StatusCode);
    }

    [Fact]
    public async Task Profile_hides_sensitive_fields()
    {
        var session = await ApiSession.Open(_factory);
        await session.Login("amol.belekar@tothenew.com");
        var body = await (await session.Client.GetAsync("/api/profile/me")).Content.ReadAsStringAsync();
        Assert.Contains("amol.belekar@tothenew.com", body);
        Assert.DoesNotContain("mobileNumber", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("rawLoginJson", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("competencyHeadEmails", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Invalid_weights_return_a_useful_validation_error()
    {
        var session = await ApiSession.Open(_factory);
        await session.Login("team.lead@tothenew.com");
        var response = await session.SendAsync(HttpMethod.Put, "/api/manager/matching-weights", new
        {
            requiredSkillMatchPercent = 10,
            experiencePercent = 10,
            availabilityPercent = 10,
            certificationPercent = 10
        });
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("100%", body);
    }

    [Fact]
    public async Task Assessment_and_assignment_rules_still_complete_successfully()
    {
        var employee = await ApiSession.Open(_factory);
        await employee.Login("amol.belekar@tothenew.com");

        var navigation = await employee.Client.GetFromJsonAsync<List<NavGroup>>("/api/navigation", TestJson.Options);
        Assert.Contains(navigation!, group => group.Items.Any(item => item.Path == "/dashboard"));

        var started = await employee.SendAsync(HttpMethod.Post, "/api/attempts/start", new
        {
            competencyId = "dotnet",
            technologyId = "efcore",
            skillLevel = "intermediate"
        });
        Assert.Equal(HttpStatusCode.OK, started.StatusCode);
        var startedBody = await started.Content.ReadAsStringAsync();
        Assert.DoesNotContain("correctOptionIndex", startedBody, StringComparison.OrdinalIgnoreCase);
        var attempt = JsonSerializer.Deserialize<AttemptPayload>(startedBody, TestJson.Options);
        Assert.NotNull(attempt);
        Assert.Equal(10, attempt!.Questions.Count);

        var submitted = await employee.SendAsync(HttpMethod.Post, $"/api/attempts/{attempt.Id}/submit", new
        {
            answers = attempt.Questions.Select(question => new { questionId = question.Id, selectedOptionIndex = 0 })
        });
        Assert.Equal(HttpStatusCode.OK, submitted.StatusCode);
        var result = JsonSerializer.Deserialize<AttemptResultPayload>(await submitted.Content.ReadAsStringAsync(), TestJson.Options);
        Assert.Equal(10, result!.Score);
        Assert.Equal(10, result.MaxScore);
        Assert.Equal(10, result.CorrectCount);

        var history = await employee.Client.GetFromJsonAsync<PagedAttempts>("/api/attempts/me", TestJson.Options);
        Assert.Contains(history!.Items, item => item.Id == attempt.Id && item.Status == "Completed");

        var manager = await ApiSession.Open(_factory);
        await manager.Login("team.lead@tothenew.com");
        var assigned = await manager.SendAsync(HttpMethod.Post, "/api/manager/assignments", new
        {
            employeeId = "11111111-1111-1111-1111-111111111101",
            competencyId = "dotnet",
            technologyId = "csharp",
            skillLevel = "beginner",
            notes = "Business rule check"
        });
        Assert.Equal(HttpStatusCode.OK, assigned.StatusCode);

        var inbox = await employee.Client.GetFromJsonAsync<PagedAssignments>("/api/assignments/me", TestJson.Options);
        var pending = Assert.Single(inbox!.Items, item => item.TechnologyLabel == "C#" && item.Status == "Pending");
        Assert.False(string.IsNullOrWhiteSpace(pending.CompetencyId));
        Assert.False(string.IsNullOrWhiteSpace(pending.TechnologyId));

        var assignedStart = await employee.SendAsync(HttpMethod.Post, "/api/attempts/start", new
        {
            competencyId = "dotnet",
            technologyId = "csharp",
            skillLevel = "beginner",
            assignmentId = pending.Id
        });
        Assert.Equal(HttpStatusCode.OK, assignedStart.StatusCode);
        var assignedAttempt = JsonSerializer.Deserialize<AttemptPayload>(await assignedStart.Content.ReadAsStringAsync(), TestJson.Options);
        Assert.NotNull(assignedAttempt);

        var inboxAfterStart = await employee.Client.GetFromJsonAsync<PagedAssignments>("/api/assignments/me", TestJson.Options);
        var inProgress = Assert.Single(inboxAfterStart!.Items, item => item.Id == pending.Id);
        Assert.Equal("InProgress", inProgress.Status);
        Assert.Equal(assignedAttempt!.Id, inProgress.InProgressAttemptId);

        var weights = await manager.SendAsync(HttpMethod.Put, "/api/manager/matching-weights", new
        {
            requiredSkillMatchPercent = 60,
            experiencePercent = 20,
            availabilityPercent = 15,
            certificationPercent = 5
        });
        Assert.Equal(HttpStatusCode.OK, weights.StatusCode);
    }
}

public class SqlServerModelTests
{
    [Fact]
    public async Task Current_model_can_be_created_on_sql_server()
    {
        var connectionString = Environment.GetEnvironmentVariable("TALENTMOBILITY_SQL_TEST");
        if (string.IsNullOrWhiteSpace(connectionString))
            return;

        var databaseName = "TalentMobilityTests_" + Guid.NewGuid().ToString("N");
        var master = new SqlConnectionStringBuilder(connectionString) { InitialCatalog = "master" };
        await using (var connection = new SqlConnection(master.ConnectionString))
        {
            await connection.OpenAsync();
            await using var create = connection.CreateCommand();
            create.CommandText = $"CREATE DATABASE [{databaseName}]";
            await create.ExecuteNonQueryAsync();
        }

        try
        {
            var testConnection = new SqlConnectionStringBuilder(connectionString) { InitialCatalog = databaseName };
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlServer(testConnection.ConnectionString, sql => sql.EnableRetryOnFailure())
                .Options;
            await using var db = new ApplicationDbContext(options);
            var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();
            if (pending.Count > 0)
                await db.Database.MigrateAsync();
            else
                await db.Database.EnsureCreatedAsync();
            Assert.Equal(0, await db.EmployeeProfiles.CountAsync());
            Assert.NotNull(db.Model.FindEntityType(typeof(EmployeeProfile))!.FindProperty(nameof(EmployeeProfile.ManagerEmployeeId)));
        }
        finally
        {
            await using var connection = new SqlConnection(master.ConnectionString);
            await connection.OpenAsync();
            await using var drop = connection.CreateCommand();
            drop.CommandText = $"ALTER DATABASE [{databaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{databaseName}];";
            await drop.ExecuteNonQueryAsync();
        }
    }
}

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new($"Data Source=file:tm-{Guid.NewGuid():N}?mode=memory&cache=shared");

    public ApiFactory() => _connection.Open();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Server=(localdb)\\mssqllocaldb;Database=unused;Trusted_Connection=True;TrustServerCertificate=True");
        builder.UseSetting("Gemini:Enabled", "false");
        builder.ConfigureTestServices(services =>
        {
            foreach (var registration in services.Where(service => service.ServiceType == typeof(IQuestionGenerator)).ToList())
                services.Remove(registration);
            services.AddSingleton<IQuestionGenerator, DeterministicTestQuestionGenerator>();

            var registrations = services.Where(service =>
                service.ServiceType == typeof(DbContextOptions<ApplicationDbContext>) ||
                service.ServiceType == typeof(ApplicationDbContext) ||
                service.ServiceType == typeof(IApplicationDbContext)).ToList();
            foreach (var registration in registrations)
                services.Remove(registration);

            services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(_connection));
            services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        });
    }

    protected override void Dispose(bool disposing)
    {
        _connection.Dispose();
        base.Dispose(disposing);
    }
}

public sealed class ApiSession
{
    private string _token;
    public HttpClient Client { get; }

    private ApiSession(HttpClient client, string token)
    {
        Client = client;
        _token = token;
    }

    public static async Task<ApiSession> Open(ApiFactory factory)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
            AllowAutoRedirect = false
        });
        var csrf = await client.GetFromJsonAsync<CsrfResponse>("/api/auth/csrf", TestJson.Options);
        return new ApiSession(client, csrf!.Token);
    }

    public async Task Login(string email)
    {
        var response = await SendAsync(HttpMethod.Post, "/api/auth/login", new { email, password = "ChangeMe@Dev" });
        response.EnsureSuccessStatusCode();
        var csrf = await Client.GetFromJsonAsync<CsrfResponse>("/api/auth/csrf", TestJson.Options);
        _token = csrf!.Token;
    }

    public Task<HttpResponseMessage> SendAsync(HttpMethod method, string path, object body)
    {
        var request = new HttpRequestMessage(method, path) { Content = JsonContent.Create(body) };
        request.Headers.Add("X-XSRF-TOKEN", _token);
        return Client.SendAsync(request);
    }
}

public static class TestJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);
}

public sealed record CsrfResponse(string Token);
public sealed record PagedEmployees(List<EmployeeItem> Items, int TotalCount);
public sealed record EmployeeItem(Guid Id, string FullName);
public sealed record NavGroup(List<NavItem> Items);
public sealed record NavItem(string Path);
public sealed record AttemptPayload(Guid Id, List<QuestionPayload> Questions);
public sealed record QuestionPayload(Guid Id);
public sealed record AttemptResultPayload(int Score, int MaxScore, int CorrectCount);
public sealed record PagedAttempts(List<AttemptItem> Items);
public sealed record AttemptItem(Guid Id, string Status);
public sealed record PagedAssignments(List<AssignmentItem> Items);
public sealed record AssignmentItem(
    Guid Id,
    string CompetencyId,
    string TechnologyId,
    string TechnologyLabel,
    string Status,
    Guid? InProgressAttemptId);
