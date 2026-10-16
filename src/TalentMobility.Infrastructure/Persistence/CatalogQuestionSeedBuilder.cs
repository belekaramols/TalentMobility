using System.Text.Json;
using TalentMobility.Application.Interfaces;
using TalentMobility.Application.Services;
using TalentMobility.Domain.Entities;

namespace TalentMobility.Infrastructure.Persistence;

internal static class CatalogQuestionSeedBuilder
{
    public static CatalogQuestion Create(
        string competencyId,
        string technologyId,
        string skillLevelId,
        int index,
        string competencyLabel,
        string technologyLabel,
        string skillLevelLabel)
    {
        var profile = ResolveProfile(skillLevelId);
        var templateIndex = (index - 1) % profile.Stems.Length;
        var stem = Format(
            profile.Stems[templateIndex],
            competencyLabel,
            technologyLabel,
            skillLevelLabel);

        var correct = Format(
            profile.CorrectAnswers[templateIndex % profile.CorrectAnswers.Length],
            competencyLabel,
            technologyLabel,
            skillLevelLabel);

        var distractors = profile.DistractorSets[templateIndex % profile.DistractorSets.Length]
            .Select(d => Format(d, competencyLabel, technologyLabel, skillLevelLabel))
            .ToList();

        var options = new List<string> { correct };
        options.AddRange(distractors);
        var normalized = QuestionGenerationNormalizer.ShuffleOptions(new GeneratedQuestion(stem, options, 0));

        return new CatalogQuestion
        {
            Id = Guid.NewGuid(),
            CompetencyId = competencyId,
            TechnologyId = technologyId,
            SkillLevelId = skillLevelId,
            Stem = normalized.Stem,
            OptionsJson = JsonSerializer.Serialize(normalized.Options),
            CorrectOptionIndex = normalized.CorrectIndex,
            SortOrder = index,
            IsActive = true
        };
    }

    private static string Format(string template, string competency, string technology, string level) =>
        template
            .Replace("{competency}", competency, StringComparison.Ordinal)
            .Replace("{technology}", technology, StringComparison.Ordinal)
            .Replace("{level}", level, StringComparison.Ordinal);

    private static LevelProfile ResolveProfile(string skillLevelId) =>
        skillLevelId.ToLowerInvariant() switch
        {
            "beginner" => BeginnerProfile,
            "intermediate" => IntermediateProfile,
            "advance" or "advanced" => AdvancedProfile,
            _ => IntermediateProfile
        };

    private sealed record LevelProfile(
        string[] Stems,
        string[] CorrectAnswers,
        string[][] DistractorSets);

