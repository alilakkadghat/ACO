import { type Node, type Edge, type Network } from "./networkGenerator";

export interface Ant {
  id: number;
  x: number;
  y: number;
  currentNode: number;
  targetNode: number | null;
  progress: number;
  pathHistory: number[];
  decisionHighlightTimer: number;
}

export interface InfectionWave {
  id: number;
  sourceId: number;
  targetId: number;
  progress: number;
}

export interface SimulationState {
  network: Network;
  ants: Ant[];
  infectionWaves: InfectionWave[];
  stats: {
    infectedNodes: number;
    totalPheromones: number;
    systemHealth: number;
    infectionRate: number;
    agentEfficiency: number;
  };
}

const MAX_PHEROMONE = 100;
const MIN_PHEROMONE = 0.1;

export class ACOSimulation {
  state: SimulationState;
  alpha: number = 1.0;
  beta: number = 2.0;
  rho: number = 0.1;
  simulationSpeed: number = 1.0;
  malwareSpreadRate: number = 0.15;

  private nextWaveId = 0;
  private totalMoves = 0;
  private detections = 0;
  private repairContributors: Map<number, Set<number>> = new Map();
  private repairThreshold = 4;

  private cycleInfectionEvents = 0;
  private cycleThreatsNeutralized = 0;

  private activeWaveTargets: Set<string> = new Set();

  constructor(network: Network, antCount: number) {
    this.state = {
      network,
      ants: this.initializeAnts(antCount, network.nodes),
      infectionWaves: [],
      stats: {
        infectedNodes: 0,
        totalPheromones: 0,
        systemHealth: 100,
        infectionRate: 0,
        agentEfficiency: 0,
      }
    };
  }

  resetCycleAnalytics() {
    this.cycleInfectionEvents = 0;
    this.cycleThreatsNeutralized = 0;
  }

  getCycleAnalytics() {
    const efficiency = this.cycleInfectionEvents > 0
      ? (this.cycleThreatsNeutralized / this.cycleInfectionEvents) * 100
      : 0;
    return {
      totalInfections: this.cycleInfectionEvents,
      threatsNeutralized: this.cycleThreatsNeutralized,
      efficiency
    };
  }

  setPopulation(count: number) {
    const currentCount = this.state.ants.length;
    if (count > currentCount) {
      const newAnts = this.initializeAnts(count - currentCount, this.state.network.nodes);
      this.state.ants.push(...newAnts);
    } else if (count < currentCount) {
      this.state.ants = this.state.ants.slice(0, count);
    }
  }

  initializeAnts(count: number, nodes: Node[]): Ant[] {
    return Array.from({ length: count }, () => {
      const nodeIndex = Math.floor(Math.random() * nodes.length);
      const node = nodes[nodeIndex];
      return {
        id: Math.random(),
        x: node.x,
        y: node.y,
        currentNode: nodeIndex,
        targetNode: null,
        progress: 0,
        pathHistory: [],
        decisionHighlightTimer: 0,
      };
    });
  }

  update(dt: number) {
    const clampedDt = Math.max(0, Math.min(dt, 0.1));
    const adjustedDt = clampedDt * this.simulationSpeed;

    if (!Number.isFinite(adjustedDt) || adjustedDt <= 0) return;

    this.evaporatePheromones(adjustedDt);
    this.moveAnts(adjustedDt);
    this.processInfectionWaves(adjustedDt);
    this.spreadMalware(adjustedDt);
    this.applyAntivirus(adjustedDt);
    this.updateStats();
  }

  private clampPheromone(value: number): number {
    if (!Number.isFinite(value)) return MIN_PHEROMONE;
    return Math.max(MIN_PHEROMONE, Math.min(MAX_PHEROMONE, value));
  }

  private evaporatePheromones(dt: number) {
    const evaporation = Math.exp(-this.rho * dt);
    let total = 0;

    this.state.network.edges.forEach(edge => {
      edge.pheromone = this.clampPheromone(edge.pheromone * evaporation);
      total += edge.pheromone;
    });

    this.state.stats.totalPheromones = total;
  }

