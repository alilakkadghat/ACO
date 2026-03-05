import { pgTable, text, serial, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const simulation_presets = pgTable("simulation_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // ACO Parameters
  alpha: real("alpha").notNull().default(1.0), // Pheromone influence
  beta: real("beta").notNull().default(2.0),  // Heuristic influence
  rho: real("rho").notNull().default(0.1),    // Evaporation rate
  // Simulation Parameters
  antCount: integer("ant_count").notNull().default(50),
  simulationSpeed: real("simulation_speed").notNull().default(1.0),
  malwareSpreadRate: real("malware_spread_rate").notNull().default(0.05),
  antivirusAggressiveness: real("antivirus_aggressiveness").notNull().default(0.5),
});

export const insertSimulationPresetSchema = createInsertSchema(simulation_presets).omit({ id: true });
export type InsertSimulationPreset = z.infer<typeof insertSimulationPresetSchema>;
export type SimulationPreset = typeof simulation_presets.$inferSelect;
