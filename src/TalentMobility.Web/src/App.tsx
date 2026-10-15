import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { AccessDeniedPage, NotFoundPage } from "./pages/ErrorPages";
import { ManagerDashboardPage } from "./pages/manager/ManagerDashboardPage";
import { ManagerTeamPage } from "./pages/manager/ManagerTeamPage";
import { ManagerAssessmentsPage, ManagerAttemptDetailPage } from "./pages/manager/ManagerAssessmentPages";
import { AssignTestPage } from "./pages/manager/AssignTestPage";
import { ConfigAssignmentPage } from "./pages/manager/ConfigAssignmentPage";
import { MatchingConfigPage } from "./pages/manager/MatchingConfigPage";
import { AuditPage } from "./pages/manager/AuditPage";

function Protected({
  user,
  children,
  onLogout,
  roles,
}: {
  user: CurrentUser | null;
  children: React.ReactNode;
  onLogout: () => void;
  roles?: string[];
}) {
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !user.roles.some((role) => roles.includes(role))) {
    return <AppShell user={user} onLogout={onLogout}><AccessDeniedPage /></AppShell>;
  }
  return (
    <AppShell user={user} onLogout={onLogout}>
      {children}
    </AppShell>
  );
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function logout() {
    try {
      await api.logout();
    } finally {
      queryClient.clear();
      setUser(null);
      navigate("/login", { replace: true });
    }
  }

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const expired = () => {
      queryClient.clear();
      setUser(null);
      toast.error("Your session has expired. Please sign in again.");
      navigate("/login", { replace: true });
    };
    window.addEventListener("talentmobility:session-expired", expired);
    return () => window.removeEventListener("talentmobility:session-expired", expired);
  }, [navigate, queryClient]);

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  const shell = (child: React.ReactNode) => (
    <Protected user={user} onLogout={logout}>
      {child}
    </Protected>
  );
  const managerShell = (child: React.ReactNode) => (
    <Protected user={user} onLogout={logout} roles={["Manager", "Administrator"]}>
      {child}
    </Protected>
  );

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage
            onLoggedIn={async () => {
              const currentUser = await api.me();
              setUser(currentUser);
              return currentUser;
            }}
          />
        }
      />
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
      <Route path="/manager/dashboard" element={managerShell(<ManagerDashboardPage />)} />
      <Route path="/manager/team" element={managerShell(<ManagerTeamPage />)} />
      <Route path="/manager/assessments" element={<Navigate to="/manager/team" replace />} />
      <Route path="/manager/assessments/:employeeId" element={managerShell(<ManagerAssessmentsRoute />)} />
      <Route path="/manager/assessments/:employeeId/:attemptId" element={managerShell(<ManagerAttemptDetailRoute />)} />
      <Route path="/manager/assign-test" element={managerShell(<AssignTestPage />)} />
      <Route path="/manager/config" element={managerShell(<ConfigAssignmentPage />)} />
      <Route path="/manager/config/assignment" element={managerShell(<ConfigAssignmentPage />)} />
      <Route path="/manager/matching-config" element={managerShell(<MatchingConfigPage />)} />
      <Route path="/manager/matching" element={managerShell(<PlaceholderPage title="Candidate matching" />)} />
      <Route path="/manager/talent-search" element={managerShell(<PlaceholderPage title="Talent search" />)} />
      <Route path="/manager/requirements" element={managerShell(<PlaceholderPage title="Requirements" />)} />
      <Route path="/manager/shortlists" element={managerShell(<PlaceholderPage title="Shortlists" />)} />
      <Route path="/manager/approvals" element={managerShell(<PlaceholderPage title="Mobility approvals" />)} />
      <Route path="/manager/audit" element={managerShell(<AuditPage />)} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
