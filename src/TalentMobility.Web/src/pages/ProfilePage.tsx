import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Building2, IdCard, Mail, ShieldCheck, UserRound } from "lucide-react";
import { api } from "../api/client";
import { ErrorState, PageLoading } from "../components/common/PageState";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export function ProfilePage() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: api.profile });
  const p = profile.data;
  if (profile.isPending) return <PageLoading />;
  if (profile.isError || !p) return <ErrorState title="Profile unavailable" onRetry={() => profile.refetch()} />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm font-medium text-primary">Talent profile</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">My profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your organization profile and current talent classification.</p>
      </section>

      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary to-blue-700 dark:from-blue-900 dark:to-slate-900" />
        <CardContent className="-mt-12 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <Avatar className="size-24 border-4 border-card bg-secondary">
              <AvatarImage src={p.profilePicUrl} alt={`${p.fullName} profile`} />
              <AvatarFallback className="text-2xl">{initials(p.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 pb-1">
              <h2 className="truncate text-2xl font-bold">{p.fullName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.designation ?? "Employee"}</p>
            </div>
            <Badge variant="success"><ShieldCheck className="mr-1 size-3.5" />Verified employee</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Employee information</CardTitle><CardDescription>Core organization details.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ProfileField icon={Mail} label="Work email" value={p.email} />
            <ProfileField icon={IdCard} label="Employee ID" value={String(p.newerId)} />
            <ProfileField icon={BriefcaseBusiness} label="Designation" value={p.designation} />
            <ProfileField icon={Building2} label="Business unit" value={p.businessUnitName} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Talent classification</CardTitle><CardDescription>Your current organization placement.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <ProfileField icon={UserRound} label="Primary competency" value={p.competencyName} />
            <ProfileField icon={ShieldCheck} label="HR role" value={p.hrRoleName} />
            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Skills and career preferences will enrich this profile as those modules become available.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileField({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-4">
      <span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="size-4" /></span>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value || "Not provided"}</p></div>
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
