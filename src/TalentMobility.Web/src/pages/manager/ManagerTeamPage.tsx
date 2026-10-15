import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Pagination } from "../../components/common/Pagination";
import { EmptyState, ErrorState, PageLoading } from "../../components/common/PageState";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

export function ManagerTeamPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const team = useQuery({ queryKey: ["mgr-team", page], queryFn: () => api.managerEmployees(page, 20) });

  if (team.isPending) return <PageLoading />;
  if (team.isError) return <ErrorState onRetry={() => team.refetch()} />;
  const members = team.data.items.filter((member) =>
    `${member.fullName} ${member.email} ${member.designation ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-primary">People</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Team roster</h1>
        <p className="mt-2 text-sm text-muted-foreground">View direct reports and open their assessment history.</p>
      </section>
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
          <div><CardTitle>Direct reports</CardTitle><CardDescription>{team.data.totalCount} employees in your team</CardDescription></div>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search team</span>
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees…" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm" />
          </label>
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="p-5"><EmptyState title="No employees found" description="Try a different search term." /></div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table>
                  <caption className="sr-only">Team roster</caption>
                  <thead><tr><th scope="col">Employee</th><th scope="col">Designation</th><th scope="col">Business unit</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td><p className="font-semibold">{member.fullName}</p><p className="text-xs text-muted-foreground">{member.email}</p></td>
                        <td>{member.designation ?? "—"}</td><td>{member.businessUnitName ?? "—"}</td><td><Badge variant="success">Active</Badge></td>
                        <td className="text-right"><Button asChild variant="ghost" size="sm"><Link to={`/manager/assessments/${member.id}`}>Assessments<ArrowRight className="size-4" /></Link></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 p-4 md:hidden">
                {members.map((member) => (
                  <Link key={member.id} to={`/manager/assessments/${member.id}`} className="flex items-center gap-3 rounded-xl border border-border p-4">
                    <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><UsersRound className="size-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{member.fullName}</span><span className="block truncate text-xs text-muted-foreground">{member.designation ?? member.email}</span></span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
              <Pagination page={team.data.page} pageSize={team.data.pageSize} totalCount={team.data.totalCount} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
