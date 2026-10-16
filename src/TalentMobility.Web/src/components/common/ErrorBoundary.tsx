import { Component, type ErrorInfo, type ReactNode } from "react";
import { messages } from "../../config/messages";
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
          <p className="text-sm font-semibold text-destructive">{messages.boundary.label}</p>
          <h1 className="mt-2 text-2xl font-bold">{messages.boundary.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{messages.boundary.description}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>{messages.boundary.reload}</Button>
        </div>
      </main>
    );
  }
}