  private moveAnts(dt: number) {
    const baseSpeed = 160;

    this.state.ants.forEach(ant => {
      if (ant.decisionHighlightTimer > 0) {
        ant.decisionHighlightTimer = Math.max(0, ant.decisionHighlightTimer - dt);
      }

      if (ant.targetNode === null) {
        const nextNode = this.chooseNextNode(ant);
        if (nextNode !== null) {
          ant.targetNode = nextNode;
          ant.progress = 0;
          ant.decisionHighlightTimer = 0.5;
          this.totalMoves++;
        }
      } else {
        const source = this.state.network.nodes[ant.currentNode];
        const target = this.state.network.nodes[ant.targetNode];

        if (!source || !target) {
          ant.targetNode = null;
          return;
        }

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1) {
          ant.currentNode = ant.targetNode;
          ant.targetNode = null;
          ant.progress = 0;
          return;
        }

        ant.progress += (baseSpeed * dt) / dist;

        const clampedProgress = Math.min(1, ant.progress);
        ant.x = source.x + dx * clampedProgress;
        ant.y = source.y + dy * clampedProgress;

        if (ant.progress >= 1) {
          const edgeIndex = this.findEdgeIndex(ant.currentNode, ant.targetNode);
          if (edgeIndex !== -1) {
            const targetNode = this.state.network.nodes[ant.targetNode];

            targetNode.visitCount = (targetNode.visitCount || 0) + 1;
            if (targetNode.visitCount >= 40 && (targetNode.type === 'infected' || targetNode.type === 'suspicious')) {
              targetNode.type = 'normal';
              targetNode.health = 100;
              targetNode.visitCount = 0;
              this.cycleThreatsNeutralized++;
            }

            if (targetNode.type !== 'normal') {
              this.detections++;
            }

            const deposit =
              targetNode.type === 'infected' ? 8 :
                targetNode.type === 'suspicious' ? 4 :
                  0.15;

            this.state.network.edges[edgeIndex].pheromone = this.clampPheromone(
              this.state.network.edges[edgeIndex].pheromone + deposit
            );
          }

          ant.pathHistory.push(ant.currentNode);
          if (ant.pathHistory.length > 8) ant.pathHistory.shift();
          ant.currentNode = ant.targetNode;
          ant.targetNode = null;
          ant.progress = 0;
          ant.x = target.x;
          ant.y = target.y;
        }
      }
    });
  }

  private chooseNextNode(ant: Ant): number | null {
    const node = this.state.network.nodes[ant.currentNode];
    if (!node) return null;

    const neighbors = node.connections;
    if (neighbors.length === 0) return null;

    let totalScore = 0;

    const scored = neighbors.map(neighborId => {
      const edge = this.findEdge(ant.currentNode, neighborId);
      if (!edge) return { neighborId, score: 0 };

      const neighbor = this.state.network.nodes[neighborId];
      if (!neighbor) return { neighborId, score: 0 };

      const anomaly =
        neighbor.type === "infected" ? 10 :
          neighbor.type === "suspicious" ? 4 :
            0.5;

      const pheromoneInfluence = Math.pow(edge.pheromone + 0.1, this.alpha);
      const heuristicInfluence = Math.pow(anomaly + 0.1, this.beta);

      let score = pheromoneInfluence * heuristicInfluence;

      if (!Number.isFinite(score)) score = 0;

      if (ant.pathHistory.includes(neighborId)) {
        score *= 0.1;
      }

      totalScore += score;
      return { neighborId, score };
    });

    if (totalScore === 0 || !Number.isFinite(totalScore)) {
      const randomChoice = neighbors[Math.floor(Math.random() * neighbors.length)];
      ant.decisionHighlightTimer = 0.4;
      return randomChoice;
    }

    let r = Math.random() * totalScore;
    for (const s of scored) {
      r -= s.score;
      if (r <= 0) {
        ant.decisionHighlightTimer = 0.4;
        return s.neighborId;
      }
    }

    ant.decisionHighlightTimer = 0.4;
    return scored[0].neighborId;
  }

  private spreadMalware(dt: number) {
    if (this.state.network.nodes.every(n => n.type === 'normal')) {
      if (Math.random() < 0.8 * dt) {
        const idx = Math.floor(Math.random() * this.state.network.nodes.length);
        this.state.network.nodes[idx].type = 'infected';
        this.state.network.nodes[idx].health = 0;
        this.state.network.nodes[idx].visitCount = 0;
        this.cycleInfectionEvents++;
      }
    }

    this.state.network.nodes.forEach(node => {
      if (node.type === 'infected') {
        const emitChance = this.malwareSpreadRate * dt * 20;
        if (Math.random() < emitChance) {
          node.connections.forEach(neighborId => {
            const targetNode = this.state.network.nodes[neighborId];
            if (targetNode && targetNode.type !== 'infected') {
              const waveKey = `${node.id}-${neighborId}`;
              if (!this.activeWaveTargets.has(waveKey)) {
                this.activeWaveTargets.add(waveKey);
                this.state.infectionWaves.push({
                  id: this.nextWaveId++,
                  sourceId: node.id,
                  targetId: neighborId,
                  progress: 0
                });
              }
            }
          });
        }
      }
    });
  }

  private processInfectionWaves(dt: number) {
    const waveSpeed = 300;

    this.state.infectionWaves = this.state.infectionWaves.filter(wave => {
      const source = this.state.network.nodes[wave.sourceId];
      const target = this.state.network.nodes[wave.targetId];

      if (!source || !target) {
        this.activeWaveTargets.delete(`${wave.sourceId}-${wave.targetId}`);
        return false;
      }

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) {
        this.activeWaveTargets.delete(`${wave.sourceId}-${wave.targetId}`);
        return false;
      }

      wave.progress += (waveSpeed * dt) / dist;

      if (wave.progress >= 1) {
        const targetNode = this.state.network.nodes[wave.targetId];

        if (targetNode.type === 'normal') {
          targetNode.type = 'suspicious';
          targetNode.health = 60;
          targetNode.visitCount = 0;
          this.cycleInfectionEvents++;
        } else if (targetNode.type === 'suspicious') {
          targetNode.type = 'infected';
          targetNode.health = 0;
          targetNode.visitCount = 0;
          this.cycleInfectionEvents++;
        }

        targetNode.connections.forEach(neighborId => {
          const edge = this.findEdge(targetNode.id, neighborId);
          if (edge) {
            edge.pheromone = this.clampPheromone(
              edge.pheromone + (targetNode.type === 'infected' ? 6 : 3)
            );
          }
        });

        this.activeWaveTargets.delete(`${wave.sourceId}-${wave.targetId}`);
        return false;
      }

      return true;
    });
  }

  private applyAntivirus(dt: number) {
    this.state.network.nodes.forEach(node => {
      const pheromoneLoad = node.connections.reduce((sum, neighborId) => {
        const edge = this.findEdge(node.id, neighborId);
        return sum + (edge?.pheromone || 0);
      }, 0);

      if (pheromoneLoad > 15 && (node.type === 'infected' || node.type === 'suspicious')) {
        const repairRate = (pheromoneLoad * 2.0) * dt;
        node.health = Math.min(100, node.health + repairRate);
        if (node.health > 95) {
          this.cycleThreatsNeutralized++;
          node.type = 'normal';
        }
        else if (node.health > 0) node.type = 'suspicious';
      }
    });
  }

  private findEdge(a: number, b: number): Edge | undefined {
    return this.state.network.edges.find(e =>
      (e.source === a && e.target === b) || (e.source === b && e.target === a)
    );
  }

  private findEdgeIndex(a: number, b: number): number {
    return this.state.network.edges.findIndex(e =>
      (e.source === a && e.target === b) || (e.source === b && e.target === a)
    );
  }

  private updateStats() {
    const totalNodes = this.state.network.nodes.length;
    const infected = this.state.network.nodes.filter(n => n.type === 'infected').length;
    const suspicious = this.state.network.nodes.filter(n => n.type === 'suspicious').length;

    this.state.stats.infectedNodes = infected + suspicious;
    this.state.stats.systemHealth = Math.round((1 - infected / totalNodes) * 100);
    this.state.stats.infectionRate = Math.round(((infected + suspicious) / totalNodes) * 100);

    const efficiency = this.totalMoves > 0 ? (this.detections / this.totalMoves) * 100 : 0;
    this.state.stats.agentEfficiency = Math.round(efficiency);
  }
}
