import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { NavGroup } from "../../api/client";
import { AppSidebar } from "./AppSidebar";

const groups: NavGroup[] = [
  {
    label: "Assessment",
    items: [
      { label: "New Test", path: "/assessment/new", isEnabled: true },
      { label: "History", path: "/assessment/history", isEnabled: true },
      { label: "Future feature", path: "/future", isEnabled: false },
    ],
  },
];

describe("AppSidebar", () => {
  it("selects the parent item for nested routes", () => {
    render(
      <MemoryRouter initialEntries={["/assessment/test/abc"]}>
        <AppSidebar groups={groups} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "New Test" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Future feature" })).not.toBeInTheDocument();
  });

  it("provides labels when the desktop sidebar is collapsed", () => {
    render(
      <MemoryRouter initialEntries={["/assessment/history"]}>
        <AppSidebar groups={groups} collapsed />
      </MemoryRouter>,
    );

    expect(screen.getByTitle("History")).toHaveAttribute("aria-current", "page");
  });
});
