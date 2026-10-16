import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CalendarDays, ClipboardCheck, ListOrdered, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { messages } from "../../config/messages";
import { ErrorState, PageLoading } from "../../components/common/PageState";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

export function ConfigAssignmentPage() {
  const config = useQuery({ queryKey: ["assessment-config"], queryFn: api.assessmentConfig });
  const queryClient = useQueryClient();
  const [manual, setManual] = useState(false);
  const [notify, setNotify] = useState(false);
  const [dueDays, setDueDays] = useState(7);
  const [questionCount, setQuestionCount] = useState(10);

  useEffect(() => {
    if (!config.data) return;
    setManual(config.data.manualAssignmentEnabled);
    setNotify(config.data.notifyEmployeeOnAssignment);
    setDueDays(config.data.defaultDueDays);
    setQuestionCount(config.data.questionCount);
  }, [config.data]);

  const update = useMutation({
    mutationFn: () => api.updateAssessmentConfig({
      manualAssignmentEnabled: manual,
      notifyEmployeeOnAssignment: notify,
      defaultDueDays: dueDays,
      questionCount,
    }),
    onSuccess: () => {
      toast.success(messages.toast.assessmentSettingsSaved);
      queryClient.invalidateQueries({ queryKey: ["assessment-config"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (config.isPending) return <PageLoading />;
  if (config.isError) return <ErrorState onRetry={() => config.refetch()} />;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section><p className="text-sm font-medium text-primary">Manager settings</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Assessment configuration</h1><p className="mt-2 text-sm text-muted-foreground">Control how manual team assignments behave.</p></section>
      <Card>
        <CardHeader><CardTitle>Assignment preferences</CardTitle><CardDescription>Changes apply to new assignments.</CardDescription></CardHeader>
        <CardContent className="space-y-1">
          <SettingRow icon={ClipboardCheck} title="Manual assignments" description="Allow managers to assign assessments to direct reports.">
            <Switch checked={manual} onChange={setManual} label="Manual assignments" />
          </SettingRow>
          <SettingRow icon={BellRing} title="Employee notifications" description="Notify employees when a new assessment is assigned.">
            <Switch checked={notify} onChange={setNotify} label="Employee notifications" />
          </SettingRow>
          <SettingRow icon={CalendarDays} title="Default due period" description="Number of days employees have to complete an assignment.">
            <div className="flex items-center gap-2"><input aria-label="Default due days" type="number" min={1} max={365} value={dueDays} onChange={(event) => setDueDays(Number(event.target.value))} className="h-10 w-24 rounded-lg border border-input bg-background px-3 text-sm" /><span className="text-sm text-muted-foreground">days</span></div>
          </SettingRow>
          <SettingRow icon={ListOrdered} title="Questions per assessment" description="How many multiple-choice questions are generated when an employee starts a test.">
            <div className="flex items-center gap-2"><input aria-label="Questions per assessment" type="number" min={5} max={50} value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="h-10 w-24 rounded-lg border border-input bg-background px-3 text-sm" /><span className="text-sm text-muted-foreground">questions</span></div>
          </SettingRow>
          <div className="flex justify-end border-t border-border pt-5"><Button disabled={update.isPending || dueDays < 1 || dueDays > 365 || questionCount < 5 || questionCount > 50} onClick={() => update.mutate()}><Save className="size-4" />{update.isPending ? "Saving…" : "Save settings"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({ icon: Icon, title, description, children }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; children: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 border-b border-border py-5 last:border-0 sm:flex-row sm:items-center"><div className="flex gap-3"><span className="h-fit rounded-lg bg-primary/10 p-2 text-primary"><Icon className="size-4" /></span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div></div>{children}</div>;
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} /></button>;
}
