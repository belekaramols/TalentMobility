import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { messages } from "../../config/messages";
import { Pagination } from "../../components/common/Pagination";
import { EmptyState, ErrorState, PageLoading } from "../../components/common/PageState";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";

export function ManagerAssessmentsPage({ employeeId }: { employeeId: string }) {
  const [page, setPage] = useState(1);
  const attempts = useQuery({
    queryKey: ["mgr-attempts", employeeId, page],
    queryFn: () => api.managerEmployeeAttempts(employeeId, page, 10),
  });
  if (attempts.isPending) return <PageLoading />;
  if (attempts.isError) return <ErrorState title={messages.pages.assessmentsUnavailable.title} onRetry={() => attempts.refetch()} />;
  return (
    <div className="space-y-6">
      <section>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3"><Link to="/manager/team"><ArrowLeft className="size-4" />Back to team</Link></Button>
        <p className="text-sm font-medium text-primary">Team assessments</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Assessment history</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review completed and in-progress attempts for this employee.</p>
      </section>
      {attempts.data.items.length === 0 ? (
        <EmptyState title={messages.pages.noAssessmentAttempts.title} description={messages.pages.noAssessmentAttempts.description} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table>
                <caption className="sr-only">Employee assessment history</caption>
                <thead><tr><th scope="col">Date</th><th scope="col">Assessment</th><th scope="col">Level</th><th scope="col">Score</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {attempts.data.items.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="whitespace-nowrap">{formatDate(attempt.startedAtUtc)}</td>
                      <td><p className="font-semibold">{attempt.technologyLabel}</p><p className="text-xs text-muted-foreground">{attempt.competencyLabel}</p></td>
                      <td><Badge variant="secondary">{attempt.skillLevel}</Badge></td>
                      <td>{attempt.score != null ? <strong>{attempt.score}/{attempt.maxScore}</strong> : "—"}</td>
                      <td><Badge variant={attempt.status === "Completed" ? "success" : "warning"}>{attempt.status}</Badge></td>
                      <td className="text-right">{attempt.status === "Completed" && <Button asChild variant="ghost" size="sm"><Link to={`/manager/assessments/${employeeId}/${attempt.id}`}>Review<ArrowRight className="size-4" /></Link></Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={attempts.data.page} pageSize={attempts.data.pageSize} totalCount={attempts.data.totalCount} onPageChange={setPage} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ManagerAttemptDetailPage({ employeeId, attemptId }: { employeeId: string; attemptId: string }) {
  const detail = useQuery({
    queryKey: ["mgr-detail", employeeId, attemptId],
    queryFn: () => api.managerAttemptDetail(employeeId, attemptId),
  });
  if (detail.isPending) return <PageLoading />;
  if (detail.isError || !detail.data) return <ErrorState title={messages.pages.attemptUnavailable.title} onRetry={() => detail.refetch()} />;
  const result = detail.data;
  const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3"><Link to={`/manager/assessments/${employeeId}`}><ArrowLeft className="size-4" />Back to assessments</Link></Button>
      <Card>
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr_220px] sm:items-center">
          <div><Badge variant={percentage >= 70 ? "success" : "warning"}>Completed</Badge><h1 className="mt-3 text-2xl font-bold">Assessment result</h1><p className="mt-2 text-sm text-muted-foreground">{result.correctCount} correct and {result.incorrectCount} incorrect answers.</p><Progress value={percentage} className="mt-5 max-w-xl" /></div>
          <div className="rounded-xl bg-primary/10 p-6 text-center"><p className="text-4xl font-bold text-primary">{percentage}%</p><p className="mt-1 text-xs text-muted-foreground">{result.score}/{result.maxScore} points</p></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Question review</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {result.questions.map((question) => (
            <article key={question.id} className={`rounded-xl border p-5 ${question.isCorrect ? "border-emerald-500/25 bg-emerald-500/5" : "border-destructive/25 bg-destructive/5"}`}>
              <div className="flex gap-3">{question.isCorrect ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : <XCircle className="size-5 shrink-0 text-destructive" />}<div><p className="text-xs font-semibold text-muted-foreground">Question {question.sortOrder}</p><p className="mt-1 font-semibold">{question.stem}</p><p className="mt-3 text-sm"><span className="text-muted-foreground">Employee answer:</span> {question.selectedOptionIndex != null ? question.options[question.selectedOptionIndex] : "Not answered"}</p>{!question.isCorrect && <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Correct answer: {question.options[question.correctOptionIndex]}</p>}</div></div>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
