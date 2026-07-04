import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "danger" | "warning" | "success";
  subtitle?: string;
}

const variantStyles = {
  default: { bg: "bg-primary-50",   icon: "bg-primary-600 text-white",   value: "text-primary-700" },
  danger:  { bg: "bg-red-50",       icon: "bg-red-500 text-white",       value: "text-red-700"     },
  warning: { bg: "bg-amber-50",     icon: "bg-amber-500 text-white",     value: "text-amber-700"   },
  success: { bg: "bg-green-50",     icon: "bg-green-600 text-white",     value: "text-green-700"   },
};

export function KpiCard({ label, value, icon: Icon, variant = "default", subtitle }: KpiCardProps) {
  const s = variantStyles[variant];
  return (
    <div className={clsx("card p-5 flex items-center gap-4", s.bg)}>
      <div className={clsx("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", s.icon)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
        <p className={clsx("text-2xl font-bold mt-0.5", s.value)}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
