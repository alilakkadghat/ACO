import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertSimulationPreset, type SimulationPreset } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// GET /api/presets
export function usePresets() {
  return useQuery({
    queryKey: [api.presets.list.path],
    queryFn: async () => {
      const res = await fetch(api.presets.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch presets");
      return api.presets.list.responses[200].parse(await res.json());
    },
  });
}

// POST /api/presets
export function useCreatePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSimulationPreset) => {
      const validated = api.presets.create.input.parse(data);
      const res = await fetch(api.presets.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.presets.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create preset");
      }
      return api.presets.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.presets.list.path] });
      toast({
        title: "Preset Saved",
        description: "Your simulation configuration has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// DELETE /api/presets/:id
export function useDeletePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.presets.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (res.status === 404) throw new Error("Preset not found");
      if (!res.ok) throw new Error("Failed to delete preset");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.presets.list.path] });
      toast({
        title: "Preset Deleted",
        description: "Configuration removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
