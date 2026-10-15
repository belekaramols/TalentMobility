import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, BriefcaseBusiness, CalendarClock, Save, Wrench } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { ErrorState, PageLoading } from "../../components/common/PageState";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";

const dimensions = [
  { key: "requiredSkillMatchPercent" as const, label: "Required skills", description: "Weight of relevant technical capabilities.", icon: Wrench, color: "bg-primary" },
  { key: "experiencePercent" as const, label: "Experience", description: "Weight of practical experience in the role.", icon: BriefcaseBusiness, color: "bg-violet-500" },
  { key: "availabilityPercent" as const, label: "Availability", description: "Weight of the employee's start availability.", icon: CalendarClock, color: "bg-amber-500" },
  { key: "certificationPercent" as const, label: "Certifications", description: "Weight of relevant professional credentials.", icon: Award, color: "bg-emerald-500" },
];

export function MatchingConfigPage() {
  const weights = useQuery({ queryKey: ["matching-weights"], queryFn: api.matchingWeights });
  const queryClient = useQueryClient();
  const [values, setValues] = useState({ requiredSkillMatchPercent: 40, experiencePercent: 30, availabilityPercent: 20, certificationPercent: 10 });
  useEffect(() => { if (weights.data) setValues(weights.data); }, [weights.data]);
  const total = useMemo(() => Object.values(values).reduce((sum, value) => sum + value, 0), [values]);
  const update = useMutation({
    mutationFn: () => api.updateMatchingWeights(values),
    onSuccess: () => {
      toast.success("Matching weights updated.");
      queryClient.invalidateQueries({ queryKey: ["matching-weights"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (weights.isPending) return <PageLoading />;
  if (weights.isError) return <ErrorState onRetry={() => weights.refetch()} />;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section><p className="text-sm font-medium text-primary">Opportunity matching</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Matching weights</h1><p className="mt-2 text-sm text-muted-foreground">Balance the factors used to calculate employee-to-opportunity fit.</p></section>
      <Card>
        <CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>Scoring distribution</CardTitle><CardDescription className="mt-1">The four factors must add up to exactly 100%.</CardDescription></div><span className={`rounded-full px-3 py-1 text-sm font-semibold ${total === 100 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}>{total}% total</span></div></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-label={`Weight distribution, ${total} percent total`}>
            {dimensions.map(({ key, color }) => <span key={key} className={color} style={{ width: `${values[key]}%` }} />)}
          </div>
          {dimensions.map(({ key, label, description, icon: Icon, color }) => (
            <div key={key} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3"><span className={`rounded-lg p-2 text-white ${color}`}><Icon className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><label htmlFor={`weight-${key}`} className="text-sm font-semibold">{label}</label><span className="text-sm font-bold">{values[key]}%</span></div><p className="text-xs text-muted-foreground">{description}</p></div></div>
              <input id={`weight-${key}`} type="range" min={0} max={100} value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: Number(event.target.value) }))} className="mt-4 w-full accent-primary" />
              <Progress value={values[key]} className="mt-2 h-1.5" />
            </div>
          ))}
          {total !== 100 && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">Adjust the weights by {Math.abs(100 - total)} percentage point{Math.abs(100 - total) === 1 ? "" : "s"} so the total equals 100%.</p>}
          <div className="flex justify-end border-t border-border pt-5"><Button disabled={total !== 100 || update.isPending} onClick={() => update.mutate()}><Save className="size-4" />{update.isPending ? "Saving…" : "Save weights"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
