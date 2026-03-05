import { useState, useEffect, useRef, useCallback } from "react";
import { generateNetwork } from "@/lib/networkGenerator";
import { ACOSimulation, type SimulationState } from "@/lib/acoLogic";
import { SimulationCanvas } from "@/components/SimulationCanvas";
import { ParameterSlider } from "@/components/ParameterSlider";
import { MetricCard } from "@/components/MetricCard";
import { Header } from "@/components/Header";
import { ScrollAnimation } from "@/components/ui/ScrollAnimation";
import { Chatbot } from "@/components/Chatbot";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, RefreshCw, Activity, Monitor } from "lucide-react";

type ViewMode = "simulation" | "analytics";

interface CycleAnalytics {
  totalInfections: number;
  threatsNeutralized: number;
  efficiency: number;
}

export default function Dashboard() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPheromones, setShowPheromones] = useState(true);
  const [showAnts, setShowAnts] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>("simulation");

  const [antCount, setAntCount] = useState(50);
  const [alpha, setAlpha] = useState(1.0);
  const [beta, setBeta] = useState(2.0);
  const [rho, setRho] = useState(0.1);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [malwareRate, setMalwareRate] = useState(0.20);

  const simRef = useRef<ACOSimulation | null>(null);
  const frameRef = useRef<number>(0);
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [cycleAnalytics, setCycleAnalytics] = useState<CycleAnalytics | null>(null);
  const wasPlayingRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 500 });

  const initSimulation = useCallback(() => {
    if (!containerRef.current) return;

    const w = containerRef.current.clientWidth;
    const h = 500;

    setDims({ w, h });
    setCycleAnalytics(null);
  }, []);

  useEffect(() => {
    initSimulation();
    const handleResize = () => initSimulation();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initSimulation]);

  useEffect(() => {
    if (dims.w === 0 || dims.h === 0) return;

    let cancelled = false;

    const setup = async () => {
      const network = await generateNetwork(18, dims.w, dims.h);
      if (cancelled) return;

      const sim = new ACOSimulation(network, antCount);

      sim.alpha = alpha;
      sim.beta = beta;
      sim.rho = rho;
      sim.simulationSpeed = simSpeed;
      sim.malwareSpreadRate = malwareRate;

      simRef.current = sim;
      setSimState({ ...sim.state });
    };

    setup();

    return () => {
      cancelled = true;
    };
  }, [dims]);

  useEffect(() => {
    if (simRef.current) {
      simRef.current.alpha = alpha;
      simRef.current.beta = beta;
      simRef.current.rho = rho;
      simRef.current.simulationSpeed = simSpeed;
      simRef.current.malwareSpreadRate = malwareRate;
      simRef.current.setPopulation(antCount);
    }
  }, [alpha, beta, rho, simSpeed, malwareRate, antCount]);

  useEffect(() => {
    if (wasPlayingRef.current && !isPlaying && simRef.current) {
      const analytics = simRef.current.getCycleAnalytics();
      setCycleAnalytics(analytics);
    }
    wasPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying && simRef.current) {
        simRef.current.update(Math.min(dt, 0.1));
        setSimState({ ...simRef.current.state });
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying]);



  const handleStartStop = () => {
    if (!isPlaying && simRef.current) {
      simRef.current.resetCycleAnalytics();
      setCycleAnalytics(null);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden font-sans">
      <Header />

      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex items-end px-4 gap-2 border-b border-border bg-background/60 pt-2 shrink-0 z-10">
          <button
            onClick={() => setCurrentView("simulation")}
            className={`
              relative px-5 py-2 rounded-t-xl text-xs font-bold font-mono tracking-[0.25em] transition-all
              flex items-center gap-2
              ${currentView === "simulation"
                ? "bg-primary/10 text-primary border border-primary/40 shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent"}
            `}
          >
            <Monitor className="w-4 h-4" />
            SIMULATION
          </button>

          <button
            onClick={() => setCurrentView("analytics")}
            className={`
              relative px-5 py-2 rounded-t-xl text-xs font-bold font-mono tracking-[0.25em] transition-all
              flex items-center gap-2
              ${currentView === "analytics"
                ? "bg-secondary/10 text-secondary border border-secondary/40 shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent"}
            `}
          >
            <Activity className="w-4 h-4" />
            ANALYTICS
          </button>

        </div>

        {/* View Content Area */}
        <div className="flex-1 overflow-hidden relative">

          {currentView === "simulation" && (
            <div className="absolute inset-0 flex overflow-hidden">
              <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden bg-slate-950/60">
                <ScrollAnimation>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                    <MetricCard
                      label="Active infections"
                      value={simState?.stats.infectedNodes ?? 0}
                      unit="NODES"
                      color="destructive"
                    />
                    <MetricCard
                      label="Infection coverage"
                      value={simState?.stats.infectionRate ?? 0}
                      unit="%"
                      color={(simState?.stats.infectionRate ?? 0) > 30 ? "destructive" : "warning"}
                    />
                    <MetricCard
                      label="Detection efficiency"
                      value={simState?.stats.agentEfficiency ?? 0}
                      unit="%"
                      color="primary"
                    />
                    <MetricCard
                      label="Total pheromone mass"
                      value={simState ? Math.round(simState.stats.totalPheromones) : 0}
                      unit="Στ"
                      color="secondary"
                    />
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.2}>
                  <div
                    ref={containerRef}
                    className="relative bg-background shrink-0"
                    style={{ height: dims.h }}
                  >
                    {simState && (
                      <SimulationCanvas
                        simulationState={simState}
                        showPheromones={showPheromones}
                        showAnts={showAnts}
                        width={dims.w}
                        height={dims.h}
                      />
                    )}

                    {!isPlaying && !simState && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-30">
                        <div className="text-center p-8 border border-border bg-card/80 rounded-xl max-w-sm">
                          <Activity className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                          <h2 className="text-xl font-display font-bold uppercase tracking-[0.3em] text-foreground mb-2">READY TO RUN</h2>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Configure the parameters on the right, then engage the swarm to observe how the network responds.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.1}>
                  <div className="bg-background border-t border-border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-[13px] font-mono shrink-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                        <span className="text-foreground font-bold">HEALTHY NODE</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]" />
                        <span className="text-foreground font-bold">DEGRADED (SUSPICIOUS)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]" />
                        <span className="text-foreground font-bold">INFECTED NODE</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-8 bg-red-500 shadow-[0_0_8px_red] rounded-full" />
                        <span className="text-foreground font-bold">INFECTION WAVE (MALWARE)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_white]" />
                        <span className="text-foreground font-bold">SECURITY AGENT (ANT)</span>
                      </div>

                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-1 w-8 bg-cyan-500/50" />
                        <span className="text-foreground font-bold">THIN PATH: LOW THREAT</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-8 bg-red-600 shadow-[0_0_10px_red]" />
                        <span className="text-foreground font-bold">THICK PATH: HIGH THREAT CONFIDENCE</span>
                      </div>

                    </div>

                    <div className="border-l border-border pl-6 space-y-2">
                      <h4 className="text-primary font-bold uppercase tracking-[0.25em] text-xs">Network legend</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        <span className="text-primary font-bold">Ants:</span> Decentralized security agents.<br />
                        <span className="text-primary font-bold">Pheromones:</span> Shared threat intelligence.<br />
                        <span className="text-primary font-bold">Path reinforcement:</span> Correlated threat confidence.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.2}>
                  <div className="border-t border-border bg-background/70 shrink-0">
                    <div className="p-4 m-0 text-xs text-muted-foreground font-mono tracking-[0.25em]">
                      SWARM-DRIVEN ANOMALY MAPPING ACTIVE
                    </div>
                  </div>
                </ScrollAnimation>
              </div>

              <aside className="w-80 border-l border-border bg-background/70 flex flex-col shrink-0">
                <div className="p-4 border-b border-border">
                  <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-primary font-bold mb-4">Simulation Controls</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartStop}
                      className={`flex-1 font-bold ${isPlaying ? "bg-amber-500 hover:bg-amber-600 text-slate-950" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}
                      size="sm"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {isPlaying ? "HALT" : "ENGAGE"}
                    </Button>
                    <Button onClick={initSimulation} variant="outline" size="sm" className="border-border hover:bg-muted/50">
                      <RefreshCw className="w-4 h-4 mr-2" /> RESET
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6">
                    <section className="space-y-4">
                      <h3 className="text-[10px] font-mono uppercase text-muted-foreground tracking-[0.25em]">ACO PARAMETERS</h3>
                      <ParameterSlider
                        label="α – Pheromone weight"
                        description="How strongly ants prefer edges with higher pheromone. Higher α = more exploitation of known paths."
                        value={alpha}
                        min={0}
                        max={5}
                        step={0.1}
                        onChange={setAlpha}
                      />
                      <ParameterSlider
                        label="β – Heuristic weight"
                        description="Influence of local anomaly heuristic. Higher β = more focus on nodes that look suspicious right now."
                        value={beta}
                        min={0}
                        max={5}
                        step={0.1}
                        onChange={setBeta}
                      />
                      <ParameterSlider
                        label="ρ – Evaporation rate"
                        description="Speed at which pheromone fades. Higher ρ = network forgets old trails faster and adapts to new threats."
                        value={rho}
                        min={0.01}
                        max={1}
                        step={0.01}
                        onChange={setRho}
                      />
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-[10px] font-mono uppercase text-muted-foreground tracking-[0.25em]">ENVIRONMENT</h3>
                      <ParameterSlider
                        label="Malware emission rate"
                        description="Probability that an infected node spawns a new infection wave towards neighbours."
                        value={malwareRate}
                        min={0}
                        max={0.5}
                        step={0.01}
                        onChange={setMalwareRate}
                      />
                      <ParameterSlider
                        label="Number of agents"
                        description="Total ACO agents patrolling the network graph."
                        value={antCount}
                        min={10}
                        max={300}
                        step={10}
                        onChange={setAntCount}
                      />
                      <ParameterSlider
                        label="Simulation time scale"
                        description="Multiplier applied to the simulation timestep. Higher values = faster progression of the same dynamics."
                        value={simSpeed}
                        min={0.1}
                        max={5}
                        step={0.1}
                        onChange={setSimSpeed}
                      />
                    </section>

                    <section className="space-y-3 pt-2">
                      <h3 className="text-[10px] font-mono uppercase text-muted-foreground tracking-[0.25em]">VISUALISATION LAYERS</h3>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-mono">Pheromone intensity</Label>
                        <Switch checked={showPheromones} onCheckedChange={setShowPheromones} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-mono">Agent markers</Label>
                        <Switch checked={showAnts} onCheckedChange={setShowAnts} />
                      </div>
                    </section>
                  </div>
                </ScrollArea>
              </aside>
            </div>
          )}

          {currentView === "analytics" && (
            <div className="h-full overflow-y-auto bg-background/70">
              <div className="max-w-5xl mx-auto py-8 px-6 space-y-8">
                <ScrollAnimation>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                      label="Infection events (cycle)"
                      value={cycleAnalytics?.totalInfections ?? 0}
                      unit="EVENTS"
                      color="destructive"
                    />
                    <MetricCard
                      label="Net resolved events"
                      value={Math.abs((cycleAnalytics?.threatsNeutralized ?? 0) - (cycleAnalytics?.totalInfections ?? 0))}
                      unit="Δ"
                      color="primary"
                    />
                    <MetricCard
                      label="Cycle containment rate"
                      value={(cycleAnalytics?.efficiency ?? 0).toFixed(1)}
                      unit="%"
                      color="secondary"
                    />
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.15}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-border bg-card/70 rounded-xl p-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
                      <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-1">
                        Run summary
                      </h3>
                      <p>
                        Each run tracks how often the network experiences infection or escalation events, and how often the swarm
                        successfully restores nodes to a healthy state.
                      </p>
                      <p>
                        The <span className="text-primary font-semibold">containment index</span> expresses how many of those events
                        ended positively for the defender during the last cycle.
                      </p>
                    </div>

                    <div className="border border-border bg-card/70 rounded-xl p-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
                      <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-secondary mb-1">
                        Metric formulas
                      </h3>
                      <p className="font-mono text-[11px] leading-relaxed">
                        Threat events = total infection & escalation events this run.
                        <br />
                        Incidents resolved = nodes brought back to a non‑infected state.
                        <br />
                        Containment index = (incidents resolved / threat events) × 100.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.2}>
                  <div className="border border-border bg-card/70 rounded-xl p-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-500 mb-1">
                      Algorithm Efficiency
                    </h3>
                    <p className="font-bold text-lg text-foreground">
                      {cycleAnalytics && cycleAnalytics.totalInfections > 0 ? ((cycleAnalytics.threatsNeutralized / cycleAnalytics.totalInfections) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="font-mono text-[11px] leading-relaxed">
                      Calculated as: (threats neutralised / total threat events) * 100
                    </p>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          )}

        </div>
      </div>
      <Chatbot />
    </div >
  );
}
