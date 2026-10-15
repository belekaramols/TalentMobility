import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, ClipboardCheck, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type Notice = {
  id: string;
  title: string;
  detail: string;
  path: string;
  icon: typeof Bell;
};

export function NotificationCenter({ roles }: { roles: string[] }) {
  const navigate = useNavigate();
  const isManager = roles.some((role) => role === "Manager" || role === "Administrator");
  const assignments = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.assignments(1, 10),
    enabled: !isManager,
  });
  const manager = useQuery({
    queryKey: ["mgr-dash"],
    queryFn: api.managerDashboard,
    enabled: isManager,
  });
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("talent-mobility-read-notices") ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  const notices = useMemo<Notice[]>(() => {
    if (isManager) {
      const members = manager.data?.members ?? [];
      const pending = members.filter((member) => member.attemptCount === 0).length;
      return pending > 0
        ? [{ id: `team-pending-${pending}`, title: "Assessment participation", detail: `${pending} team member${pending === 1 ? "" : "s"} have no completed assessment.`, path: "/manager/team", icon: TrendingUp }]
        : [{ id: "team-current", title: "Team is up to date", detail: "Every team member has assessment history.", path: "/manager/dashboard", icon: CheckCheck }];
    }
    return (assignments.data?.items ?? [])
      .filter((assignment) => assignment.status === "Pending" || assignment.status === "InProgress")
      .slice(0, 5)
      .map((assignment) => ({
        id: assignment.id,
        title: assignment.status === "InProgress" ? "Continue assessment" : "New assigned assessment",
        detail: `${assignment.technologyLabel}${assignment.dueDateUtc ? ` · due ${formatDate(assignment.dueDateUtc)}` : ""}`,
        path: `/assessment/new?assignmentId=${assignment.id}`,
        icon: ClipboardCheck,
      }));
  }, [assignments.data, isManager, manager.data]);

  const unread = notices.filter((notice) => !readIds.includes(notice.id)).length;
  function markAllRead() {
    const ids = notices.map((notice) => notice.id);
    setReadIds(ids);
    localStorage.setItem("talent-mobility-read-notices", JSON.stringify(ids));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">{unread}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unread > 0 && <button type="button" onClick={markAllRead} className="px-2 text-xs font-medium text-primary hover:underline">Mark all read</button>}
        </div>
        <DropdownMenuSeparator />
        {notices.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          notices.map((notice) => {
            const Icon = notice.icon;
            const isRead = readIds.includes(notice.id);
            return (
              <DropdownMenuItem key={notice.id} onSelect={() => navigate(notice.path)} className="items-start py-3">
                <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {notice.title}
                    {!isRead && <span className="size-1.5 rounded-full bg-primary" />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{notice.detail}</span>
                </span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}
