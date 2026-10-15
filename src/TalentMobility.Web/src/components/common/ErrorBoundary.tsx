import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../ui/button";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-destructive">Application error</p>
          <h1 className="mt-2 text-2xl font-bold">This page could not be displayed</h1>
          <p className="mt-3 text-sm text-muted-foreground">Reload the application to start a fresh session.</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>Reload application</Button>
        </div>
      </main>
    );
  }
}
