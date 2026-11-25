import { cn } from "@/lib/utils";

export function Label({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1 block text-sm font-medium text-(--foreground-muted)", className)} {...props}>
      {children}
    </label>
  );
}
