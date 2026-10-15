import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { api } from "../../api/client";
import { ThemeProvider } from "../theme/ThemeProvider";
import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("opens the profile menu and logs out", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    vi.spyOn(api, "assignments").mockResolvedValue({ items: [], page: 1, pageSize: 10, totalCount: 0 });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ThemeProvider>
            <AppHeader
              user={{
                id: "1",
                email: "rahul@example.com",
                fullName: "Rahul Kumar",
                designation: "Software Engineer",
                roles: ["Employee"],
              }}
              pathname="/dashboard"
              sidebarCollapsed={false}
              onToggleSidebar={vi.fn()}
              onOpenMobile={vi.fn()}
              onLogout={onLogout}
            />
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open profile menu for Rahul Kumar" }));
    expect(screen.getByText("rahul@example.com")).toBeVisible();
    await user.click(screen.getByRole("menuitem", { name: /log out/i }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
