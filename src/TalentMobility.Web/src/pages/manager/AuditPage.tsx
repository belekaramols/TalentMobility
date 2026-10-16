import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { api } from "../../api/client";
import { messages } from "../../config/messages";
import { EmptyState, ErrorState, PageLoading } from "../../components/common/PageState";
import { Pagination } from "../../components/common/Pagination";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

const pageSize = 15;

export function AuditPage() {
  const [page, setPage] = useState(1);
  const audit = useQuery({ queryKey: ["audit", page], queryFn: () => api.audit(page, pageSize) });
  if (audit.isPending) return <PageLoading />;
  if (audit.isError) return <ErrorState onRetry={() => audit.refetch()} />;
  const result = audit.data;
  return (
    <div className="space-y-6">
      <section><p className="text-sm font-medium text-primary">Governance</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Audit activity</h1><p className="mt-2 text-sm text-muted-foreground">A traceable record of actions taken across the talent mobility workspace.</p></section>
      <Card>
        <CardHeader><CardTitle>Activity log</CardTitle><CardDescription>{result.totalCount} recorded event{result.totalCount === 1 ? "" : "s"}</CardDescription></CardHeader>
        <CardContent>
          {!result.items.length ? <EmptyState title={messages.pages.noAuditActivity.title} description={messages.pages.noAuditActivity.description} /> : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="pb-3 font-semibold">Action</th><th className="pb-3 font-semibold">Actor</th><th className="pb-3 font-semibold">Date</th></tr></thead>
                  <tbody>{result.items.map((item) => <tr key={item.id} className="border-b border-border/70 last:border-0"><td className="py-4"><Badge variant="secondary">{item.action}</Badge></td><td className="py-4">{item.actorName ?? "System"}</td><td className="py-4 text-muted-foreground">{formatDate(item.createdAtUtc)}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="space-y-3 md:hidden">{result.items.map((item) => <div key={item.id} className="rounded-xl border border-border p-4"><div className="flex items-center justify-between gap-2"><Badge variant="secondary">{item.action}</Badge><span className="text-xs text-muted-foreground">{formatDate(item.createdAtUtc)}</span></div><p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><UserRound className="size-4" />{item.actorName ?? "System"}</p></div>)}</div>
              <Pagination page={result.page} pageSize={result.pageSize} totalCount={result.totalCount} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
