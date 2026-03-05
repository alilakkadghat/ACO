import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "secondary" | "destructive" | "warning";
}

export function MetricCard({ label, value, unit, color = "primary" }: MetricCardProps) {
  const colorMap = {
    primary: "text-primary border-primary/30 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]",
    secondary: "text-secondary border-secondary/30 shadow-[0_0_15px_-5px_hsl(var(--secondary)/0.3)]",
    destructive: "text-destructive border-destructive/30 shadow-[0_0_15px_-5px_hsl(var(--destructive)/0.3)]",
    warning: "text-amber-500 border-amber-500/30 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]",
  };

  return (
    <Card className={cn(
      "bg-card/70 backdrop-blur-sm border p-4 flex flex-col justify-between h-24 transition-all hover:-translate-y-0.5 hover:shadow-lg",
      colorMap[color]
    )}>
      <span className="text-[11px] font-mono uppercase tracking-[0.25em] opacity-70">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-display font-bold tabular-nums tracking-tighter">
          {value}
        </span>
        {unit && <span className="text-xs font-mono opacity-50">{unit}</span>}
      </div>
    </Card>
  );
}
