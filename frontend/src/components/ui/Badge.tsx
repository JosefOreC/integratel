import { clsx } from "clsx";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger:  "badge-danger",
  info:    "badge-info",
  default: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={clsx(variantClass[variant], className)}>
      {children}
    </span>
  );
}
