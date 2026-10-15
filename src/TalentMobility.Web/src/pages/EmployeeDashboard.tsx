import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, ClipboardCheck, FileClock, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

export function EmployeeDashboard() {
  const history = useQuery({ queryKey: ["history"], queryFn: () => api.history() });
  const latest = history.data?.items.find((h) => h.status === "Completed");
  const completed = history.data?.items.filter((attempt) => attempt.status === "Completed").length ?? 0;
  const latestPercent = latest?.score != null && latest.maxScore > 0
    ? Math.round((latest.score / latest.maxScore) * 100)
    : null;
  const trend = (history.data?.items ?? [])
    .filter((attempt) => attempt.status === "Completed" && attempt.score != null)
    .slice(0, 5)
    .reverse();

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">Employee workspace</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Continue building your skills, complete assigned assessments, and track your progress.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link to="/assessment/new">
            <Sparkles className="size-4" />
            Start assessment
          </Link>
        </Button>
      </section>

      {history.isError && (
        <Alert variant="destructive">
          <AlertTitle>Dashboard data is unavailable</AlertTitle>
          <AlertDescription>Refresh the page or try again in a moment.</AlertDescription>
        </Alert>
      )}

      {history.isPending ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section aria-label="Assessment summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={ClipboardCheck} label="Total attempts" value={String(history.data?.totalCount ?? 0)} note={`${completed} shown as completed`} />
            <MetricCard icon={Award} label="Latest score" value={latestPercent != null ? `${latestPercent}%` : "—"} note={latest ? `${latest.score}/${latest.maxScore} correct` : "No completed test yet"} />
            <MetricCard icon={Target} label="Latest skill" value={latest?.technologyLabel ?? "Not started"} note={latest?.competencyLabel ?? "Choose a competency"} />
            <MetricCard icon={FileClock} label="Current level" value={latest?.skillLevel ?? "—"} note={latest ? formatDate(latest.startedAtUtc) : "Complete your first assessment"} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Recent progress</CardTitle>
                  <CardDescription className="mt-1">Your latest completed assessment.</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/assessment/history">View history <ArrowRight className="size-4" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                {latest ? (
                  <div className="rounded-xl border border-border bg-muted/45 p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-semibold">{latest.technologyLabel}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {latest.competencyLabel} · {latest.skillLevel} · {formatDate(latest.startedAtUtc)}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                        {latest.score}/{latest.maxScore}
                      </span>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${latestPercent ?? 0}%` }} />
                    </div>
                    <p className="mt-2 text-right text-xs text-muted-foreground">{latestPercent}% complete score</p>
                    {trend.length > 1 && (
                      <div className="mt-6 border-t border-border pt-4">
                        <p className="mb-3 text-xs font-medium text-muted-foreground">Recent score trend</p>
                        <div className="flex h-20 items-end gap-2" aria-label="Recent assessment score trend">
                          {trend.map((attempt) => {
                            const value = attempt.score != null && attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
                            return <div key={attempt.id} title={`${attempt.technologyLabel}: ${value}%`} className="flex-1 rounded-t bg-primary/70 transition-all hover:bg-primary" style={{ height: `${Math.max(value, 8)}%` }} />;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyAssessment />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Continue where you left off.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickLink to="/assessment/assigned" icon={ClipboardCheck} title="Assigned tests" description="Review manager assignments" />
                <QuickLink to="/assessment/history" icon={FileClock} title="Assessment history" description="See scores and answers" />
                <QuickLink to="/profile" icon={Target} title="My profile" description="Review your talent profile" />
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="size-4" /></span>
        </div>
        <p className="truncate text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted">
      <span className="rounded-lg border border-border bg-card p-2 text-primary"><Icon className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function EmptyAssessment() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
      <Sparkles className="mb-3 size-6 text-primary" />
      <p className="font-semibold">Start your first assessment</p>
      <p className="mt-1 text-sm text-muted-foreground">Choose a skill and establish your baseline.</p>
      <Button asChild className="mt-4" size="sm"><Link to="/assessment/new">Get started</Link></Button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
