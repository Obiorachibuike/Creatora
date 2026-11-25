import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-(--brand-primary) text-[#120d0a] hover:bg-(--brand-hover) active:brightness-110",
        outline:
          "border-(--border) text-(--foreground) bg-(--surface-elevated) hover:bg-(--surface-muted) hover:border-(--brand-primary)",
        ghost:
          "text-(--foreground-muted) hover:text-(--brand-primary) hover:bg-(--surface-muted)",
        destructive:
          "bg-(--error) text-(--surface) hover:opacity-90",
      },
      size: {
        sm: "h-8 rounded px-3 text-xs",
        default: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export interface ButtonProps extends ButtonBaseProps {
  asChild?: boolean;
  href?: string;
}

export function Button({
  variant,
  size,
  asChild = false,
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild && href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

