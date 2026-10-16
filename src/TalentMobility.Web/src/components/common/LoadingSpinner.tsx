import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export function LoadingSpinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Loader2
      className={cn("size-8 animate-spin text-primary", className)}
      aria-hidden={label ? undefined : true}
      role={label ? "status" : undefined}
      aria-label={label}
    />
  );
}

export function LoadingOverlay({
  open,
  title,
  description,
}: {
  open: boolean;
  title: string;
  description?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/75 p-4 backdrop-blur-sm"
      aria-busy="true"
      aria-live="polite"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="loading-overlay-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <LoadingSpinner className="size-11" label={title} />
          <div className="space-y-2">
            <p id="loading-overlay-title" className="text-base font-semibold text-foreground">
              {title}
            </p>
            {description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