    private static readonly LevelProfile BeginnerProfile = new(
        Stems:
        [
            "As a {level} practitioner in {technology}, which habit helps you learn core concepts safely?",
            "Which statement best describes a foundational {technology} idea within {competency}?",
            "When reading {technology} documentation for the first time, what should you focus on?",
            "Which step is most appropriate when setting up a small {technology} exercise project?",
            "What is the best way to verify that a basic {technology} change works as intended?",
            "Which practice helps a {level} developer avoid common {technology} syntax mistakes?",
            "When pairing on {technology}, what should a {level} contributor prioritize?",
            "Which resource type is most useful for grasping {technology} terminology in {competency}?",
            "What is the safest way to experiment with a new {technology} API feature?",
            "Which approach helps you remember {technology} building blocks after training?",
            "When stuck on a simple {technology} error, what is the recommended first action?",
            "Which goal best fits a {level} {technology} learning plan in {competency}?",
        ],
        CorrectAnswers:
        [
            "Follow guided tutorials and reproduce small examples before tackling production code",
            "Learn official vocabulary and how each concept maps to a concrete {technology} task",
            "Understand prerequisites, setup steps, and one minimal working example end to end",
            "Create an isolated sandbox with sample data and version control from day one",
            "Run the smallest possible test or demo that proves the change behaves as expected",
            "Use compiler or linter feedback and fix one issue at a time with notes",
            "Ask clarifying questions and confirm assumptions before editing shared modules",
            "Official getting-started guides paired with short glossary notes",
            "Use a throwaway branch or local sandbox with no customer data",
            "Summarize each topic in your own words and rebuild the example without copy-paste",
            "Read the error message carefully and compare against a known working snippet",
            "Master fundamentals and repeatable practice labs before advanced architecture topics",
        ],
        DistractorSets:
        [
            ["Skip documentation and copy production code into tutorials", "Disable all tooling to avoid noise", "Memorize answers without running code"],
            ["Memorize buzzwords without connecting them to {technology} tasks", "Ignore {competency} context entirely", "Focus only on interview trivia"],
            ["Jump straight to distributed systems design", "Avoid hands-on labs completely", "Only watch videos without coding"],
            ["Edit live production services for practice", "Omit source control to move faster", "Share credentials in chat for convenience"],
            ["Deploy to production without any verification", "Assume success from code review alone", "Merge untested changes at end of day"],
            ["Ignore warnings to ship quickly", "Turn off static analysis permanently", "Never read compiler messages"],
            ["Change shared libraries silently", "Avoid asking questions to appear expert", "Skip team coding standards"],
            ["Random blog posts with no official cross-check", "Only social media threads", "Outdated forum posts without dates"],
            ["Test directly in production with real user data", "Hard-code secrets in samples", "Disable security defaults to simplify setup"],
            ["Never revisit examples after training", "Only read slides once per year", "Avoid practice repositories"],
            ["Guess randomly until something compiles", "Delete error output unread", "Revert entire codebase on first warning"],
            ["Start with performance tuning before basics", "Skip exercises entirely", "Focus only on certification dumps"],
        ]);

    private static readonly LevelProfile IntermediateProfile = new(
        Stems:
        [
            "In a delivery sprint using {technology}, which practice improves maintainability for {level} engineers?",
            "Which decision best balances speed and quality when extending a {technology} service?",
            "How should automated tests support a {technology} feature in {competency}?",
            "Which collaboration pattern helps review {technology} changes effectively?",
            "What is the right way to handle a breaking change in a shared {technology} library?",
            "Which monitoring signal is most actionable for a {technology} API at {level} depth?",
            "How should configuration differ between environments for {technology} workloads?",
            "Which refactoring step reduces risk before a large {technology} migration?",
            "What is the best approach to document a non-trivial {technology} workflow?",
            "How should you triage intermittent failures in {technology} integration tests?",
            "Which dependency upgrade strategy fits a {level} {technology} codebase?",
            "What practice keeps {technology} modules aligned with {competency} standards?",
        ],
        CorrectAnswers:
        [
            "Apply consistent patterns, meaningful names, and small cohesive modules with tests",
            "Ship incremental slices behind feature flags with regression tests",
            "Cover critical paths with automated tests and meaningful assertions near business rules",
            "Use pull requests with focused diffs, checklists, and peer review on risk areas",
            "Communicate versioning, provide migration notes, and stage rollout with consumers",
            "Track error rate and latency percentiles tied to recent deployments",
            "Use environment-specific settings with secrets outside source control",
            "Introduce characterization tests then refactor in small verified steps",
            "Capture decision context, diagrams, and operational runbooks near the code",
            "Stabilize tests, isolate flaky dependencies, and log reproducible failure data",
            "Upgrade one dependency at a time with changelog review and CI validation",
            "Follow team conventions, shared linters, and architecture decision records",
        ],
        DistractorSets:
        [
            ["Merge large unreviewed changes weekly", "Avoid tests to meet deadlines", "Duplicate logic across services"],
            ["Skip testing for urgent tickets always", "Deploy only on Fridays without rollback", "Hide defects from stakeholders"],
            ["Delete failing tests to keep CI green", "Test only UI mocks with no contracts", "Avoid integration coverage entirely"],
            ["Push directly to main without review", "Bundle unrelated refactors in every PR", "Skip documentation of risks"],
            ["Break consumers without notice", "Remove versioning permanently", "Force immediate upgrades without guidance"],
            ["Ignore metrics until users complain", "Only monitor CPU on idle servers", "Disable alerts to reduce noise"],
            ["Store production secrets in repository", "Use one config for all environments", "Disable encryption for speed"],
            ["Rewrite entire system in one release", "Refactor without any safety net", "Skip staging validation"],
            ["Keep knowledge only in private chat", "Avoid updating docs after changes", "Rely on tribal memory"],
            ["Disable flaky tests permanently", "Ignore logs from CI", "Never reproduce failures locally"],
            ["Upgrade everything at once before holidays", "Skip release notes", "Bypass CI for patches"],
            ["Let each team invent conflicting patterns", "Disable code quality gates", "Ignore {competency} guidelines"],
        ]);

