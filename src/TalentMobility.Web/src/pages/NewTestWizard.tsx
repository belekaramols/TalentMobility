import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Code2, Layers3, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { messages } from "../config/messages";
import { ErrorState, PageLoading } from "../components/common/PageState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export function NewTestWizard() {
  const [step, setStep] = useState(1);
  const [params] = useSearchParams();
  const assignmentId = params.get("assignmentId") ?? undefined;
  const [competencyId, setCompetencyId] = useState(params.get("competencyId") ?? "");
  const [technologyId, setTechnologyId] = useState(params.get("technologyId") ?? "");
  const [skillLevel, setSkillLevel] = useState(params.get("skillLevel") ?? "");
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  const competencies = useQuery({ queryKey: ["competencies"], queryFn: api.competencies });
  const levels = useQuery({ queryKey: ["levels"], queryFn: api.skillLevels });

  const comp = competencies.data?.find((c) => c.id === competencyId);
  const technology = comp?.technologies.find((item) => item.id === technologyId);
  const level = levels.data?.find((item) => item.id === skillLevel);

  async function start() {
    setStarting(true);
    try {
      const attempt = await api.startAttempt({ competencyId, technologyId, skillLevel, assignmentId });
      navigate(`/assessment/test/${attempt.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.toast.assessmentStartFailed);
    } finally {
      setStarting(false);
    }
  }

  if (competencies.isPending || levels.isPending) return <PageLoading />;
  if (competencies.isError || levels.isError) return <ErrorState onRetry={() => { competencies.refetch(); levels.refetch(); }} />;

  const steps = ["Competency", "Technology", "Skill level", "Review"];
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <section>
        <Badge><Sparkles className="mr-1 size-3.5" />Skill assessment</Badge>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Create your assessment</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">Choose the area you want to assess, then review your selection before beginning.</p>
      </section>

      <ol aria-label="Assessment setup progress" className="grid grid-cols-4 gap-2">
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
                <span className={`hidden truncate text-xs font-medium sm:block ${current ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step - 1]}</CardTitle>
          <CardDescription>
            {step === 1 && "Select your primary competency."}
            {step === 2 && "Choose the technology you want to assess."}
            {step === 3 && "Pick the proficiency level that best matches your experience."}
            {step === 4 && "Confirm the assessment details before you begin."}
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
                  description={`${item.technologies.length} technologies available`}
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
                  description={`Assessment for ${comp.label}`}
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
            <div className="grid gap-4 md:grid-cols-3">
              <ReviewItem label="Competency" value={comp?.label ?? "—"} icon={Layers3} />
              <ReviewItem label="Technology" value={technology?.label ?? "—"} icon={Code2} />
              <ReviewItem label="Skill level" value={level?.label ?? "—"} icon={Sparkles} />
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 md:col-span-3">
                <div className="flex items-start gap-3">
                  <Play className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="font-semibold">Ready to begin?</p>
                    <p className="mt-1 text-sm text-muted-foreground">The assessment contains 10 questions. Answer every question before submitting.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
            <Button variant="outline" disabled={step === 1 || starting} onClick={() => setStep((value) => value - 1)}>
              <ArrowLeft className="size-4" />Back
            </Button>
            {step < 4 ? (
              <Button
                disabled={(step === 1 && !competencyId) || (step === 2 && !technologyId) || (step === 3 && !skillLevel)}
                onClick={() => setStep((value) => value + 1)}
              >
                Continue<ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button disabled={starting} onClick={start}>
                <Play className="size-4" />{starting ? "Starting…" : "Begin assessment"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
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
