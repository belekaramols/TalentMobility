import {
  AppWindow,
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  FileClock,
  Gauge,
  ListChecks,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { NavGroup } from "../../api/client";
import { cn } from "../../lib/utils";

type AppSidebarProps = {
  groups: NavGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
};

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": Gauge,
  "/assessment/new": Sparkles,
  "/assessment/assigned": ClipboardCheck,
  "/assessment/history": FileClock,
  "/profile": UserRound,
  "/skills": ListChecks,
  "/opportunities": BriefcaseBusiness,
  "/applications": AppWindow,
  "/availability": Target,
  "/analytics": BarChart3,
  "/manager/dashboard": Gauge,
  "/manager/team": UsersRound,
  "/manager/assessments": ClipboardCheck,
  "/manager/talent-search": Search,
  "/manager/matching": Target,
  "/manager/matching-config": Settings,
  "/manager/audit": ShieldCheck,
  "/manager/config": Settings,
  "/manager/config/assignment": ClipboardCheck,
  "/manager/assign-test": Sparkles,
};

export function AppSidebar({ groups, collapsed = false, onNavigate }: AppSidebarProps) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-20 items-center border-b border-sidebar-border px-5", collapsed && "justify-center px-2")}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black tracking-tight text-primary">
          TTN
        </div>
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <p className="truncate text-sm font-bold tracking-wide text-white">TO THE NEW</p>
            <p className="truncate text-xs text-sidebar-muted">Talent Mobility & Growth</p>
          </div>
        )}
      </div>

      <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div className="mb-5" key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = icons[item.path] ?? AppWindow;
                const active = isActive(location.pathname, item.path);
                return item.isEnabled ? (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:ring-offset-sidebar",
                      active && "bg-sidebar-accent text-white",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <Icon className={cn("size-[18px] shrink-0", active && "text-white")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {active && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-white" />}
                  </Link>
                ) : (
                  <div
                    key={item.path}
                    title={collapsed ? `${item.label} (coming soon)` : undefined}
                    aria-disabled="true"
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-sidebar-muted/50",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-muted">
          Talent Mobility Platform
        </div>
      )}
    </div>
  );
}

function isActive(pathname: string, itemPath: string) {
  if (pathname === itemPath) return true;
  if (itemPath === "/dashboard" || itemPath === "/manager/dashboard") return false;
  if (itemPath === "/assessment/new") return pathname.startsWith("/assessment/test/");
  if (itemPath === "/assessment/history") return pathname.startsWith("/assessment/results/");
  return pathname.startsWith(`${itemPath}/`);
}
