const base = "";
let csrfToken: string | null = null;

export type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
  traceId?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly problem?: ProblemDetails,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function csrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${base}/api/auth/csrf`, { credentials: "include" });
  if (!res.ok) throw new Error("Unable to start a secure session.");
  const data = (await res.json()) as { token: string };
  csrfToken = data.token;
  return csrfToken;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (method !== "GET" && method !== "HEAD") headers["X-XSRF-TOKEN"] = await csrf();
  const res = await fetch(`${base}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    let problem: ProblemDetails | undefined;
    try {
      problem = text ? JSON.parse(text) as ProblemDetails : undefined;
    } catch {
      problem = undefined;
    }
    if (res.status === 401 && path !== "/api/auth/login") {
      csrfToken = null;
      window.dispatchEvent(new CustomEvent("talentmobility:session-expired"));
    }
    const validation = problem?.errors ? Object.values(problem.errors).flat()[0] : undefined;
    const message = (validation ?? problem?.detail ?? problem?.title ?? text) || res.statusText;
    throw new ApiError(message, res.status, problem);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: async (email: string, password: string) => {
    const result = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    csrfToken = null;
    return result;
  },
  logout: async () => {
    await request<void>("/api/auth/logout", { method: "POST" });
    csrfToken = null;
  },
  me: () => request<CurrentUser>("/api/auth/me"),
  navigation: () => request<NavGroup[]>("/api/navigation"),
  competencies: () => request<Competency[]>("/api/catalog/competencies"),
  skillLevels: () => request<SkillLevel[]>("/api/catalog/skill-levels"),
  startAttempt: (body: StartAttemptBody) =>
    request<AttemptInProgress>("/api/attempts/start", { method: "POST", body: JSON.stringify(body) }),
  getAttempt: (id: string) => request<AttemptInProgress>(`/api/attempts/${id}`),
  submitAttempt: (id: string, answers: { questionId: string; selectedOptionIndex: number }[]) =>
    request<AttemptResult>(`/api/attempts/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  history: (page = 1, pageSize = 20) => request<Paged<AttemptSummary>>(`/api/attempts/me?page=${page}&pageSize=${pageSize}`),
  attemptDetail: (id: string) => request<AttemptResult>(`/api/attempts/${id}/detail`),
  profile: () => request<EmployeeProfile>("/api/profile/me"),
  assignments: (page = 1, pageSize = 20) => request<Paged<Assignment>>(`/api/assignments/me?page=${page}&pageSize=${pageSize}`),
  managerDashboard: () => request<ManagerDashboard>("/api/manager/dashboard"),
  managerEmployees: (page = 1, pageSize = 20) => request<Paged<EmployeeListItem>>(`/api/manager/employees?page=${page}&pageSize=${pageSize}`),
  managerEmployeeAttempts: (id: string, page = 1, pageSize = 20) =>
    request<Paged<AttemptSummary>>(`/api/manager/employees/${id}/attempts?page=${page}&pageSize=${pageSize}`),
  managerAttemptDetail: (employeeId: string, attemptId: string) =>
    request<AttemptResult>(`/api/manager/employees/${employeeId}/attempts/${attemptId}/detail`),
  createAssignment: (body: CreateAssignmentBody) =>
    request("/api/manager/assignments", { method: "POST", body: JSON.stringify(body) }),
  assessmentConfig: () => request<AssessmentConfig>("/api/manager/assessment-config"),
  updateAssessmentConfig: (body: Partial<AssessmentConfig>) =>
    request("/api/manager/assessment-config", { method: "PUT", body: JSON.stringify(body) }),
  matchingWeights: () => request<MatchingWeights>("/api/manager/matching-weights"),
  updateMatchingWeights: (body: MatchingWeights) =>
    request("/api/manager/matching-weights", { method: "PUT", body: JSON.stringify(body) }),
  audit: (page = 1, pageSize = 20) => request<Paged<AuditEntry>>(`/api/manager/audit?page=${page}&pageSize=${pageSize}`),
};

export type Paged<T> = { items: T[]; page: number; pageSize: number; totalCount: number };

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  designation?: string;
  competencyName?: string;
  profilePicUrl?: string;
  roles: string[];
};

export type NavGroup = { label: string; items: { label: string; path: string; isEnabled: boolean }[] };
export type Competency = { id: string; label: string; technologies: { id: string; label: string }[] };
export type SkillLevel = { id: string; label: string; description: string };
export type StartAttemptBody = {
  competencyId: string;
  technologyId: string;
  skillLevel: string;
  assignmentId?: string;
};
export type AttemptInProgress = {
  id: string;
  competencyLabel: string;
  technologyLabel: string;
  skillLevel: string;
  questions: { id: string; sortOrder: number; stem: string; options: string[] }[];
};
export type AttemptResult = {
  id: string;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  questions: {
    id: string;
    sortOrder: number;
    stem: string;
    options: string[];
    selectedOptionIndex?: number;
    correctOptionIndex: number;
    isCorrect: boolean;
  }[];
};
export type AttemptSummary = {
  id: string;
  competencyLabel: string;
  technologyLabel: string;
  skillLevel: string;
  score?: number;
  maxScore: number;
  status: string;
  source: string;
  startedAtUtc: string;
  completedAtUtc?: string;
};
export type EmployeeProfile = {
  id: string;
  newerId: number;
  email: string;
  fullName: string;
  designation?: string;
  competencyName?: string;
  businessUnitName?: string;
  profilePicUrl?: string;
  hrRoleName?: string;
};
export type Assignment = {
  id: string;
  assignedByName: string;
  competencyLabel: string;
  technologyLabel: string;
  skillLevel: string;
  dueDateUtc?: string;
  status: string;
  attemptId?: string;
};
export type ManagerDashboard = {
  teamSize: number;
  testsThisMonth: number;
  averageScorePercent: number;
  members: {
    employeeId: string;
    fullName: string;
    email: string;
    competencyName?: string;
    attemptCount: number;
    latestScorePercent?: number;
    bestScorePercent?: number;
  }[];
};
export type EmployeeListItem = {
  id: string;
  fullName: string;
  email: string;
  designation?: string;
  businessUnitName?: string;
};
export type CreateAssignmentBody = {
  employeeId: string;
  competencyId: string;
  technologyId: string;
  skillLevel: string;
  dueDateUtc?: string;
  notes?: string;
};
export type AssessmentConfig = {
  manualAssignmentEnabled: boolean;
  notifyEmployeeOnAssignment: boolean;
  defaultDueDays: number;
};
export type MatchingWeights = {
  requiredSkillMatchPercent: number;
  experiencePercent: number;
  availabilityPercent: number;
  certificationPercent: number;
};
export type AuditEntry = { id: string; action: string; createdAtUtc: string; actorName?: string };
