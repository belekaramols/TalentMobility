import { Check, ChevronDown, LogOut, Menu, Monitor, Moon, PanelLeftClose, PanelLeftOpen, Sun, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import type { CurrentUser } from "../../api/client";
import { pageTitle } from "../../config/routes";
import { useTheme, type Theme } from "../theme/ThemeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { PageBreadcrumbs } from "./PageBreadcrumbs";
import { CommandMenu } from "./CommandMenu";
import { NotificationCenter } from "./NotificationCenter";

type AppHeaderProps = {
  user: CurrentUser;
  pathname: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
  onLogout: () => void;
};

export function AppHeader({
  user,
  pathname,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobile,
  onLogout,
}: AppHeaderProps) {
  const title = pageTitle(pathname);
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={onOpenMobile}
        >
          <Menu className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
          onClick={onToggleSidebar}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:hidden">{title}</p>
          <PageBreadcrumbs pathname={pathname} />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <CommandMenu roles={user.roles} />
        <NotificationCenter roles={user.roles} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Change color theme">
              {resolvedTheme === "dark" ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            {([
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
              ["system", "System", Monitor],
            ] as const).map(([value, label, Icon]) => (
              <DropdownMenuItem key={value} onSelect={() => setTheme(value as Theme)}>
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {theme === value && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto gap-3 px-2 py-1.5"
            aria-label={`Open profile menu for ${user.fullName}`}
          >
            <Avatar>
              <AvatarImage src={user.profilePicUrl} alt={`${user.fullName} profile`} />
              <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-40 text-left lg:block">
              <span className="block truncate text-sm font-semibold">{user.fullName}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {user.designation ?? user.roles[0]}
              </span>
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <span className="block truncate">{user.fullName}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <UserRound className="size-4" />
              My profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onLogout}>
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
