import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Filter, X } from "lucide-react";
import { api } from "../api/client";
import { messages } from "../config/messages";
import { Pagination } from "../components/common/Pagination";
import { EmptyState, ErrorState, PageLoading } from "../components/common/PageState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { appConfig } from "../config/appConfig";
import { cn } from "../lib/utils";

const PAGE_SIZE = appConfig.pagination.historyPageSize;

export function HistoryPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("All");
  const [competencyId, setCompetencyId] = useState("");
  const [technologyId, setTechnologyId] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  const filters = useMemo(
    () => ({
      status,
      competencyId: competencyId || undefined,
      technologyId: technologyId || undefined,
      skillLevel: skillLevel || undefined,
    }),
    [status, competencyId, technologyId, skillLevel],
  );

  const competencies = useQuery({ queryKey: ["competencies"], queryFn: api.competencies });
  const levels = useQuery({ queryKey: ["levels"], queryFn: api.skillLevels });
  const history = useQuery({
    queryKey: ["history", page, PAGE_SIZE, filters],
    queryFn: () => api.history(page, PAGE_SIZE, filters),
  });

  const selectedCompetency = competencies.data?.find((c) => c.id === competencyId);
  const technologies = selectedCompetency?.technologies ?? [];

  useEffect(() => {
    setPage(1);
  }, [status, competencyId, technologyId, skillLevel]);

  useEffect(() => {
    if (competencyId && technologyId && !technologies.some((t) => t.id === technologyId)) {
      setTechnologyId("");
    }
  }, [competencyId, technologyId, technologies]);

  const hasActiveFilters =
    status !== "All" || !!competencyId || !!technologyId || !!skillLevel;

  function clearFilters() {
    setStatus("All");
    setCompetencyId("");
    setTechnologyId("");
    setSkillLevel("");
  }

  if (history.isPending || competencies.isPending || levels.isPending) return <PageLoading />;
  if (history.isError) return <ErrorState onRetry={() => history.refetch()} />;

  const rows = history.data?.items ?? [];
  const skillLevelLabel = (id: string) => levels.data?.find((l) => l.id === id)?.label ?? id;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Assessment record</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Assessment history</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review previous attempts, scores, and detailed answers.</p>
        </div>
      </section>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X className="size-4" />Clear filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Competency"
              value={competencyId}
              onChange={(value) => {
                setCompetencyId(value);
                setTechnologyId("");
              }}
              options={[
                { value: "", label: "All competencies" },
                ...(competencies.data?.map((c) => ({ value: c.id, label: c.label })) ?? []),
              ]}
            />
            <FilterSelect
              label="Course / technology"
              value={technologyId}
              onChange={setTechnologyId}
              disabled={!competencyId}
              options={[
                { value: "", label: competencyId ? "All courses" : "Select competency first" },
                ...technologies.map((t) => ({ value: t.id, label: t.label })),
              ]}
            />
            <FilterSelect
              label="Skill level"
              value={skillLevel}
              onChange={setSkillLevel}
              options={[
                { value: "", label: "All levels" },
                ...(levels.data?.map((l) => ({ value: l.id, label: l.label })) ?? []),
              ]}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "All", label: "All statuses" },
                { value: "Completed", label: "Completed" },
                { value: "InProgress", label: "In progress" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No matching attempts" : messages.pages.noAssessmentHistory.title}
          description={
            hasActiveFilters
              ? "Try changing or clearing your filters."
              : messages.pages.noAssessmentHistory.description
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
            ) : (
              <Button asChild><Link to="/assessment/new">Start an assessment</Link></Button>
            )
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your attempts</CardTitle>
            <CardDescription>
              {history.data?.totalCount} matching attempt{history.data?.totalCount === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden overflow-x-auto md:block">
              <table>
                <caption className="sr-only">Assessment history</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Assessment</th>
                    <th scope="col">Level</th>
                    <th scope="col">Score</th>
                    <th scope="col">Source</th>
                    <th scope="col"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap">{formatDate(row.startedAtUtc)}</td>
                      <td>
                        <p className="font-semibold">{row.technologyLabel}</p>
                        <p className="text-xs text-muted-foreground">{row.competencyLabel}</p>
                      </td>
                      <td><Badge variant="secondary">{skillLevelLabel(row.skillLevel)}</Badge></td>
                      <td>
                        {row.score != null ? (
                          <span className="font-semibold">{row.score}/{row.maxScore}</span>
                        ) : (
                          <Badge variant="warning">{row.status}</Badge>
                        )}
                      </td>
                      <td>{row.source}</td>
                      <td className="text-right">
                        {row.status === "Completed" && (
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/assessment/results/${row.id}`}>Details<ArrowRight className="size-4" /></Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 md:hidden">
              {rows.map((row) => (
                <Link
                  key={row.id}
                  to={row.status === "Completed" ? `/assessment/results/${row.id}` : "#"}
                  className="block rounded-xl border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.technologyLabel}</p>
                      <p className="text-xs text-muted-foreground">{row.competencyLabel}</p>
                    </div>
                    <Badge variant={row.status === "Completed" ? "success" : "warning"}>{row.status}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" />{formatDate(row.startedAtUtc)}
                    </span>
                    <span>{skillLevelLabel(row.skillLevel)}</span>
                    <span className="font-semibold text-foreground">
                      {row.score != null ? `${row.score}/${row.maxScore}` : "—"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination
              page={page}
              pageSize={history.data!.pageSize}
              totalCount={history.data!.totalCount}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        aria-label={label}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {options.map((option) => (
          <option key={option.value || `all-${label}`} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
