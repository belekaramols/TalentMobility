import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { CalendarDays, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "../../api/client";
import { messages } from "../../config/messages";
import { ErrorState, PageLoading } from "../../components/common/PageState";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

const schema = z.object({
  employeeId: z.string().min(1, messages.validation.selectEmployee),
  competencyId: z.string().min(1, messages.validation.selectCompetency),
  technologyId: z.string().min(1, messages.validation.selectTechnology),
  skillLevel: z.string().min(1, messages.validation.selectSkillLevel),
  dueDateUtc: z.string().optional(),
  notes: z.string().max(1000, messages.validation.notesTooLong).optional(),
});
type AssignmentForm = z.infer<typeof schema>;

export function AssignTestPage() {
  const employees = useQuery({ queryKey: ["mgr-team", 1], queryFn: () => api.managerEmployees(1, 100) });
  const competencies = useQuery({ queryKey: ["competencies"], queryFn: api.competencies });
  const levels = useQuery({ queryKey: ["levels"], queryFn: api.skillLevels });
  const queryClient = useQueryClient();
  const form = useForm<AssignmentForm>({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: "", competencyId: "", technologyId: "", skillLevel: "", dueDateUtc: "", notes: "" },
  });
  const competencyId = form.watch("competencyId");
  const competency = competencies.data?.find((item) => item.id === competencyId);

  useEffect(() => {
    if (competency && !competency.technologies.some((item) => item.id === form.getValues("technologyId"))) {
      form.setValue("technologyId", competency.technologies[0]?.id ?? "");
    }
  }, [competency, form]);

  const create = useMutation({
    mutationFn: (values: AssignmentForm) => api.createAssignment({
      ...values,
      dueDateUtc: values.dueDateUtc ? new Date(`${values.dueDateUtc}T23:59:59`).toISOString() : undefined,
    }),
    onSuccess: () => {
      toast.success(messages.toast.assessmentAssigned);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (employees.isPending || competencies.isPending || levels.isPending) return <PageLoading />;
  if (employees.isError || competencies.isError || levels.isError) return <ErrorState onRetry={() => { employees.refetch(); competencies.refetch(); levels.refetch(); }} />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section><p className="text-sm font-medium text-primary">Team assessment</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Assign an assessment</h1><p className="mt-2 text-sm text-muted-foreground">Select a team member and configure the skill assessment they should complete.</p></section>
      <form onSubmit={form.handleSubmit((values) => create.mutate(values))}>
        <Card>
          <CardHeader><CardTitle>Assignment details</CardTitle><CardDescription>All required fields are marked below.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <Field label="Employee" error={form.formState.errors.employeeId?.message}>
              <select {...form.register("employeeId")} className="form-control"><option value="">Select employee…</option>{employees.data?.items.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select>
            </Field>
            <Field label="Skill level" error={form.formState.errors.skillLevel?.message}>
              <select {...form.register("skillLevel")} className="form-control"><option value="">Select level…</option>{levels.data?.map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}</select>
            </Field>
            <Field label="Competency" error={form.formState.errors.competencyId?.message}>
              <select {...form.register("competencyId")} className="form-control"><option value="">Select competency…</option>{competencies.data?.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
            </Field>
            <Field label="Technology" error={form.formState.errors.technologyId?.message}>
              <select {...form.register("technologyId")} className="form-control" disabled={!competency}><option value="">Select technology…</option>{competency?.technologies.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
            </Field>
            <Field label="Due date (optional)" error={form.formState.errors.dueDateUtc?.message}>
              <div className="relative"><CalendarDays className="absolute left-3 top-3 size-4 text-muted-foreground" /><input type="date" min={new Date().toISOString().slice(0, 10)} {...form.register("dueDateUtc")} className="form-control pl-9" /></div>
            </Field>
            <div className="md:col-span-2">
              <Field label="Manager notes (optional)" error={form.formState.errors.notes?.message}>
                <textarea rows={4} {...form.register("notes")} className="form-control min-h-28 py-3" placeholder="Add context or expectations for this assessment…" />
              </Field>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border pt-5 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => form.reset()}>Clear</Button>
              <Button type="submit" disabled={create.isPending}><Send className="size-4" />{create.isPending ? "Assigning…" : "Assign assessment"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="space-y-2 text-sm font-medium">{label}{children}{error && <span className="block text-xs text-destructive">{error}</span>}</label>;
}
