import { useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, CurrentUser } from "../api/client";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => Promise<CurrentUser> }) {
  const [email, setEmail] = useState(import.meta.env.DEV ? "amol.belekar@tothenew.com" : "");
  const [password, setPassword] = useState(import.meta.env.DEV ? "ChangeMe@Dev" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.login(email, password);
      const me = await onLoggedIn();
      const isManager = me.roles.some((r) => r === "Manager" || r === "Administrator");
      navigate(isManager ? "/manager/dashboard" : "/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-sidebar px-12 py-10 text-white lg:flex lg:flex-col">
        <div className="absolute -right-24 top-24 size-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-36 -left-20 size-96 rounded-full border border-white/10" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white text-sm font-black text-primary">TTN</div>
          <div>
            <p className="text-sm font-bold tracking-wide">TO THE NEW</p>
            <p className="text-xs text-sidebar-muted">Talent Mobility & Growth</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-sidebar-foreground">
            <Sparkles className="size-3.5" />
            Grow your career from within
          </span>
          <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Build skills. Discover opportunities. Grow together.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-sidebar-muted">
            A single workspace for skill assessments, talent visibility, internal mobility, and personalized growth.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {[
              [ShieldCheck, "Verified skills"],
              [UsersRound, "Visible talent"],
              [Sparkles, "Career growth"],
            ].map(([Icon, label]) => {
              const FeatureIcon = Icon as typeof ShieldCheck;
              return (
                <div key={label as string} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <FeatureIcon className="mb-3 size-5 text-white" />
                  <p className="text-sm font-medium">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>
        <p className="relative z-10 text-xs text-sidebar-muted">Secure internal access for TO THE NEW employees.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-xs font-black text-primary-foreground">TTN</div>
            <div>
              <p className="text-sm font-bold">TO THE NEW</p>
              <p className="text-xs text-muted-foreground">Talent Mobility & Growth</p>
            </div>
          </div>

          <Card className="border-border/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl tracking-tight">Welcome back</CardTitle>
              <CardDescription>Sign in with your organization account to continue.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">Work email</label>
                  <input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="username"
                    placeholder="name@tothenew.com"
                    required
                    disabled={submitting}
                    className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">Password</label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
                    <input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      disabled={submitting}
                      className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-11 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button className="w-full" size="lg" type="submit" disabled={submitting}>
                  {submitting ? "Signing in…" : "Sign in"}
                  {!submitting && <ArrowRight className="size-4" />}
                </Button>
              </form>
              {import.meta.env.DEV && (
                <p className="mt-5 text-center text-xs text-muted-foreground">
                  Development accounts are prefilled for local testing.
                </p>
              )}
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to follow your organization&apos;s security policies.
          </p>
        </div>
      </section>
    </main>
  );
}
