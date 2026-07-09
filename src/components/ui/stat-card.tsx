import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    neutral: "bg-accent-soft text-accent-strong",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-text-2">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-text-0">{value}</p>
          {trend && <p className="mt-1 text-[12px] text-text-3">{trend}</p>}
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneClasses)}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2} />
        </div>
      </div>
    </Card>
  );
}
