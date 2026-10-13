import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export function EmployeeDashboard() {
  const history = useQuery({ queryKey: ["history"], queryFn: api.history });
  const latest = history.data?.find((h) => h.status === "Completed");

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>
      <p className="lead">Welcome back. Start a new assessment or review your history.</p>
      <div className="stats">
        <div className="stat"><strong>{history.data?.length ?? 0}</strong>Attempts</div>
        <div className="stat">
          <strong>{latest?.score != null ? `${latest.score}/${latest.maxScore}` : "—"}</strong>
          Latest score
        </div>
        <div className="stat"><strong>{latest?.technologyLabel ?? "—"}</strong>Last technology</div>
        <div className="stat"><strong>{latest?.skillLevel ?? "—"}</strong>Last level</div>
      </div>
      <div className="grid-3">
        <Link to="/assessment/new" className="card"><strong>New test</strong><p>Competency → Technology → Level</p></Link>
        <Link to="/assessment/assigned" className="card"><strong>Assigned tests</strong><p>Manager assignments</p></Link>
        <Link to="/assessment/history" className="card"><strong>Test history</strong><p>Full Q&amp;A detail</p></Link>
      </div>
    </div>
  );
}
