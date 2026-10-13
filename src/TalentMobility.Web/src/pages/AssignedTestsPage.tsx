import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function AssignedTestsPage() {
  const list = useQuery({ queryKey: ["assignments"], queryFn: api.assignments });

  return (
    <div>
      <h2 className="page-title">Assigned tests</h2>
      <table>
        <thead>
          <tr>
            <th>Assigned by</th>
            <th>Competency</th>
            <th>Technology</th>
            <th>Level</th>
            <th>Due</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.data?.map((a) => (
            <tr key={a.id}>
              <td>{a.assignedByName}</td>
              <td>{a.competencyLabel}</td>
              <td>{a.technologyLabel}</td>
              <td>{a.skillLevel}</td>
              <td>{a.dueDateUtc ? new Date(a.dueDateUtc).toLocaleDateString() : "—"}</td>
              <td>{a.status}</td>
              <td>
                {a.status === "Pending" || a.status === "InProgress" ? (
                  <Link to={`/assessment/new?assignmentId=${a.id}`}>Start</Link>
                ) : a.attemptId ? (
                  <Link to={`/assessment/results/${a.attemptId}`}>View</Link>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
