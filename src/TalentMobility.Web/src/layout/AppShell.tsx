import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, CurrentUser } from "../api/client";
import { AppHeader } from "../components/layout/AppHeader";
import { AppSidebar } from "../components/layout/AppSidebar";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../components/ui/sheet";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "../lib/utils";

export function AppShell({
  user,
  children,
  onLogout,
}: {
  user: CurrentUser;
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const location = useLocation();
  const nav = useQuery({ queryKey: ["nav"], queryFn: api.navigation });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-200 md:block",
          sidebarCollapsed ? "w-[76px]" : "w-64",
        )}
      >
        {nav.isPending ? <SidebarSkeleton collapsed={sidebarCollapsed} /> : <AppSidebar groups={nav.data ?? []} collapsed={sidebarCollapsed} />}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent>
          <SheetTitle className="sr-only">Application navigation</SheetTitle>
          <SheetDescription className="sr-only">Navigate to Talent Mobility features.</SheetDescription>
          {nav.isPending ? (
            <SidebarSkeleton />
          ) : (
            <AppSidebar groups={nav.data ?? []} onNavigate={() => setMobileOpen(false)} />
          )}
        </SheetContent>
      </Sheet>

      <div className={cn("min-w-0 transition-[padding] duration-200", sidebarCollapsed ? "md:pl-[76px]" : "md:pl-64")}>
        <AppHeader
          user={user}
          pathname={location.pathname}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={onLogout}
        />
        <main id="main-content" className="content mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {nav.isError && (
            <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Navigation could not be loaded. Your current page is still available.
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarSkeleton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="h-full bg-sidebar p-4">
      <div className="mb-8 flex items-center gap-3">
        <Skeleton className="size-10 bg-sidebar-accent" />
        {!collapsed && <Skeleton className="h-8 flex-1 bg-sidebar-accent" />}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-10 bg-sidebar-accent" />
        ))}
      </div>
    </div>
  );
}
