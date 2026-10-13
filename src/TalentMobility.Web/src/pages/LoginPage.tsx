import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState("amol.belekar@tothenew.com");
  const [password, setPassword] = useState("ChangeMe@Dev");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.login(email, password);
      onLoggedIn();
      const me = await api.me();
      const isManager = me.roles.some((r) => r === "Manager" || r === "Administrator");
      navigate(isManager ? "/manager/dashboard" : "/dashboard");
    } catch {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <div>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Talent Mobility &amp; Growth</h2>
          <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
            Skills assessments, talent visibility, and career mobility for TO THE NEW.
          </p>
        </div>
      </div>
      <div className="login-form">
        <form className="login-card" onSubmit={submit}>
          <h1>Sign in</h1>
          <p>Use seeded @tothenew.com accounts (dev password in README).</p>
          <div className="field">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error && <p style={{ color: "#b42318", fontSize: 13 }}>{error}</p>}
          <button className="btn btn-primary" type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}
