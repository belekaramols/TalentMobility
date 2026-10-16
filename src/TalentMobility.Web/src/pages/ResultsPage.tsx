import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { api, AttemptResult } from "../api/client";
import { messages } from "../config/messages";
import { ErrorState, PageLoading } from "../components/common/PageState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";

export function ResultsPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const cached = location.state?.result as AttemptResult | undefined;
  const detail = useQuery({
    queryKey: ["detail", attemptId],
    queryFn: () => api.attemptDetail(attemptId!),
    enabled: !!attemptId && !cached,
  });
  const data = cached ?? detail.data;
  if (!data && detail.isPending) return <PageLoading />;
  if (!data) {
    return (
      <ErrorState
        title={messages.pages.resultUnavailable.title}
        description={messages.pages.resultUnavailable.description}
        onRetry={() => detail.refetch()}
      />
    );
  }
  const percentage = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Award className="size-8" /></span>
          <Badge className="mt-5" variant={percentage >= 70 ? "success" : "warning"}>Assessment complete</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">You scored {percentage}%</h1>
          <p className="mt-2 text-sm text-muted-foreground">{data.score} of {data.maxScore} questions answered correctly.</p>
          <div className="mt-6 w-full max-w-md"><Progress value={percentage} className="h-3" /></div>
          <div className="mt-7 grid w-full max-w-lg grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-4"><CheckCircle2 className="mx-auto size-5 text-emerald-600" /><p className="mt-2 text-xl font-bold">{data.correctCount}</p><p className="text-xs text-muted-foreground">Correct</p></div>
            <div className="rounded-xl bg-destructive/10 p-4"><XCircle className="mx-auto size-5 text-destructive" /><p className="mt-2 text-xl font-bold">{data.incorrectCount}</p><p className="text-xs text-muted-foreground">Incorrect</p></div>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/assessment/history">View history</Link></Button>
            <Button asChild variant="outline"><Link to="/assessment/new"><RotateCcw className="size-4" />New assessment</Link></Button>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle>Question review</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.questions.map((question) => (
            <article key={question.id} className={`rounded-xl border p-4 sm:p-5 ${question.isCorrect ? "border-emerald-500/25 bg-emerald-500/5" : "border-destructive/25 bg-destructive/5"}`}>
              <div className="flex items-start gap-3">
                {question.isCorrect ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />}
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Question {question.sortOrder}</p>
                  <h2 className="mt-1 font-semibold leading-6">{question.stem}</h2>
                  <div className="mt-3 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Your answer:</span> {question.selectedOptionIndex != null ? question.options[question.selectedOptionIndex] : "Not answered"}</p>
                    {!question.isCorrect && <p className="text-emerald-700 dark:text-emerald-300"><span className="font-medium">Correct answer:</span> {question.options[question.correctOptionIndex]}</p>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
