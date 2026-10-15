export type BreadcrumbEntry = {
  label: string;
  href?: string;
};

export type AppRoute = {
  path: string;
  label: string;
  description: string;
  keywords: string[];
  audience: "employee" | "manager" | "all";
};

export const appRoutes: AppRoute[] = [
  { path: "/dashboard", label: "Employee dashboard", description: "Assessment progress and quick actions", keywords: ["home", "progress"], audience: "employee" },
  { path: "/assessment/new", label: "New assessment", description: "Start a competency assessment", keywords: ["test", "skill"], audience: "employee" },
  { path: "/assessment/assigned", label: "Assigned tests", description: "Tests assigned by your manager", keywords: ["inbox", "due"], audience: "employee" },
  { path: "/assessment/history", label: "Assessment history", description: "Scores and previous attempts", keywords: ["results", "score"], audience: "employee" },
  { path: "/profile", label: "My profile", description: "Talent profile and employee details", keywords: ["employee", "account"], audience: "all" },
  { path: "/skills", label: "Skills", description: "Skills portfolio and proficiency", keywords: ["competency"], audience: "employee" },
  { path: "/opportunities", label: "Opportunities", description: "Internal mobility opportunities", keywords: ["jobs", "mobility"], audience: "employee" },
  { path: "/growth-plan", label: "Growth plan", description: "Career development roadmap", keywords: ["career", "learning"], audience: "employee" },
  { path: "/analytics", label: "Analytics", description: "Personal growth insights", keywords: ["insights", "chart"], audience: "employee" },
  { path: "/manager/dashboard", label: "Manager dashboard", description: "Team assessment overview", keywords: ["home", "team"], audience: "manager" },
  { path: "/manager/team", label: "Team roster", description: "Direct reports and talent profiles", keywords: ["employees", "people"], audience: "manager" },
  { path: "/manager/assign-test", label: "Assign assessment", description: "Create a team assessment assignment", keywords: ["test", "employee"], audience: "manager" },
  { path: "/manager/matching-config", label: "Matching configuration", description: "Configure candidate matching weights", keywords: ["weights", "settings"], audience: "manager" },
  { path: "/manager/audit", label: "Audit history", description: "Governance and activity history", keywords: ["log", "security"], audience: "manager" },
  { path: "/manager/talent-search", label: "Talent search", description: "Find internal talent", keywords: ["search", "skills"], audience: "manager" },
  { path: "/manager/approvals", label: "Mobility approvals", description: "Review pending mobility decisions", keywords: ["requests"], audience: "manager" },
];

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  assessment: "Assessments",
  new: "New assessment",
  test: "Assessment",
  results: "Results",
  history: "History",
  assigned: "Assigned tests",
  profile: "Profile",
  skills: "Skills",
  opportunities: "Opportunities",
  applications: "Applications",
  availability: "Availability",
  "career-interests": "Career interests",
  "growth-plan": "Growth plan",
  analytics: "Analytics",
  manager: "Manager",
  team: "Team",
  assessments: "Assessments",
  "assign-test": "Assign test",
  config: "Configuration",
  assignment: "Assignments",
  "matching-config": "Matching configuration",
  matching: "Candidate matching",
  "talent-search": "Talent search",
  requirements: "Requirements",
  shortlists: "Shortlists",
  approvals: "Approvals",
  audit: "Audit history",
};

const dynamicParents = new Set(["test", "results", "assessments"]);

export function pageTitle(pathname: string) {
  const crumbs = breadcrumbsFor(pathname);
  return crumbs.at(-1)?.label ?? "Talent Mobility";
}

export function breadcrumbsFor(pathname: string): BreadcrumbEntry[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Home" }];

  const isManager = segments[0] === "manager";
  const crumbs: BreadcrumbEntry[] = [
    { label: "Home", href: isManager ? "/manager/dashboard" : "/dashboard" },
  ];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    if (segment === "manager" || segment === "assessment") return;

    const previous = segments[index - 1];
    const isDynamic = isGuid(segment) || (previous && dynamicParents.has(previous) && !routeLabels[segment]);
    const label = isDynamic
      ? index === segments.length - 1
        ? "Details"
        : "Employee"
      : routeLabels[segment] ?? sentenceCase(segment);

    const isLast = index === segments.length - 1;
    crumbs.push({ label, href: isLast || isDynamic ? undefined : currentPath });
  });

  return dedupe(crumbs);
}

function isGuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function sentenceCase(value: string) {
  return value.replace(/-/g, " ").replace(/^./, (character) => character.toUpperCase());
}

function dedupe(entries: BreadcrumbEntry[]) {
  return entries.filter((entry, index) => index === 0 || entry.label !== entries[index - 1].label);
}
