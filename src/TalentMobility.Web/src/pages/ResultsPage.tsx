import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, AttemptResult } from "../api/client";

export function ResultsPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const cached = location.state?.result as AttemptResult | undefined;
  const detail = useQuery({
    queryKey: ["detail", attemptId],
    queryFn: () => api.attemptDetail(attemptId!),
    enabled: !!attemptId && !cached,
  });
  const data = cached ?? detail.data;
  if (!data) return <p>Loading…</p>;

  return (
    <div>
      <h2 className="page-title">Assessment complete</h2>
      <div className="stat" style={{ maxWidth: 320, marginBottom: 20 }}>
        <strong>{data.score} / {data.maxScore}</strong>
        <span className="badge-ok" style={{ marginLeft: 8 }}>{data.correctCount} correct</span>
        <span className="badge-bad" style={{ marginLeft: 8 }}>{data.incorrectCount} incorrect</span>
      </div>
      {data.questions.map((q) => (
        <div key={q.id} className="card" style={{ marginBottom: 8, cursor: "default" }}>
          <span className={q.isCorrect ? "badge-ok" : "badge-bad"}>Q{q.sortOrder}</span>
          <p style={{ margin: "8px 0" }}>{q.stem}</p>
          <p style={{ fontSize: 12 }}>Your answer: {q.options[q.selectedOptionIndex ?? 0]}</p>
          {!q.isCorrect && (
            <p style={{ fontSize: 12, color: "#0f7b4d" }}>Correct: {q.options[q.correctOptionIndex]}</p>
          )}
        </div>
      ))}
      <Link to="/assessment/history" className="btn btn-primary" style={{ display: "inline-block", marginTop: 16 }}>
        View test history
      </Link>
    </div>
  );
}
