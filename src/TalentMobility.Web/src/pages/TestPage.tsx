import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function TestPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const attempt = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => api.getAttempt(attemptId!),
    enabled: !!attemptId,
  });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  if (!attempt.data) return <p>Loading…</p>;
  const q = attempt.data.questions[index];
  const total = attempt.data.questions.length;

  async function submitAll() {
    const payload = attempt.data!.questions.map((question) => ({
      questionId: question.id,
      selectedOptionIndex: answers[question.id] ?? 0,
    }));
    const result = await api.submitAttempt(attemptId!, payload);
    navigate(`/assessment/results/${result.id}`, { state: { result } });
  }

  return (
    <div>
      <h2 className="page-title">Question {index + 1} of {total}</h2>
      <p className="lead">{attempt.data.competencyLabel} · {attempt.data.technologyLabel} · {attempt.data.skillLevel}</p>
      <p style={{ fontWeight: 500, marginBottom: 16 }}>{q.stem}</p>
      {q.options.map((opt, i) => (
        <div
          key={i}
          className={`option ${answers[q.id] === i ? "selected" : ""}`}
          onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
        >
          {opt}
        </div>
      ))}
      <div className="wizard-footer">
        <button className="btn btn-secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>Previous</button>
        {index < total - 1 ? (
          <button className="btn btn-primary" onClick={() => setIndex((i) => i + 1)}>Next</button>
        ) : (
          <button className="btn btn-primary" onClick={submitAll}>Submit</button>
        )}
      </div>
    </div>
  );
}
