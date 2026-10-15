import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { ManagerDashboardPage } from "./manager/ManagerDashboardPage";

afterEach(() => vi.restoreAllMocks());

describe("dashboard states", () => {
  it("renders employee progress from paged history", async () => {
    vi.spyOn(api, "history").mockResolvedValue({
      items: [
        {
          id: "attempt-1",
          competencyLabel: ".NET",
          technologyLabel: "EF Core",
          skillLevel: "Intermediate",
          score: 8,
          maxScore: 10,
          status: "Completed",
          source: "Self",
          startedAtUtc: "2026-10-15T00:00:00Z",
          completedAtUtc: "2026-10-15T00:10:00Z",
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
    });

    renderWithClient(<EmployeeDashboard />);
    expect(await screen.findByText("80%")).toBeVisible();
    expect(screen.getAllByText("EF Core")).toHaveLength(2);
  });

  it("renders the manager empty state", async () => {
    vi.spyOn(api, "managerDashboard").mockResolvedValue({
      teamSize: 0,
      testsThisMonth: 0,
      averageScorePercent: 0,
      members: [],
    });

    renderWithClient(<ManagerDashboardPage />);
    expect(await screen.findByText("No team members assigned")).toBeVisible();
  });
});

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