    private static readonly LevelProfile AdvancedProfile = new(
        Stems:
        [
            "When {technology} must scale under peak load in {competency}, which design choice is most sound?",
            "Which tradeoff should guide resilience planning for a critical {technology} pipeline?",
            "How should you evaluate security risk in a {level} {technology} architecture change?",
            "What is the best strategy to reduce blast radius during a {technology} deployment?",
            "Which performance investigation order fits complex {technology} latency regressions?",
            "How should capacity planning incorporate {technology} autoscaling behavior?",
            "What governance practice keeps {technology} platforms evolvable at {level} maturity?",
            "Which approach validates disaster recovery for {technology} data services?",
            "How do you decide between build vs buy for a specialized {technology} capability?",
            "What is the right way to lead an incident retrospective after a {technology} outage?",
            "Which metric set best reflects customer impact for {technology} SLO reviews?",
            "How should platform teams standardize {technology} while allowing team autonomy?",
        ],
        CorrectAnswers:
        [
            "Model bottlenecks, load test realistic paths, and design horizontal scale with clear limits",
            "Prioritize graceful degradation, idempotency, and tested failover paths",
            "Threat model the change, apply least privilege, and validate with security review plus tests",
            "Use canaries, automated rollback, and isolated deployment units",
            "Measure end-to-end traces, then narrow to dependencies, data stores, and hot paths",
            "Combine forecasts, SLO targets, and observed utilization with staged scale policies",
            "Publish paved roads, golden paths, and measurable platform APIs with lifecycle ownership",
            "Run game days, measure RTO/RPO, and automate restore drills on representative data",
            "Compare total cost, operational burden, and strategic fit against core competencies",
            "Focus on timeline, contributing factors, and actionable prevention without blame",
            "Use SLIs tied to user journeys such as success rate and tail latency",
            "Define thin standards with extension points and supported self-service tooling",
        ],
        DistractorSets:
        [
            ["Scale vertically only and ignore caching", "Disable backpressure controls", "Assume linear scale without measurement"],
            ["Rely on a single instance with no failover", "Ignore duplicate processing risks", "Skip chaos testing forever"],
            ["Trust perimeter security only", "Grant broad admin roles by default", "Skip review for urgent changes"],
            ["Deploy all regions simultaneously without checks", "Disable rollbacks to save time", "Share one fate for all services"],
            ["Optimize micro-optimizations before profiling", "Ignore database contention", "Disable tracing to save cost"],
            ["Set max instances to unlimited without budgets", "Ignore seasonal traffic patterns", "Scale only after outages"],
            ["Mandate one framework with no escape hatches", "Avoid platform roadmap input", "Centralize all decisions without feedback"],
            ["Assume backups exist without testing restore", "Document DR only on paper", "Skip cross-region validation"],
            ["Choose vendor lock-in without evaluation", "Build everything internally regardless of cost", "Decide only on license price"],
            ["Assign individual blame publicly", "Skip follow-up tracking", "Close incident without learning actions"],
            ["Track only server CPU averages", "Ignore customer-facing errors", "Use vanity metrics in executive reviews"],
            ["Enforce identical stacks with no team input", "Ban custom tooling entirely", "Skip documentation of platform contracts"],
        ]);
}
