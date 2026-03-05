import { Network } from "lucide-react";

export function Header() {
  return (
    <header className="h-20 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-black border border-primary/40 flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.2)]">
          <Network className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-[26px] font-bold font-display tracking-tight leading-none text-foreground">
            ACO<span className="text-primary">Net</span> Analyzer
          </h1>
          <p className="text-[13px] text-muted-foreground font-mono tracking-wide mt-0.5">
            Ant‑Colony‑Optimisation based network threat simulation
          </p>
        </div>
      </div>

    </header>
  );
}

