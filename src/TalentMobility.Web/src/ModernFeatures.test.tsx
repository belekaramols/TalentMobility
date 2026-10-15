import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api/client";
import { CommandMenu } from "./components/layout/CommandMenu";
import { ThemeProvider, useTheme } from "./components/theme/ThemeProvider";
import { PlaceholderPage } from "./pages/PlaceholderPage";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("modern application foundations", () => {
  it("persists a selected theme and applies it to the document", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeHarness /></ThemeProvider>);
    await user.click(screen.getByRole("button", { name: "Use dark theme" }));
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(localStorage.getItem("talent-mobility-theme")).toBe("dark");
  });

  it("opens command navigation with Ctrl+K and respects the employee audience", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><CommandMenu roles={["Employee"]} /></MemoryRouter>);
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByText("Employee dashboard")).toBeVisible();
    expect(screen.queryByText("Manager dashboard")).not.toBeInTheDocument();
  });

  it("dispatches a session-expired event for protected 401 responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ title: "Unauthorized", status: 401 }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    )));
    const expired = vi.fn();
    window.addEventListener("talentmobility:session-expired", expired, { once: true });
    await expect(api.me()).rejects.toEqual(expect.objectContaining({ status: 401 }));
    expect(expired).toHaveBeenCalledOnce();
  });

  it("renders route-specific roadmap content without implying it is available", () => {
    render(<PlaceholderPage title="Growth plan" />);
    expect(screen.getByText("Milestones and development actions")).toBeVisible();
    expect(screen.getByText("On the roadmap")).toBeVisible();
    expect(screen.getByText(/not active yet/i)).toBeVisible();
  });
});

function ThemeHarness() {
  const { setTheme } = useTheme();
  return <button type="button" onClick={() => setTheme("dark")}>Use dark theme</button>;
}
