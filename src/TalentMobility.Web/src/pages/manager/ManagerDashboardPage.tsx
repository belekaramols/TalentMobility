import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, ClipboardCheck, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

export function ManagerDashboardPage() {
  const dashboard = useQuery({ queryKey: ["mgr-dash"], queryFn: api.managerDashboard });

  if (dashboard.isPending) return <ManagerDashboardSkeleton />;

  if (dashboard.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Manager dashboard is unavailable</AlertTitle>
        <AlertDescription>Refresh the page or try again in a moment.</AlertDescription>
      </Alert>
    );
  }

  const data = dashboard.data;
  const activeMembers = data.members.filter((member) => member.attemptCount > 0).length;
  const completionRate = data.teamSize > 0 ? Math.round((activeMembers / data.teamSize) * 100) : 0;

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">Manager workspace</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Team overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Track assessment participation and understand your team&apos;s current skill progress.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/manager/assign-test"><Sparkles className="size-4" />Assign assessment</Link>
        </Button>
      </section>

      <section aria-label="Team assessment summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagerMetric icon={UsersRound} label="Team members" value={String(data.teamSize)} note="Direct reports" />
        <ManagerMetric icon={ClipboardCheck} label="Tests this month" value={String(data.testsThisMonth)} note="Completed assessments" />
        <ManagerMetric icon={Award} label="Average score" value={`${data.averageScorePercent}%`} note="Latest team results" />
        <ManagerMetric icon={TrendingUp} label="Participation" value={`${completionRate}%`} note={`${activeMembers} members assessed`} />
      </section>

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Team assessment progress</CardTitle>
            <CardDescription className="mt-1">Latest performance across your direct reports.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/manager/team">View team <ArrowRight className="size-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.members.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-12 text-center">
              <UsersRound className="mb-3 size-7 text-primary" />
              <p className="font-semibold">No team members assigned</p>
              <p className="mt-1 text-sm text-muted-foreground">Team members will appear after reporting relationships are configured.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-border md:block">
                <table>
                  <caption className="sr-only">Assessment progress for direct reports</caption>
                  <thead>
                    <tr>
                      <th scope="col">Employee</th>
                      <th scope="col">Competency</th>
                      <th scope="col">Attempts</th>
                      <th scope="col">Latest</th>
                      <th scope="col">Best</th>
                      <th scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.members.map((member) => (
                      <tr key={member.employeeId} className="last:[&>td]:border-b-0">
                        <td>
                          <p className="font-semibold">{member.fullName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{member.email}</p>
                        </td>
                        <td>{member.competencyName ?? "—"}</td>
                        <td>{member.attemptCount}</td>
                        <td><Score value={member.latestScorePercent} /></td>
                        <td><Score value={member.bestScorePercent} /></td>
                        <td className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/manager/assessments/${member.employeeId}`}>View <ArrowRight className="size-4" /></Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {data.members.map((member) => (
                  <Link
                    key={member.employeeId}
                    to={`/manager/assessments/${member.employeeId}`}
                    className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{member.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.competencyName ?? member.email}</p>
                      </div>
                      <Score value={member.latestScorePercent} />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{member.attemptCount} completed attempts</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ManagerMetric({
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
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function Score({ value }: { value?: number }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const tone = value >= 80 ? "bg-emerald-50 text-emerald-700" : value >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{Math.round(value)}%</span>;
}

function ManagerDashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-5 w-full max-w-xl" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
