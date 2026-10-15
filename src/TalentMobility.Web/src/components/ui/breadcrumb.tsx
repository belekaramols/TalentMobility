import { ChevronRight, MoreHorizontal } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";

export function Breadcrumb(props: React.ComponentProps<"nav">) {
  return <nav aria-label="Breadcrumb" {...props} />;
}

export function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol className={cn("flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground", className)} {...props} />;
}

export function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}

export function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "a";
  return <Component className={cn("transition-colors hover:text-foreground", className)} {...props} />;
}

export function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span aria-current="page" className={cn("font-medium text-foreground", className)} {...props} />;
}

export function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  return (
    <li aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
      {children ?? <ChevronRight />}
    </li>
  );
}

export function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden="true" className={cn("flex size-9 items-center justify-center", className)} {...props}>
      <MoreHorizontal className="size-4" />
    </span>
  );
}
