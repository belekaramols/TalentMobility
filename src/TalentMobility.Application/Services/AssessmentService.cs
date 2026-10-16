using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TalentMobility.Application.Abstractions;
using TalentMobility.Application.Authorization;
using TalentMobility.Application.Constants;
using TalentMobility.Application.Dtos;
using TalentMobility.Application.Exceptions;
using TalentMobility.Application.Interfaces;
using TalentMobility.Application.Validation;
using TalentMobility.Domain.Entities;
using TalentMobility.Domain.Enums;

namespace TalentMobility.Application.Services;

public class AssessmentService : IAssessmentService
{
    private readonly IApplicationDbContext _db;
    private readonly IAssessmentCatalogService _catalog;
    private readonly IQuestionGenerator _generator;

    public AssessmentService(IApplicationDbContext db, IAssessmentCatalogService catalog, IQuestionGenerator generator)
    {
        _db = db;
        _catalog = catalog;
        _generator = generator;
    }

    public async Task<AttemptInProgressDto?> StartAttemptAsync(Guid userId, StartAttemptRequest request, CancellationToken cancellationToken)
    {
        RequestRules.EnsureValid(RequestRules.ValidateStart(request));
        var comp = _catalog.GetCompetencies().FirstOrDefault(c => c.Id == request.CompetencyId);
        var tech = comp?.Technologies.FirstOrDefault(t => t.Id == request.TechnologyId);
        var level = _catalog.GetSkillLevels().FirstOrDefault(l => l.Id == request.SkillLevel);
        if (comp is null || tech is null || level is null)
            throw new RequestValidationException(new Dictionary<string, string[]>
            {
                ["catalog"] = [Messages.Validation.InvalidCatalogSelection]
            });

        var config = await _db.AssessmentConfigurations.AsNoTracking().FirstAsync(cancellationToken);

        if (request.AssignmentId is null)
        {
            var completedAttempts = await _db.AssessmentAttempts.AsNoTracking()
                .CountAsync(
                    a => a.EmployeeProfileId == userId
                        && a.CompetencyId == comp.Id
                        && a.TechnologyId == tech.Id
                        && a.SkillLevel == level.Id
                        && a.Status == AttemptStatus.Completed,
                    cancellationToken);
            if (completedAttempts >= config.MaxRetakeCount)
            {
                throw new RequestValidationException(new Dictionary<string, string[]>
                {
                    ["retake"] = [Messages.Validation.RetakeLimitReached(config.MaxRetakeCount)]
                });
            }
        }

        var source = AttemptSource.Self;
        Guid? assignedBy = null;
        Guid? assignmentId = null;

        if (request.AssignmentId is Guid aid)
        {
            var assignment = await _db.TestAssignments
                .FirstOrDefaultAsync(a => a.Id == aid && a.EmployeeProfileId == userId, cancellationToken);
            if (assignment is null) return null;
            if (assignment.Status is AssignmentStatus.Completed or AssignmentStatus.Cancelled)
            {
                throw new RequestValidationException(new Dictionary<string, string[]>
                {
                    ["assignmentId"] = [Messages.Validation.AssignmentNotAvailable]
                });
            }

            if (comp.Id != assignment.CompetencyId
                || tech.Id != assignment.TechnologyId
                || level.Id != assignment.SkillLevel)
            {
                throw new RequestValidationException(new Dictionary<string, string[]>
                {
                    ["assignmentId"] = [Messages.Validation.AssignmentCatalogMismatch]
                });
            }

            var existingAttempt = await _db.AssessmentAttempts
                .Include(a => a.Questions)
                .FirstOrDefaultAsync(
                    a => a.TestAssignmentId == aid
                        && a.EmployeeProfileId == userId
                        && a.Status == AttemptStatus.InProgress,
                    cancellationToken);
            if (existingAttempt is not null)
                return MapInProgress(existingAttempt);

            assignment.Status = AssignmentStatus.InProgress;
            assignmentId = assignment.Id;
            source = AttemptSource.ManagerAssigned;
            assignedBy = assignment.AssignedByEmployeeId;
        }

        var attempt = new AssessmentAttempt
        {
            Id = Guid.NewGuid(),
            EmployeeProfileId = userId,
            CompetencyId = comp.Id,
            CompetencyLabel = comp.Label,
            TechnologyId = tech.Id,
            TechnologyLabel = tech.Label,
            SkillLevel = level.Id,
            Status = AttemptStatus.InProgress,
            Source = source,
            AssignedByEmployeeId = assignedBy,
            TestAssignmentId = assignmentId,
            StartedAtUtc = DateTime.UtcNow,
            MaxScore = config.QuestionCount
        };

        var generated = await _generator.GenerateAsync(comp.Id, tech.Id, level.Id, config.QuestionCount, cancellationToken);
        var order = 1;
        foreach (var question in generated)
        {
            attempt.Questions.Add(new AttemptQuestion
            {
                Id = Guid.NewGuid(),
                AssessmentAttemptId = attempt.Id,
                SortOrder = order++,
                QuestionStem = question.Stem,
                OptionsJson = JsonSerializer.Serialize(question.Options),
                CorrectOptionIndex = question.CorrectIndex
            });
        }

        _db.AssessmentAttempts.Add(attempt);
        await _db.SaveChangesAsync(cancellationToken);
        return MapInProgress(attempt);
    }

