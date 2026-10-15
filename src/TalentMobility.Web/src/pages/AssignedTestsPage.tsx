import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, ClipboardCheck } from "lucide-react";
import { api } from "../api/client";
import { Pagination } from "../components/common/Pagination";
import { EmptyState, ErrorState, PageLoading } from "../components/common/PageState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export function AssignedTestsPage() {
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ["assignments", page], queryFn: () => api.assignments(page, 10) });

  if (list.isPending) return <PageLoading />;
  if (list.isError) return <ErrorState onRetry={() => list.refetch()} />;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-primary">Assessment inbox</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Assigned tests</h1>
        <p className="mt-2 text-sm text-muted-foreground">Complete assessments requested by your manager before their due date.</p>
      </section>

      {list.data.items.length === 0 ? (
        <EmptyState title="No assigned tests" description="New manager-assigned assessments will appear here." />
      ) : (
        <div className="space-y-4">
          {list.data.items.map((assignment) => {
            const actionable = assignment.status === "Pending" || assignment.status === "InProgress";
            const href = actionable
              ? `/assessment/new?assignmentId=${assignment.id}`
              : assignment.attemptId ? `/assessment/results/${assignment.attemptId}` : "#";
            return (
              <Card key={assignment.id} className="transition-colors hover:border-primary/30">
                <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck className="size-5" /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{assignment.technologyLabel}</p>
                        <StatusBadge status={assignment.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{assignment.competencyLabel} · {assignment.skillLevel}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Assigned by {assignment.assignedByName}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-4" />{assignment.dueDateUtc ? `Due ${formatDate(assignment.dueDateUtc)}` : "No due date"}</p>
                    {(actionable || assignment.attemptId) && <Button asChild size="sm" variant={actionable ? "default" : "outline"}><Link to={href}>{actionable ? assignment.status === "InProgress" ? "Continue" : "Start test" : "View result"}<ArrowRight className="size-4" /></Link></Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Pagination page={list.data.page} pageSize={list.data.pageSize} totalCount={list.data.totalCount} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "Completed" ? "success" : status === "InProgress" ? "warning" : "secondary";
  return <Badge variant={variant}>{status.replace(/([a-z])([A-Z])/g, "$1 $2")}</Badge>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
