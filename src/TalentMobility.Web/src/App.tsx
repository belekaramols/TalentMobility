import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { api, CurrentUser } from "./api/client";
import { AppShell } from "./layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { NewTestWizard } from "./pages/NewTestWizard";
import { TestPage } from "./pages/TestPage";
import { ResultsPage } from "./pages/ResultsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { AssignedTestsPage } from "./pages/AssignedTestsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import {
  AssignTestPage,
  AuditPage,
  ConfigAssignmentPage,
  ManagerAssessmentsPage,
  ManagerAttemptDetailPage,
  ManagerDashboardPage,
  ManagerTeamPage,
  MatchingConfigPage,
} from "./pages/manager/ManagerPages";

function Protected({ user, children }: { user: CurrentUser | null; children: React.ReactNode }) {
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell user={user}>{children}</AppShell>;
}

function ManagerAssessmentsRoute() {
  const { employeeId } = useParams();
  return <ManagerAssessmentsPage employeeId={employeeId!} />;
}

function ManagerAttemptDetailRoute() {
  const { employeeId, attemptId } = useParams();
  return <ManagerAttemptDetailPage employeeId={employeeId!} attemptId={attemptId!} />;
}

export default function App() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  const shell = (child: React.ReactNode) => <Protected user={user}>{child}</Protected>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLoggedIn={() => api.me().then(setUser)} />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="/dashboard" element={shell(<EmployeeDashboard />)} />
      <Route path="/assessment/new" element={shell(<NewTestWizard />)} />
      <Route path="/assessment/test/:attemptId" element={shell(<TestPage />)} />
      <Route path="/assessment/results/:attemptId" element={shell(<ResultsPage />)} />
      <Route path="/assessment/history" element={shell(<HistoryPage />)} />
      <Route path="/assessment/assigned" element={shell(<AssignedTestsPage />)} />
      <Route path="/profile" element={shell(<ProfilePage />)} />
      <Route path="/skills" element={shell(<PlaceholderPage title="Skills" />)} />
      <Route path="/opportunities" element={shell(<PlaceholderPage title="Opportunities" />)} />
      <Route path="/applications" element={shell(<PlaceholderPage title="My applications" />)} />
      <Route path="/availability" element={shell(<PlaceholderPage title="Availability" />)} />
      <Route path="/career-interests" element={shell(<PlaceholderPage title="Career interests" />)} />
      <Route path="/growth-plan" element={shell(<PlaceholderPage title="Growth plan" />)} />
      <Route path="/analytics" element={shell(<PlaceholderPage title="Analytics" />)} />
      <Route path="/manager/dashboard" element={shell(<ManagerDashboardPage />)} />
      <Route path="/manager/team" element={shell(<ManagerTeamPage />)} />
      <Route path="/manager/assessments/:employeeId" element={shell(<ManagerAssessmentsRoute />)} />
      <Route path="/manager/assessments/:employeeId/:attemptId" element={shell(<ManagerAttemptDetailRoute />)} />
      <Route path="/manager/assign-test" element={shell(<AssignTestPage />)} />
      <Route path="/manager/config" element={shell(<ConfigAssignmentPage />)} />
      <Route path="/manager/config/assignment" element={shell(<ConfigAssignmentPage />)} />
      <Route path="/manager/matching-config" element={shell(<MatchingConfigPage />)} />
      <Route path="/manager/matching" element={shell(<PlaceholderPage title="Candidate matching" />)} />
      <Route path="/manager/talent-search" element={shell(<PlaceholderPage title="Talent search" />)} />
      <Route path="/manager/requirements" element={shell(<PlaceholderPage title="Requirements" />)} />
      <Route path="/manager/shortlists" element={shell(<PlaceholderPage title="Shortlists" />)} />
      <Route path="/manager/approvals" element={shell(<PlaceholderPage title="Mobility approvals" />)} />
      <Route path="/manager/audit" element={shell(<AuditPage />)} />
    </Routes>
  );
}
