import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function NewTestWizard() {
  const [step, setStep] = useState(1);
  const [competencyId, setCompetencyId] = useState("");
  const [technologyId, setTechnologyId] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [params] = useSearchParams();
  const assignmentId = params.get("assignmentId") ?? undefined;
  const navigate = useNavigate();

  const competencies = useQuery({ queryKey: ["competencies"], queryFn: api.competencies });
  const levels = useQuery({ queryKey: ["levels"], queryFn: api.skillLevels });

  const comp = competencies.data?.find((c) => c.id === competencyId);

  async function start() {
    const attempt = await api.startAttempt({
      competencyId,
      technologyId,
      skillLevel,
      assignmentId,
    });
    navigate(`/assessment/test/${attempt.id}`);
  }

  return (
    <div>
      <h2 className="page-title">New test</h2>
      <div className="stepper">Step {step} — {step === 1 ? "Competency" : step === 2 ? "Technology" : "Skill level"}</div>

      {step === 1 && (
        <div className="grid-3">
          {competencies.data?.map((c) => (
            <div
              key={c.id}
              className={`card ${competencyId === c.id ? "selected" : ""}`}
              onClick={() => setCompetencyId(c.id)}
            >
              <strong>{c.label}</strong>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid-3">
          {comp?.technologies.map((t) => (
            <div
              key={t.id}
              className={`card ${technologyId === t.id ? "selected" : ""}`}
              onClick={() => setTechnologyId(t.id)}
            >
              <strong>{t.label}</strong>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="grid-3">
          {levels.data?.map((l) => (
            <div
              key={l.id}
              className={`card ${skillLevel === l.id ? "selected" : ""}`}
              onClick={() => setSkillLevel(l.id)}
            >
              <strong>{l.label}</strong>
              <p style={{ fontSize: 12, color: "var(--text-2)" }}>{l.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="wizard-footer">
        <button className="btn btn-secondary" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</button>
        {step < 3 ? (
          <button
            className="btn btn-primary"
            disabled={(step === 1 && !competencyId) || (step === 2 && !technologyId)}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        ) : (
          <button className="btn btn-primary" disabled={!skillLevel} onClick={start}>Begin test</button>
        )}
      </div>
    </div>
  );
}
