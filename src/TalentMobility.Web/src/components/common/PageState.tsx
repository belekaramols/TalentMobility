import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { messages } from "../../config/messages";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

export function PageLoading({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-5" aria-label="Loading">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-full max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => <Skeleton key={index} className="h-36" />)}
      </div>
    </div>
  );
}

export function ErrorState({
  title = messages.errors.genericTitle,
  description = messages.errors.genericDescription,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 p-8 text-center">
      <span className="mb-4 rounded-full bg-destructive/10 p-3 text-destructive"><AlertTriangle className="size-6" /></span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {onRetry && <Button className="mt-5" variant="outline" onClick={onRetry}><RefreshCw className="size-4" />{messages.errors.tryAgain}</Button>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
      <span className="mb-4 rounded-full bg-muted p-3 text-muted-foreground"><Inbox className="size-6" /></span>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
