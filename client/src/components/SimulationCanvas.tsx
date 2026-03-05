import { useEffect, useRef } from "react";
import { type SimulationState } from "@/lib/acoLogic";

interface SimulationCanvasProps {
  simulationState: SimulationState;
  showPheromones: boolean;
  showAnts: boolean;
  width: number;
  height: number;
}

export function SimulationCanvas({
  simulationState,
  showPheromones,
  showAnts,
  width,
  height
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    const { network, ants, infectionWaves } = simulationState;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    network.edges.forEach(edge => {
      const source = network.nodes[edge.source];
      const target = network.nodes[edge.target];

      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      if (showPheromones) {
        const normalizedPheromone = Math.min(1, edge.pheromone / 50);
        const smoothIntensity = Math.pow(normalizedPheromone, 0.7);
        const widthVal = 2 + smoothIntensity * 20;

        // Calculate threat intensity based on connected nodes
        const threatLevel = (source.type !== 'normal' ? 1 : 0) + (target.type !== 'normal' ? 1 : 0);

        let r, g, b;
        if (threatLevel === 2) {
          // High threat (Red)
          r = 239; g = 68; b = 68;
        } else if (threatLevel === 1) {
          // Medium threat (Orange)
          r = 245; g = 158; b = 11;
        } else {
          // Low threat (Cyan)
          r = 6; g = 182; b = 212;
        }

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.15 + smoothIntensity * 0.6})`;
        ctx.lineWidth = widthVal;
        ctx.stroke();

        if (smoothIntensity > 0.4) {
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${smoothIntensity * 0.15})`;
          ctx.lineWidth = widthVal + 8;
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    ctx.shadowBlur = 0;

    infectionWaves.forEach(wave => {
      const source = network.nodes[wave.sourceId];
      const target = network.nodes[wave.targetId];

      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) return;

      const segmentLen = 15;
      const fadeLen = 8;
      const startP = Math.max(0, wave.progress - segmentLen / dist);
      const endP = Math.min(1, wave.progress);
      const fadeStartP = Math.max(0, startP - fadeLen / dist);

      const gradient = ctx.createLinearGradient(
        source.x + dx * fadeStartP,
        source.y + dy * fadeStartP,
        source.x + dx * endP,
        source.y + dy * endP
      );
      gradient.addColorStop(0, "rgba(239, 68, 68, 0)");
      gradient.addColorStop(0.3, "rgba(239, 68, 68, 0.6)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.9)");

      ctx.beginPath();
      ctx.moveTo(
        source.x + dx * fadeStartP,
        source.y + dy * fadeStartP
      );
      ctx.lineTo(
        source.x + dx * endP,
        source.y + dy * endP
      );
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(239, 68, 68, 0.5)";
      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    network.nodes.forEach(node => {
      if (!node) return;

      if (node.type === 'infected') {
        const time = Date.now() / 500;
        const pulsePhase = time % 1;
        const radius = 12 + pulsePhase * 30;
        const alpha = (1 - pulsePhase) * 0.4;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = node.type === 'infected' ? "#ef4444" : (node.type === 'suspicious' ? "#f59e0b" : "#10b981");
      ctx.fill();

      if (node.health < 100) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 15, -Math.PI / 2, (Math.PI * 2 * (node.health / 100)) - Math.PI / 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `F-${node.id.toString(16)}`,
        node.x,
        node.y + 26
      );
    });

    if (showAnts) {
      ants.forEach(ant => {
        if (!Number.isFinite(ant.x) || !Number.isFinite(ant.y)) return;

        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(ant.x, ant.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (ant.decisionHighlightTimer > 0) {
          const progress = 1 - ant.decisionHighlightTimer;
          const radius = 8 * progress;
          const alpha = ant.decisionHighlightTimer * 1.5;
          ctx.beginPath();
          ctx.arc(ant.x, ant.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, alpha)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    }

  }, [simulationState, showPheromones, showAnts, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full block bg-black"
    />
  );
}
