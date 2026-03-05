import { simulation_presets, type SimulationPreset, type InsertSimulationPreset } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPresets(): Promise<SimulationPreset[]>;
  createPreset(preset: InsertSimulationPreset): Promise<SimulationPreset>;
  deletePreset(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPresets(): Promise<SimulationPreset[]> {
    return await db.select().from(simulation_presets);
  }

  async createPreset(insertPreset: InsertSimulationPreset): Promise<SimulationPreset> {
    const [preset] = await db
      .insert(simulation_presets)
      .values(insertPreset)
      .returning();
    return preset;
  }

  async deletePreset(id: number): Promise<void> {
    await db.delete(simulation_presets).where(eq(simulation_presets.id, id));
  }
}

export const storage = new DatabaseStorage();
