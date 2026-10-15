import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { appRoutes } from "../../config/routes";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";

export function CommandMenu({ roles }: { roles: string[] }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isManager = roles.some((role) => role === "Manager" || role === "Administrator");
  const routes = useMemo(
    () => appRoutes.filter((route) => route.audience === "all" || route.audience === (isManager ? "manager" : "employee")),
    [isManager],
  );

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);

  function select(path: string) {
    setOpen(false);
    navigate(path);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-border bg-background px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted xl:flex"
      >
        <Search className="size-4" />
        <span className="flex-1">Search pages…</span>
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">Ctrl K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Navigate to a page</DialogTitle>
          <DialogDescription className="sr-only">Search application routes and open a page.</DialogDescription>
          <Command className="bg-card" loop>
            <div className="flex items-center border-b border-border px-4">
              <Search className="mr-3 size-4 text-muted-foreground" />
              <Command.Input
                autoFocus
                placeholder="Search pages and actions…"
                className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">No pages found.</Command.Empty>
              <Command.Group heading="Navigate" className="text-xs text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {routes.map((route) => (
                  <Command.Item
                    key={route.path}
                    value={`${route.label} ${route.keywords.join(" ")}`}
                    onSelect={() => select(route.path)}
                    className="cursor-default rounded-lg px-3 py-2.5 text-foreground outline-none data-[selected=true]:bg-muted"
                  >
                    <span className="block text-sm font-medium">{route.label}</span>
                    <span className="ml-auto hidden text-xs text-muted-foreground sm:block">{route.description}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
