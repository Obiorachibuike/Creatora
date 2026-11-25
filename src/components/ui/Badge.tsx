import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "orange"
  | "green"
  | "red"
  | "blue"
  | "muted"
  | "neutral";

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const classes: Record<BadgeVariant, string> = {
    orange: "bg-(--brand-primary)/15 text-(--brand-primary)",
    green: "bg-(--success)/15 text-(--success)",
    red: "bg-(--error)/15 text-(--error)",
    blue: "bg-(--info)/15 text-(--info)",
    muted: "bg-(--surface-muted) text-(--foreground-muted)",
    neutral: "bg-(--surface-muted) text-(--foreground-muted)",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium",
        classes[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
