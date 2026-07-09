import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({ name, className, size = 32 }: { name: string; className?: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-strong",
        className
      )}
    >
      {initials(name) || "?"}
    </div>
  );
}
