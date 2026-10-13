import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, CreateAssignmentBody } from "../../api/client";

export function ManagerDashboardPage() {
  const dash = useQuery({ queryKey: ["mgr-dash"], queryFn: api.managerDashboard });
  if (!dash.data) return <p>Loading…</p>;
  return (
    <div>
      <h2 className="page-title">Manager dashboard</h2>
      <div className="stats">
        <div className="stat"><strong>{dash.data.teamSize}</strong>Team size</div>
        <div className="stat"><strong>{dash.data.testsThisMonth}</strong>Tests this month</div>
        <div className="stat"><strong>{dash.data.averageScorePercent}%</strong>Avg score</div>
      </div>
      <table>
        <thead><tr><th>Employee</th><th>Attempts</th><th>Latest</th><th></th></tr></thead>
        <tbody>
          {dash.data.members.map((m) => (
            <tr key={m.employeeId}>
              <td>{m.fullName}</td>
              <td>{m.attemptCount}</td>
              <td>{m.latestScorePercent != null ? `${m.latestScorePercent}%` : "—"}</td>
              <td><Link to={`/manager/assessments/${m.employeeId}`}>Assessments</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ManagerTeamPage() {
  const team = useQuery({ queryKey: ["mgr-team"], queryFn: api.managerEmployees });
  return (
    <div>
      <h2 className="page-title">Team roster</h2>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Designation</th></tr></thead>
        <tbody>
          {team.data?.map((e) => (
            <tr key={e.id}><td>{e.fullName}</td><td>{e.email}</td><td>{e.designation}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ManagerAssessmentsPage({ employeeId }: { employeeId: string }) {
  const attempts = useQuery({
    queryKey: ["mgr-attempts", employeeId],
    queryFn: () => api.managerEmployeeAttempts(employeeId),
  });
  return (
    <div>
      <h2 className="page-title">Team assessments</h2>
      <table>
        <thead><tr><th>Date</th><th>Technology</th><th>Level</th><th>Score</th><th>Detail</th></tr></thead>
        <tbody>
          {attempts.data?.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.startedAtUtc).toLocaleDateString()}</td>
              <td>{a.technologyLabel}</td>
              <td>{a.skillLevel}</td>
              <td>{a.score != null ? `${a.score}/${a.maxScore}` : "—"}</td>
              <td>
                {a.status === "Completed" && (
                  <Link to={`/manager/assessments/${employeeId}/${a.id}`}>All Q&amp;A</Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ManagerAttemptDetailPage({ employeeId, attemptId }: { employeeId: string; attemptId: string }) {
  const detail = useQuery({
    queryKey: ["mgr-detail", employeeId, attemptId],
    queryFn: () => api.managerAttemptDetail(employeeId, attemptId),
  });
  if (!detail.data) return <p>Loading…</p>;
  return (
    <div>
      <h2 className="page-title">Attempt detail</h2>
      <p>{detail.data.score}/{detail.data.maxScore} — {detail.data.correctCount} correct, {detail.data.incorrectCount} wrong</p>
      {detail.data.questions.map((q) => (
        <div key={q.id} className="card" style={{ marginBottom: 8 }}>
          <span className={q.isCorrect ? "badge-ok" : "badge-bad"}>Q{q.sortOrder}</span> {q.stem}
        </div>
      ))}
    </div>
  );
}

export function AssignTestPage() {
  const employees = useQuery({ queryKey: ["mgr-team"], queryFn: api.managerEmployees });
  const competencies = useQuery({ queryKey: ["competencies"], queryFn: api.competencies });
  const levels = useQuery({ queryKey: ["levels"], queryFn: api.skillLevels });
  const qc = useQueryClient();
  const [form, setForm] = useState<CreateAssignmentBody>({
    employeeId: "",
    competencyId: "dotnet",
    technologyId: "efcore",
    skillLevel: "intermediate",
    notes: "",
  });
  const comp = competencies.data?.find((c) => c.id === form.competencyId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.createAssignment(form);
    qc.invalidateQueries({ queryKey: ["assignments"] });
    alert("Assignment created.");
  }

  return (
    <div>
      <h2 className="page-title">Assign test to employee</h2>
      <form onSubmit={submit} style={{ maxWidth: 480 }}>
        <div className="field">
          <label>Employee</label>
          <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
            <option value="">Select…</option>
            {employees.data?.map((e) => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Competency</label>
          <select value={form.competencyId} onChange={(e) => setForm({ ...form, competencyId: e.target.value })}>
            {competencies.data?.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Technology</label>
          <select value={form.technologyId} onChange={(e) => setForm({ ...form, technologyId: e.target.value })}>
            {comp?.technologies.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Skill level</label>
          <select value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}>
            {levels.data?.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ height: "auto", padding: 8 }} />
        </div>
        <button className="btn btn-primary" type="submit">Create assignment</button>
      </form>
    </div>
  );
}

export function ConfigAssignmentPage() {
  const config = useQuery({ queryKey: ["assessment-config"], queryFn: api.assessmentConfig });
  const qc = useQueryClient();
  if (!config.data) return <p>Loading…</p>;

  async function toggle() {
    await api.updateAssessmentConfig({
      manualAssignmentEnabled: !config.data!.manualAssignmentEnabled,
      notifyEmployeeOnAssignment: config.data!.notifyEmployeeOnAssignment,
      defaultDueDays: config.data!.defaultDueDays,
    });
    qc.invalidateQueries({ queryKey: ["assessment-config"] });
  }

  return (
    <div>
      <h2 className="page-title">Manual test assignment</h2>
      <div className="card" style={{ maxWidth: 480 }}>
        <p>Enable managers to assign tests to any employee.</p>
        <p><strong>Status:</strong> {config.data.manualAssignmentEnabled ? "Enabled" : "Disabled"}</p>
        <button className="btn btn-secondary" onClick={toggle}>Toggle</button>
        <p style={{ marginTop: 12 }}><Link to="/manager/assign-test">Assign test →</Link></p>
      </div>
    </div>
  );
}

export function MatchingConfigPage() {
  const weights = useQuery({ queryKey: ["weights"], queryFn: api.matchingWeights });
  const qc = useQueryClient();
  const [w, setW] = useState<import("../../api/client").MatchingWeights | null>(null);

  useEffect(() => {
    if (weights.data) setW(weights.data);
  }, [weights.data]);

  if (!w) return <p>Loading…</p>;

  async function save() {
    await api.updateMatchingWeights(w);
    qc.invalidateQueries({ queryKey: ["weights"] });
  }

  return (
    <div>
      <h2 className="page-title">Matching configuration</h2>
      <div className="stats">
        {(
          [
            ["requiredSkillMatchPercent", "Skill match %"],
            ["experiencePercent", "Experience %"],
            ["availabilityPercent", "Availability %"],
            ["certificationPercent", "Certification %"],
          ] as const
        ).map(([key, label]) => (
          <div className="stat" key={key}>
            <input
              type="number"
              value={w[key]}
              onChange={(e) => setW({ ...w, [key]: Number(e.target.value) })}
              style={{ width: 72 }}
            />
            <small>{label}</small>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={save}>Save weights</button>
    </div>
  );
}

export function AuditPage() {
  const audit = useQuery({ queryKey: ["audit"], queryFn: api.audit });
  return (
    <div>
      <h2 className="page-title">Audit history</h2>
      <table>
        <thead><tr><th>Time</th><th>Action</th></tr></thead>
        <tbody>
          {audit.data?.map((a) => (
            <tr key={a.id}><td>{new Date(a.createdAtUtc).toLocaleString()}</td><td>{a.action}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
