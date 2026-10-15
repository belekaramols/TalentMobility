import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const variants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary",
      secondary: "bg-secondary text-secondary-foreground",
      success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      destructive: "bg-destructive/10 text-destructive",
      outline: "border border-border bg-card text-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof variants>) {
  return <span className={cn(variants({ variant }), className)} {...props} />;
}
