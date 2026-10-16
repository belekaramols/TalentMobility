import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Code2, Database, Layers3, Loader2, Play, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, type QuestionSource } from "../api/client";
import { messages } from "../config/messages";
import { LoadingOverlay } from "../components/common/LoadingSpinner";
import { ErrorState, PageLoading } from "../components/common/PageState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";

type GenerationErrorState = {
  detail: string;
  retryable: boolean;
  canUseBank: boolean;
};

export function NewTestWizard() {
  const [step, setStep] = useState(1);
  const [params] = useSearchParams();
  const assignmentId = params.get("assignmentId") ?? undefined;
  const [competencyId, setCompetencyId] = useState(params.get("competencyId") ?? "");
  const [technologyId, setTechnologyId] = useState(params.get("technologyId") ?? "");
  const [skillLevel, setSkillLevel] = useState(params.get("skillLevel") ?? "");
  const [starting, setStarting] = useState(false);
  const [startLabel, setStartLabel] = useState("");
  const [startingSource, setStartingSource] = useState<QuestionSource | null>(null);
  const [generationError, setGenerationError] = useState<GenerationErrorState | null>(null);
  const navigate = useNavigate();

  const competencies = useQuery({ queryKey: ["competencies"], queryFn: api.competencies });
  const levels = useQuery({ queryKey: ["levels"], queryFn: api.skillLevels });
  const bankAvailability = useQuery({
    queryKey: ["bank-availability", competencyId, technologyId, skillLevel],
    queryFn: () => api.bankAvailability(competencyId, technologyId, skillLevel),
    enabled: step === 4 && !!competencyId && !!technologyId && !!skillLevel,
  });

  const comp = competencies.data?.find((c) => c.id === competencyId);
  const technology = comp?.technologies.find((item) => item.id === technologyId);
  const level = levels.data?.find((item) => item.id === skillLevel);

  async function startAttempt(questionSource: QuestionSource) {
    setStarting(true);
    setStartingSource(questionSource);
    setStartLabel(
      questionSource === "bank"
        ? messages.questionGeneration.generatingBank
        : messages.questionGeneration.generatingAi,
    );
    setGenerationError(null);
    try {
      const attempt = await api.startAttempt({
        competencyId,
        technologyId,
        skillLevel,
        assignmentId,
        questionSource,
      });
      navigate(`/assessment/test/${attempt.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.isQuestionGenerationFailure) {
        setGenerationError({
          detail: error.aiDetail,
          retryable: error.retryable,
          canUseBank: error.canUseBank,
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : messages.toast.assessmentStartFailed);
    } finally {
      setStarting(false);
      setStartLabel("");
      setStartingSource(null);
    }
  }

  if (competencies.isPending || levels.isPending) return <PageLoading />;
  if (competencies.isError || levels.isError) {
    return <ErrorState onRetry={() => { competencies.refetch(); levels.refetch(); }} />;
  }

  const steps = ["Competency", "Technology", "Skill level", "Review"];
  const bank = bankAvailability.data;

  const loadingDescription =
    startingSource === "bank"
      ? messages.questionGeneration.loadingHintBank
      : messages.questionGeneration.loadingHintAi;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <LoadingOverlay open={starting} title={startLabel || messages.questionGeneration.generatingAi} description={loadingDescription} />
      <section>
        <Badge><Sparkles className="mr-1 size-3.5" />Skill assessment</Badge>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Create your assessment</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Choose competency, technology (course), and level. Questions are generated with AI or loaded from the configured database bank.
        </p>
      </section>

      <ol aria-label="Assessment setup progress" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
        {steps.map((label, index) => {
          const number = index + 1;
          const complete = number < step;
          const current = number === step;
          return (
            <li key={label} className="min-w-0">
              <div className={`h-1.5 rounded-full ${number <= step ? "bg-primary" : "bg-muted"}`} />
              <div className="mt-2 flex items-center gap-2">
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${complete || current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {complete ? <Check className="size-3.5" /> : number}
                </span>
                <span className={`truncate text-xs font-medium ${current ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step - 1]}</CardTitle>
          <CardDescription>
            {step === 1 && "Select your primary competency from the catalog."}
            {step === 2 && "Choose the technology or course to assess."}
            {step === 3 && "Pick the proficiency level that best matches your experience."}
            {step === 4 && "Confirm details. AI generation is attempted first; configured questions are available as a fallback."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div role="radiogroup" aria-label="Competency" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {competencies.data?.map((item) => (
                <ChoiceCard
                  key={item.id}
                  selected={competencyId === item.id}
                  title={item.label}
                  description={`${item.technologies.length} technologies`}
                  icon={Layers3}
                  onClick={() => {
                    setCompetencyId(item.id);
                    setTechnologyId("");
                  }}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div role="radiogroup" aria-label="Technology" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comp?.technologies.map((item) => (
                <ChoiceCard
                  key={item.id}
                  selected={technologyId === item.id}
                  title={item.label}
                  description={`Course under ${comp.label}`}
                  icon={Code2}
                  onClick={() => setTechnologyId(item.id)}
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <div role="radiogroup" aria-label="Skill level" className="grid gap-3 md:grid-cols-3">
              {levels.data?.map((item) => (
                <ChoiceCard
                  key={item.id}
                  selected={skillLevel === item.id}
                  title={item.label}
                  description={item.description}
                  icon={Sparkles}
                  onClick={() => setSkillLevel(item.id)}
                />
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <ReviewItem label="Competency" value={comp?.label ?? "—"} icon={Layers3} />
                <ReviewItem label="Technology" value={technology?.label ?? "—"} icon={Code2} />
                <ReviewItem label="Skill level" value={level?.label ?? "—"} icon={Sparkles} />
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Database className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-semibold">Configured question bank</p>
                      {bankAvailability.isPending && (
                        <p className="mt-1 text-sm text-muted-foreground">Checking availability…</p>
                      )}
                      {bank && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {bank.sufficient
                            ? messages.questionGeneration.bankAvailable(bank.availableCount)
                            : messages.questionGeneration.bankUnavailable}
                        </p>
                      )}
                    </div>
                  </div>
                  {bank?.sufficient && <Badge variant="secondary">Fallback ready</Badge>}
                </div>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <Play className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="font-semibold">Ready to begin?</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We will request AI-generated questions. If the model is busy or unavailable, you can retry or switch to the configured bank.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" disabled={step === 1 || starting} onClick={() => setStep((value) => value - 1)}>
              <ArrowLeft className="size-4" />Back
            </Button>
            {step < 4 ? (
              <Button
                className="w-full sm:w-auto"
                disabled={(step === 1 && !competencyId) || (step === 2 && !technologyId) || (step === 3 && !skillLevel)}
                onClick={() => setStep((value) => value + 1)}
              >
                Continue<ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button className="w-full sm:w-auto" disabled={starting} onClick={() => startAttempt("ai")}>
                {starting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                {starting ? startLabel || "Starting…" : "Begin with AI"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={generationError !== null} onOpenChange={(open) => !open && setGenerationError(null)}>
        <DialogContent className="flex max-h-[min(90dvh,36rem)] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden p-6">
          <div className="min-h-0 flex-1 overflow-y-auto pr-8">
            <DialogHeader className="mb-4">
              <DialogTitle>{messages.questionGeneration.dialogTitle}</DialogTitle>
              <DialogDescription className="leading-relaxed">
                {messages.questionGeneration.dialogDescription}
              </DialogDescription>
            </DialogHeader>
            {generationError && (
              <div
                role="alert"
                className="max-h-[min(42vh,16rem)] overflow-y-auto overflow-x-hidden rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-relaxed text-foreground [overflow-wrap:anywhere] break-words whitespace-pre-wrap"
              >
                {generationError.detail}
              </div>
            )}
          </div>
          <DialogFooter className="mt-4 shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-col sm:items-stretch">
            <Button
              variant="outline"
              disabled={starting || !generationError?.retryable}
              onClick={() => startAttempt("ai")}
            >
              {starting && startingSource === "ai" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {messages.questionGeneration.tryAiAgain}
            </Button>
            <Button
              disabled={starting || !generationError?.canUseBank}
              onClick={() => startAttempt("bank")}
            >
              {starting && startingSource === "bank" ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />}
              {messages.questionGeneration.useBank}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChoiceCard({
  selected,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`relative rounded-xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 ${selected ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-border bg-card"}`}
    >
      <span className={`mb-4 flex size-10 items-center justify-center rounded-lg ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><Icon className="size-5" /></span>
      <span className="block font-semibold">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      {selected && <Check className="absolute right-4 top-4 size-4 text-primary" />}
    </button>
  );
}

function ReviewItem({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border p-5">
      <Icon className="mb-4 size-5 text-primary" />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
