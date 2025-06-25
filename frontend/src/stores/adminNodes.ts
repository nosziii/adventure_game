// src/stores/adminNodes.ts
import { defineStore } from "pinia";
import apiClient from "../services/api"; // Axios kliens
import type {
  AdminNodeData,
  AdminCreateNodePayload,
  AdminUpdateNodePayload,
} from "../types/admin.types";

// Állapot interfész
interface AdminNodesState {
  nodes: AdminNodeData[];
  loading: boolean;
  error: string | null;
  currentNode: AdminNodeData | null;
  loadingCurrent: boolean;
}

export const useAdminNodesStore = defineStore("adminNodes", {
  state: (): AdminNodesState => ({
    nodes: [],
    loading: false,
    error: null,
    currentNode: null,
    loadingCurrent: false,
  }),

  getters: {
    allNodes: (state): AdminNodeData[] => state.nodes,
    isLoading: (state): boolean => state.loading,
    isLoadingCurrent: (state): boolean => state.loadingCurrent, // <-- ÚJ getter
    getCurrentNode: (state): AdminNodeData | null => state.currentNode,
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

    async fetchNode(id: number): Promise<boolean> {
      // Visszaadja, hogy sikeres volt-e
      this.loadingCurrent = true;
      this.error = null;
      this.currentNode = null; // Töröljük az előzőt
      console.log(`Workspaceing node ID: ${id} for admin edit...`);
      try {
        const response = await apiClient.get<AdminNodeData>(
          `/admin/nodes/${id}`
        );
        this.currentNode = response.data;
        console.log("Node fetched successfully:", this.currentNode);
        return true;
      } catch (err: any) {
        console.error(`Failed to fetch admin node ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült lekérni a(z) ${id} ID-jú csomópontot.`;
        return false;
      } finally {
        this.loadingCurrent = false;
      }
    },

    // --- ÚJ AKCIÓ: Node Frissítése ---
    async updateNode(
      id: number,
      payload: AdminUpdateNodePayload
    ): Promise<AdminNodeData | null> {
      this.loading = true; // Használhatjuk a fő loading flaget
      this.error = null;
      console.log(`Updating node ID: ${id} with payload:`, payload);
      try {
        // Hívjuk a backend PATCH /api/admin/nodes/:id végpontját
        const response = await apiClient.patch<AdminNodeData>(
          `/admin/nodes/${id}`,
          payload
        );
        // Sikeres frissítés után frissítjük a listában is (opcionális, de jó)
        const index = this.nodes.findIndex((node) => node.id === id);
        if (index !== -1) {
          this.nodes[index] = response.data;
        }
        // A currentNode-t is frissíthetjük, ha épp azt szerkesztettük
        if (this.currentNode?.id === id) {
          this.currentNode = response.data;
        }
        console.log("Node updated successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error(`Failed to update admin node ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült frissíteni a(z) ${id} ID-jú csomópontot.`;
        return null;
      } finally {
        this.loading = false;
      }
    },
    async deleteNode(id: number): Promise<boolean> {
      this.loading = true; // Használhatjuk a fő loading flaget, vagy egy külön deleteLoading
      this.error = null;
      console.log(`Attempting to delete node ID: ${id}`);
      try {
        // Hívjuk a backend DELETE /api/admin/nodes/:id végpontját
        await apiClient.delete(`/admin/nodes/${id}`);
        // Sikeres törlés esetén eltávolítjuk a node-ot a helyi state-ből
        this.nodes = this.nodes.filter((node) => node.id !== id);
        console.log(`Node ${id} deleted successfully from state.`);
        return true;
      } catch (err: any) {
        console.error(`Failed to delete admin node ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült törölni a(z) ${id} ID-jú csomópontot.`;
        // Ha a backend pl. 409 Conflict-ot küld (mert choice hivatkozik rá), az itt az err.response.data.message-ben lesz.
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
