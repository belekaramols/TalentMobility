import { describe, expect, it } from "vitest";
import { breadcrumbsFor, pageTitle } from "./routes";

describe("route metadata", () => {
  it("creates employee breadcrumbs", () => {
    expect(breadcrumbsFor("/assessment/history")).toEqual([
      { label: "Home", href: "/dashboard" },
      { label: "History" },
    ]);
    expect(pageTitle("/assessment/history")).toBe("History");
  });

  it("hides dynamic identifiers behind useful labels", () => {
    const employeeId = "11111111-1111-1111-1111-111111111101";
    const attemptId = "22222222-2222-4222-8222-222222222202";
    const breadcrumbs = breadcrumbsFor(`/manager/assessments/${employeeId}/${attemptId}`);

    expect(breadcrumbs.map((item) => item.label)).toEqual(["Home", "Assessments", "Employee", "Details"]);
    expect(breadcrumbs.some((item) => item.label.includes(employeeId))).toBe(false);
  });
});
