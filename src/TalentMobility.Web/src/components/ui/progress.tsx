import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

export function Progress({ className, value = 0, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root className={cn("relative h-2 overflow-hidden rounded-full bg-muted", className)} {...props}>
      <ProgressPrimitive.Indicator
        className="h-full bg-primary transition-transform"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
