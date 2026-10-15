import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Filter } from "lucide-react";
import { api } from "../api/client";
import { Pagination } from "../components/common/Pagination";
import { EmptyState, ErrorState, PageLoading } from "../components/common/PageState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export function HistoryPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("All");
  const history = useQuery({ queryKey: ["history", page], queryFn: () => api.history(page, 10) });
  const rows = history.data?.items.filter((item) => status === "All" || item.status === status) ?? [];

  if (history.isPending) return <PageLoading />;
  if (history.isError) return <ErrorState onRetry={() => history.refetch()} />;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Assessment record</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Assessment history</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review previous attempts, scores, and detailed answers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-input bg-card px-3 text-sm">
            <option>All</option>
            <option>Completed</option>
            <option>InProgress</option>
          </select>
        </div>
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="No assessment history"
          description="Completed and in-progress assessments will appear here."
          action={<Button asChild><Link to="/assessment/new">Start an assessment</Link></Button>}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your attempts</CardTitle>
            <CardDescription>{history.data?.totalCount} total assessment attempts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden overflow-x-auto md:block">
              <table>
                <caption className="sr-only">Assessment history</caption>
                <thead><tr><th scope="col">Date</th><th scope="col">Assessment</th><th scope="col">Level</th><th scope="col">Score</th><th scope="col">Source</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap">{formatDate(row.startedAtUtc)}</td>
                      <td><p className="font-semibold">{row.technologyLabel}</p><p className="text-xs text-muted-foreground">{row.competencyLabel}</p></td>
                      <td><Badge variant="secondary">{row.skillLevel}</Badge></td>
                      <td>{row.score != null ? <span className="font-semibold">{row.score}/{row.maxScore}</span> : <Badge variant="warning">{row.status}</Badge>}</td>
                      <td>{row.source}</td>
                      <td className="text-right">{row.status === "Completed" && <Button asChild variant="ghost" size="sm"><Link to={`/assessment/results/${row.id}`}>Details<ArrowRight className="size-4" /></Link></Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 md:hidden">
              {rows.map((row) => (
                <Link key={row.id} to={row.status === "Completed" ? `/assessment/results/${row.id}` : "#"} className="block rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.technologyLabel}</p><p className="text-xs text-muted-foreground">{row.competencyLabel}</p></div><Badge variant={row.status === "Completed" ? "success" : "warning"}>{row.status}</Badge></div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{formatDate(row.startedAtUtc)}</span><span className="font-semibold text-foreground">{row.score != null ? `${row.score}/${row.maxScore}` : "—"}</span></div>
                </Link>
              ))}
            </div>
            <Pagination page={history.data!.page} pageSize={history.data!.pageSize} totalCount={history.data!.totalCount} onPageChange={setPage} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
