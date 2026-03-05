import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertSimulationPresetSchema } from "@shared/schema";

async function seedPresets() {
  const existing = await storage.getPresets();
  if (existing.length === 0) {
    const defaults = [
      {
        name: "Standard Defense",
        description: "Balanced parameters suitable for general threat detection.",
        alpha: 1.0,
        beta: 2.5,
        rho: 0.05,
        antCount: 50,
        simulationSpeed: 1.0,
        malwareSpreadRate: 0.02,
        antivirusAggressiveness: 0.5,
      },
      {
        name: "High Volatility (Fast Decay)",
        description: "Pheromones evaporate quickly. Good for rapidly changing threat landscapes.",
        alpha: 1.0,
        beta: 4.0,
        rho: 0.3,
        antCount: 80,
        simulationSpeed: 1.5,
        malwareSpreadRate: 0.05,
        antivirusAggressiveness: 0.8,
      },
      {
        name: "Swarm Memory (High Pheromone)",
        description: "Strong pheromone memory. Good for static or slow-moving threats.",
        alpha: 4.0,
        beta: 1.0,
        rho: 0.01,
        antCount: 100,
        simulationSpeed: 1.0,
        malwareSpreadRate: 0.03,
        antivirusAggressiveness: 0.3,
      },
    ];

    for (const preset of defaults) {
      await storage.createPreset(preset);
    }
    console.log("Seeded default simulation presets");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed data on startup
  seedPresets();

  app.get(api.presets.list.path, async (_req, res) => {
    const presets = await storage.getPresets();
    res.json(presets);
  });

  app.post(api.presets.create.path, async (req, res) => {
    try {
      const input = api.presets.create.input.parse(req.body);
      const preset = await storage.createPreset(input);
      res.status(201).json(preset);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.delete(api.presets.delete.path, async (req, res) => {
    await storage.deletePreset(Number(req.params.id));
    res.status(204).send();
  });

  return httpServer;
}
