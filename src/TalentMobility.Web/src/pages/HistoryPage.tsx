import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function HistoryPage() {
  const history = useQuery({ queryKey: ["history"], queryFn: api.history });

  return (
    <div>
      <h2 className="page-title">Test history</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Competency</th>
            <th>Technology</th>
            <th>Level</th>
            <th>Score</th>
            <th>Source</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {history.data?.map((row) => (
            <tr key={row.id}>
              <td>{new Date(row.startedAtUtc).toLocaleDateString()}</td>
              <td>{row.competencyLabel}</td>
              <td>{row.technologyLabel}</td>
              <td>{row.skillLevel}</td>
              <td>{row.score != null ? `${row.score}/${row.maxScore}` : "—"}</td>
              <td>{row.source}</td>
              <td>
                {row.status === "Completed" ? (
                  <Link to={`/assessment/results/${row.id}`}>All Q&amp;A</Link>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