    public async Task<AttemptInProgressDto?> GetAttemptAsync(Guid userId, Guid attemptId, CancellationToken cancellationToken)
    {
        var attempt = await _db.AssessmentAttempts.AsNoTracking()
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.EmployeeProfileId == userId && a.Status == AttemptStatus.InProgress, cancellationToken);
        return attempt is null ? null : MapInProgress(attempt);
    }

    public async Task<AttemptResultDto?> SubmitAsync(Guid userId, Guid attemptId, SubmitAttemptRequest request, CancellationToken cancellationToken)
    {
        RequestRules.EnsureValid(RequestRules.ValidateAnswers(request));
        var attempt = await _db.AssessmentAttempts
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.EmployeeProfileId == userId, cancellationToken);
        if (attempt is null || attempt.Status != AttemptStatus.InProgress) return null;

        var expected = attempt.Questions.Select(q => q.Id).ToHashSet();
        var submitted = request.Answers.Select(a => a.QuestionId).ToHashSet();
        if (!expected.SetEquals(submitted))
            throw new RequestValidationException(new Dictionary<string, string[]> { ["answers"] = [Messages.Validation.AnswersRequired] });

        foreach (var answer in request.Answers)
        {
            var question = attempt.Questions.First(x => x.Id == answer.QuestionId);
            var options = JsonSerializer.Deserialize<List<string>>(question.OptionsJson) ?? [];
            if (answer.SelectedOptionIndex >= options.Count)
                throw new RequestValidationException(new Dictionary<string, string[]> { ["answers"] = [Messages.Validation.AnswerInvalidOption] });
            question.SelectedOptionIndex = answer.SelectedOptionIndex;
            question.IsCorrect = answer.SelectedOptionIndex == question.CorrectOptionIndex;
        }

        attempt.Score = attempt.Questions.Count(q => q.IsCorrect == true);
        attempt.Status = AttemptStatus.Completed;
        attempt.CompletedAtUtc = DateTime.UtcNow;

        if (attempt.TestAssignmentId is Guid assignmentId)
        {
            var assignment = await _db.TestAssignments.FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);
            if (assignment is not null)
            {
                assignment.Status = AssignmentStatus.Completed;
                assignment.AssessmentAttemptId = attempt.Id;
            }
        }

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            EmployeeProfileId = userId,
            Action = Messages.Audit.AssessmentSubmitted,
            MetadataJson = JsonSerializer.Serialize(new { attemptId, attempt.Score, attempt.MaxScore }),
            CreatedAtUtc = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(cancellationToken);
        return MapResult(attempt);
    }

    public Task<PagedResult<AttemptSummaryDto>> GetHistoryAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _db.AssessmentAttempts.AsNoTracking().Where(a => a.EmployeeProfileId == userId);
        return PageAttemptsAsync(query, page, pageSize, cancellationToken);
    }

    public async Task<AttemptResultDto?> GetOwnDetailAsync(Guid userId, Guid attemptId, CancellationToken cancellationToken)
    {
        var attempt = await _db.AssessmentAttempts.AsNoTracking()
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.EmployeeProfileId == userId && a.Status == AttemptStatus.Completed, cancellationToken);
        return attempt is null ? null : MapResult(attempt);
    }

    public async Task<PagedResult<AttemptSummaryDto>> GetTeamHistoryAsync(Guid managerId, Guid employeeId, bool isPlatformAdmin, int page, int pageSize, CancellationToken cancellationToken)
    {
        await EnsureTeamAccessAsync(managerId, employeeId, isPlatformAdmin, cancellationToken);
        var query = _db.AssessmentAttempts.AsNoTracking().Where(a => a.EmployeeProfileId == employeeId);
        return await PageAttemptsAsync(query, page, pageSize, cancellationToken);
    }

    public async Task<AttemptResultDto?> GetTeamDetailAsync(Guid managerId, Guid employeeId, Guid attemptId, bool isPlatformAdmin, CancellationToken cancellationToken)
    {
        await EnsureTeamAccessAsync(managerId, employeeId, isPlatformAdmin, cancellationToken);
        var attempt = await _db.AssessmentAttempts.AsNoTracking()
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.EmployeeProfileId == employeeId && a.Status == AttemptStatus.Completed, cancellationToken);
        return attempt is null ? null : MapResult(attempt);
    }

    private async Task EnsureTeamAccessAsync(Guid managerId, Guid employeeId, bool isPlatformAdmin, CancellationToken cancellationToken)
    {
        var managerOfEmployee = await _db.EmployeeProfiles.AsNoTracking()
            .Where(e => e.Id == employeeId)
            .Select(e => (Guid?)e.ManagerEmployeeId)
            .FirstOrDefaultAsync(cancellationToken);
        if (!TeamAccessRules.CanManage(isPlatformAdmin, managerId, managerOfEmployee))
            throw new AccessDeniedException();
    }

    private static async Task<PagedResult<AttemptSummaryDto>> PageAttemptsAsync(
        IQueryable<AssessmentAttempt> query, int page, int pageSize, CancellationToken cancellationToken)
    {
        var (normalizedPage, normalizedSize) = Paging.Normalize(page, pageSize);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.StartedAtUtc)
            .Skip((normalizedPage - 1) * normalizedSize)
            .Take(normalizedSize)
            .Select(a => new AttemptSummaryDto(
                a.Id,
                a.CompetencyLabel,
                a.TechnologyLabel,
                a.SkillLevel,
                a.Status == AttemptStatus.Completed ? a.Score : null,
                a.MaxScore,
                a.Status.ToString(),
                a.Source.ToString(),
                a.StartedAtUtc,
                a.CompletedAtUtc))
            .ToListAsync(cancellationToken);
        return new PagedResult<AttemptSummaryDto>(items, normalizedPage, normalizedSize, total);
    }

    private static AttemptInProgressDto MapInProgress(AssessmentAttempt attempt)
    {
        var questions = attempt.Questions.OrderBy(q => q.SortOrder).Select(q =>
            new QuestionClientDto(q.Id, q.SortOrder, q.QuestionStem, DeserializeOptions(q.OptionsJson))).ToList();
        return new AttemptInProgressDto(attempt.Id, attempt.CompetencyLabel, attempt.TechnologyLabel, attempt.SkillLevel, questions);
    }

    private static AttemptResultDto MapResult(AssessmentAttempt attempt)
    {
        var questions = attempt.Questions.OrderBy(q => q.SortOrder).Select(q => new QuestionResultDto(
            q.Id,
            q.SortOrder,
            q.QuestionStem,
            DeserializeOptions(q.OptionsJson),
            q.SelectedOptionIndex,
            q.CorrectOptionIndex,
            q.IsCorrect == true)).ToList();
        var correct = questions.Count(q => q.IsCorrect);
        return new AttemptResultDto(attempt.Id, attempt.Score, attempt.MaxScore, correct, questions.Count - correct, questions);
    }

    private static IReadOnlyList<string> DeserializeOptions(string json) =>
        JsonSerializer.Deserialize<List<string>>(json) ?? [];
}
