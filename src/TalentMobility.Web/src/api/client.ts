const base = "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
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
  history: () => request<AttemptSummary[]>("/api/attempts/me"),
  attemptDetail: (id: string) => request<AttemptResult>(`/api/attempts/${id}/detail`),
  profile: () => request<EmployeeProfile>("/api/profile/me"),
  assignments: () => request<Assignment[]>("/api/assignments/me"),
  managerDashboard: () => request<ManagerDashboard>("/api/manager/dashboard"),
  managerEmployees: () => request<EmployeeListItem[]>("/api/manager/employees"),
  managerEmployeeAttempts: (id: string) => request<AttemptSummary[]>(`/api/manager/employees/${id}/attempts`),
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
  audit: () => request<AuditEntry[]>("/api/manager/audit"),
};

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
export type EmployeeProfile = Record<string, unknown>;
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
    attemptCount: number;
    latestScorePercent?: number;
  }[];
};
export type EmployeeListItem = { id: string; fullName: string; email: string; designation?: string };
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
export type AuditEntry = { id: string; action: string; createdAtUtc: string; metadataJson?: string };
