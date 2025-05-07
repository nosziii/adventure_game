// src/stores/adminNodes.ts
import { defineStore } from "pinia";
import apiClient from "../services/api"; // Axios kliens
import type {
  AdminNodeData,
  AdminCreateNodePayload,
  AdminUpdateNodePayload,
} from "../types/admin.types";
import type { StoryNodeData } from "../types/game.types"; // Vagy egy dedikált AdminNode típus

// Állapot interfész
interface AdminNodesState {
  nodes: StoryNodeData[];
  loading: boolean;
  error: string | null;
  // currentNode: AdminNodeData | null
}

export const useAdminNodesStore = defineStore("adminNodes", {
  state: (): AdminNodesState => ({
    nodes: [],
    loading: false,
    error: null,
    // currentNode: null,
  }),

  getters: {
    allNodes: (state): AdminNodeData[] => state.nodes,
    isLoading: (state): boolean => state.loading,
    getError: (state): string | null => state.error,
    // getNodeById: (state) => (id: number) => state.nodes.find(node => node.id === id), // Később
  },

  actions: {
    async fetchNodes() {
      this.loading = true;
      this.error = null;
      console.log("Fetching all nodes for admin...");
      try {
        // Az API hívás most AdminNodeData tömböt vár vissza
        const response = await apiClient.get<AdminNodeData[]>("/admin/nodes"); // `/api/admin/nodes` lesz a teljes
        this.nodes = response.data;
        console.log(`Workspaceed ${this.nodes.length} nodes.`);
      } catch (err: any) {
        console.error("Failed to fetch admin nodes:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült lekérni a csomópontokat.";
      } finally {
        this.loading = false;
      }
    },

    async createNode(
      payload: AdminCreateNodePayload
    ): Promise<AdminNodeData | null> {
      this.loading = true;
      this.error = null;
      console.log("Creating new node for admin with payload:", payload);
      try {
        // Hívjuk a backend POST /api/admin/nodes végpontját
        const response = await apiClient.post<AdminNodeData>(
          "/admin/nodes",
          payload
        );
        // Sikeres létrehozás után frissíthetnénk a this.nodes tömböt,
        // vagy egyszerűen a hívó helyen újratöltetjük a listát.
        // Most csak visszaadjuk az új node-ot.
        console.log("Node created successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error("Failed to create admin node:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült létrehozni a csomópontot.";
        return null; // Hiba esetén null-t adunk vissza
      } finally {
        this.loading = false;
      }
    },

    // --- Ide jönnek majd a create, update, delete akciók ---
    // async fetchNode(id: number) { ... }
    // async createNode(data: CreateNodeDto) { ... }
    // async updateNode(id: number, data: UpdateNodeDto) { ... }
    // async deleteNode(id: number) { ... }
  },
});
