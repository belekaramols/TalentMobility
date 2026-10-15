import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpenCheck, BriefcaseBusiness, CalendarClock, CheckCircle2, Compass, FileCheck2, HeartHandshake, ListChecks, Search, Sparkles, Target, UsersRound } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

type RoadmapConfig = {
  description: string;
  icon: LucideIcon;
  capabilities: [string, string, string];
  outcome: string;
};

const roadmap: Record<string, RoadmapConfig> = {
  Skills: { icon: Sparkles, description: "Build a verified, living inventory of your capabilities.", capabilities: ["Skill portfolio and proficiency evidence", "Assessment-backed skill verification", "Recommended skills for target roles"], outcome: "A trusted skills profile that improves internal opportunity matching." },
  Opportunities: { icon: Compass, description: "Discover internal roles, projects, and stretch assignments.", capabilities: ["Personalized opportunity recommendations", "Skill-gap and fit explanations", "Saved opportunity watchlist"], outcome: "Relevant internal mobility options surfaced in one place." },
  "My applications": { icon: FileCheck2, description: "Track every internal mobility application from submission to decision.", capabilities: ["Application status timeline", "Interview and action reminders", "Feedback and decision history"], outcome: "Clear visibility into each step of your mobility journey." },
  Availability: { icon: CalendarClock, description: "Share when and how you are available for internal moves.", capabilities: ["Availability date and allocation", "Location and work-mode preferences", "Temporary assignment preferences"], outcome: "Managers can consider talent at the right time and capacity." },
  "Career interests": { icon: Target, description: "Capture the roles, domains, and experiences you want next.", capabilities: ["Role and domain interests", "Mobility and location preferences", "Short- and long-term aspirations"], outcome: "Opportunity recommendations aligned with your ambitions." },
  "Growth plan": { icon: BookOpenCheck, description: "Turn career goals into a focused development roadmap.", capabilities: ["Milestones and development actions", "Learning and assessment links", "Progress reviews with your manager"], outcome: "A practical path from current capabilities to target roles." },
  Analytics: { icon: BarChart3, description: "Understand skill growth and assessment performance over time.", capabilities: ["Skill and score trends", "Development activity insights", "Readiness indicators"], outcome: "Evidence-based decisions about your next development step." },
  "Candidate matching": { icon: HeartHandshake, description: "Review explainable employee-to-opportunity recommendations.", capabilities: ["Ranked candidate recommendations", "Fit and gap explanations", "Configurable matching factors"], outcome: "Faster, fairer shortlisting based on relevant evidence." },
  "Talent search": { icon: Search, description: "Find internal talent using skills, experience, and availability.", capabilities: ["Multi-criteria talent filters", "Saved searches and talent pools", "Profile comparison"], outcome: "A discoverable internal talent marketplace for managers." },
  Requirements: { icon: BriefcaseBusiness, description: "Define the outcomes and capabilities needed for an opportunity.", capabilities: ["Role and project requirements", "Required and preferred skills", "Availability and experience criteria"], outcome: "Consistent, structured inputs for candidate matching." },
  Shortlists: { icon: UsersRound, description: "Collaborate on focused candidate lists for open opportunities.", capabilities: ["Candidate comparison", "Reviewer notes and decisions", "Shortlist stage tracking"], outcome: "A shared, auditable selection workspace." },
  "Mobility approvals": { icon: ListChecks, description: "Review and decide internal mobility requests with confidence.", capabilities: ["Approval queue and ownership", "Decision context and history", "Policy-aware routing"], outcome: "Transparent, timely mobility decisions." },
};

export function PlaceholderPage({ title }: { title: string }) {
  const config = roadmap[title] ?? { icon: Sparkles, description: "A new talent mobility capability is being designed.", capabilities: ["Focused workflow", "Connected talent data", "Accessible experience"], outcome: "A simpler, more connected mobility experience." };
  const Icon = config.icon;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-violet-500/10 p-6 sm:p-9">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-primary p-3 text-primary-foreground shadow-sm"><Icon className="size-6" /></span><Badge variant="secondary">On the roadmap</Badge></div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{config.description}</p>
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader><CardTitle>Planned capabilities</CardTitle><CardDescription>This preview describes the intended product direction. These features are not active yet.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {config.capabilities.map((capability) => <div key={capability} className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4"><span className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary"><CheckCircle2 className="size-4" /></span><p className="text-sm font-medium">{capability}</p></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Expected outcome</CardTitle><CardDescription>What this workspace is designed to enable.</CardDescription></CardHeader>
          <CardContent><div className="rounded-xl bg-primary/10 p-5"><Icon className="size-5 text-primary" /><p className="mt-4 text-sm font-medium leading-6">{config.outcome}</p></div><p className="mt-5 text-xs leading-5 text-muted-foreground">Delivery depends on future workflow and data integrations. No action is required today.</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
