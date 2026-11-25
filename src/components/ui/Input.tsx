import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-lg border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--foreground) outline-none transition-colors placeholder:text-(--foreground-muted)",
        "focus:border-(--brand-primary) focus:bg-(--surface)",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
