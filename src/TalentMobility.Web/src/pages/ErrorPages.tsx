import { ArrowLeft, Home, LockKeyhole, SearchX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-lg text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SearchX className="size-8" />
        </span>
        <p className="mt-6 text-sm font-semibold text-primary">404 · Page not found</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-muted-foreground">The link may be outdated, or you may not have access to this area.</p>
        <Button asChild className="mt-7"><Link to="/"><Home className="size-4" />Return home</Link></Button>
      </div>
    </main>
  );
}

export function AccessDeniedPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <LockKeyhole className="size-8" />
        </span>
        <p className="mt-6 text-sm font-semibold text-destructive">Access restricted</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">You don&apos;t have permission to view this page</h1>
        <p className="mt-3 text-sm text-muted-foreground">Contact your administrator if you believe this is incorrect.</p>
        <Button className="mt-7" variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="size-4" />Go back</Button>
      </div>
    </div>
  );
}
