import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface ParameterSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  description?: string;
}

export function ParameterSlider({ label, value, onChange, min, max, step, description }: ParameterSliderProps) {
  return (
    <div className="space-y-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-primary/20 group">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-mono text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">
          {label}
        </Label>
        <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
          {value.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        min={min}
        max={max}
        step={step}
        className="[&_.relative]:h-1.5 [&_span]:bg-primary"
      />
      {description && (
        <p className="text-[10px] text-muted-foreground/60 leading-tight">
          {description}
        </p>
      )}
    </div>
  );
}
