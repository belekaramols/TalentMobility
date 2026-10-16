using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalentMobility.Api.ExceptionHandling;
using TalentMobility.Api.Security;
using TalentMobility.Application.Abstractions;
using TalentMobility.Application.Authorization;
using TalentMobility.Application.Constants;
using TalentMobility.Application.Interfaces;
using TalentMobility.Application.Options;
using TalentMobility.Application.Services;
using TalentMobility.Infrastructure.Authorization;
using TalentMobility.Infrastructure.Persistence;
using TalentMobility.Infrastructure.Security;
using TalentMobility.Infrastructure.Options;
using TalentMobility.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddScoped<AntiforgeryFilter>();
builder.Services.AddControllers(options =>
{
    options.Filters.AddService<AntiforgeryFilter>();
}).AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure()));
builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("database", tags: ["ready"]);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserSession, CookieUserSession>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<INavigationService, NavigationService>();
builder.Services.AddScoped<IAssessmentService, AssessmentService>();
builder.Services.AddScoped<IAssignmentService, AssignmentService>();
builder.Services.AddScoped<IManagerService, ManagerService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IAssessmentCatalogService, DbAssessmentCatalogService>();
builder.Services.Configure<GeminiOptions>(builder.Configuration.GetSection(GeminiOptions.SectionName));
builder.Services.Configure<PaginationOptions>(builder.Configuration.GetSection(PaginationOptions.SectionName));
builder.Services.AddHttpClient<GeminiQuestionGenerator>();
builder.Services.AddScoped<ICatalogQuestionBank, CatalogQuestionBankService>();
builder.Services.AddScoped<IQuestionGenerationService, QuestionGenerationOrchestrator>();
builder.Services.AddScoped<IAuthorizationHandler, TeamMemberHandler>();

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "TalentMobility.Csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
});

var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
builder.Services.AddCors(o => o.AddPolicy("Spa", p => p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddAuthentication(AuthConstants.CookieScheme)
    .AddCookie(AuthConstants.CookieScheme, options =>
    {
        options.Cookie.Name = "TalentMobility.Session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.LoginPath = "/api/auth/login";
        options.Events.OnRedirectToLogin = async ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            ctx.Response.ContentType = "application/problem+json";
            await ctx.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = Messages.Problems.AuthenticationRequired,
                Type = "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.2"
            });
        };
        options.Events.OnRedirectToAccessDenied = async ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
            ctx.Response.ContentType = "application/problem+json";
            await ctx.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = Messages.Problems.AccessDenied,
                Type = "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.4"
            });
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.ManageTeam, policy =>
        policy.RequireClaim(Permissions.ClaimType, Permissions.ManageTeam));
    options.AddPolicy(Policies.AccessTeamMember, policy =>
        policy.Requirements.Add(new TeamMemberRequirement()));
});

var app = builder.Build();

PaginationOptionsAccessor.Value =
    app.Configuration.GetSection(PaginationOptions.SectionName).Get<PaginationOptions>()
    ?? new PaginationOptions();

await DatabaseInitializer.InitializeAsync(app.Services);

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseCors("Spa");
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false
});
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
app.MapControllers();

app.Run();

public partial class Program
{
}
