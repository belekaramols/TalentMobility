import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Flag, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { messages } from "../config/messages";
import { ErrorState, PageLoading } from "../components/common/PageState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";

export function TestPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const attempt = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => api.getAttempt(attemptId!),
    enabled: !!attemptId,
  });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (attempt.isPending) return <PageLoading />;
  if (attempt.isError || !attempt.data) {
    return (
      <ErrorState
        title={messages.pages.assessmentUnavailable.title}
        description={messages.pages.assessmentUnavailable.description}
        onRetry={() => attempt.refetch()}
      />
    );
  }
  const q = attempt.data.questions[index];
  const total = attempt.data.questions.length;
  const answered = Object.keys(answers).length;
  const remaining = total - answered;

  async function submitAll() {
    if (remaining > 0) {
      toast.error(messages.toast.answerAllBeforeSubmit(remaining));
      setConfirmOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      const payload = attempt.data!.questions.map((question) => ({
        questionId: question.id,
        selectedOptionIndex: answers[question.id],
      }));
      const result = await api.submitAttempt(attemptId!, payload);
      navigate(`/assessment/results/${result.id}`, { state: { result } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.toast.assessmentSubmitFailed);
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{attempt.data.skillLevel}</Badge>
            <Badge variant="outline">
              {attempt.data.questionSource === "bank"
                ? messages.questionGeneration.bankBadge
                : messages.questionGeneration.aiBadge}
            </Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{attempt.data.technologyLabel} assessment</h1>
          <p className="mt-1 text-sm text-muted-foreground">{attempt.data.competencyLabel} · Question {index + 1} of {total}</p>
        </div>
        <div className="w-full sm:w-64">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>{answered} answered</span><span>{Math.round((answered / total) * 100)}%</span></div>
          <Progress value={(answered / total) * 100} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <Card>
          <CardContent className="p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Question {q.sortOrder}</p>
            <h2 className="mt-3 text-lg font-semibold leading-7 sm:text-xl">{q.stem}</h2>
            <div role="radiogroup" aria-label={`Answer for question ${q.sortOrder}`} className="mt-6 space-y-3">
              {q.options.map((option, optionIndex) => {
                const selected = answers[q.id] === optionIndex;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    key={optionIndex}
                    onClick={() => setAnswers((current) => ({ ...current, [q.id]: optionIndex }))}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition-colors ${selected ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/50"}`}
                  >
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                      {selected ? <Check className="size-4" /> : String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
              <Button variant="outline" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}><ArrowLeft className="size-4" />Previous</Button>
              {index < total - 1 ? (
                <Button onClick={() => setIndex((value) => value + 1)}>Next<ArrowRight className="size-4" /></Button>
              ) : (
                <Button onClick={() => setConfirmOpen(true)}><Send className="size-4" />Review & submit</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <aside className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Questions</p>
            <Badge variant={remaining === 0 ? "success" : "warning"}>{remaining} remaining</Badge>
          </div>
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
            {attempt.data.questions.map((question, questionIndex) => {
              const isAnswered = answers[question.id] != null;
              return (
                <button
                  type="button"
                  key={question.id}
                  aria-label={`Go to question ${questionIndex + 1}${isAnswered ? ", answered" : ""}`}
                  onClick={() => setIndex(questionIndex)}
                  className={`flex aspect-square items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${questionIndex === index ? "border-primary bg-primary text-primary-foreground" : isAnswered ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border hover:bg-muted"}`}
                >
                  {questionIndex + 1}
                </button>
              );
            })}
          </div>
          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Flag className="mt-0.5 size-3.5 shrink-0" />You can revisit any question before submitting.</p>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit assessment?</DialogTitle>
            <DialogDescription>
              {remaining === 0
                ? "All questions are answered. Your result will be calculated immediately."
                : `${remaining} question${remaining === 1 ? " is" : "s are"} still unanswered.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Continue reviewing</Button></DialogClose>
            <Button disabled={remaining > 0 || submitting} onClick={submitAll}><Send className="size-4" />{submitting ? "Submitting…" : "Submit assessment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
