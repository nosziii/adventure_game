// src/stores/adminMap.ts
import { defineStore } from "pinia";
import apiClient from "../services/api";
import type { AdminNodeData, AdminChoiceData } from "../types/admin.types"; // Ellenőrizd az útvonalat

// Vis.js által várt adatstruktúrák
interface VisNode {
  id: number;
  label: string;
  title?: string; // Tooltip
  group?: string; // Színezéshez, pl. is_end, enemy_id alapján
}

interface VisEdge {
  from: number;
  to: number;
  label?: string; // Choice text
  id?: string; // Egyedi él ID, pl. `c${choice.id}`
  arrows?: string;
  color?: { color: string; highlight: string }; // Színezéshez
}

interface StoryGraphDataFromApi {
  // Amit a backend küld
  nodes: AdminNodeData[];
  choices: AdminChoiceData[];
}

interface AdminMapState {
  visNodes: VisNode[];
  visEdges: VisEdge[];
  loading: boolean;
  error: string | null;
}

export const useAdminMapStore = defineStore("adminMap", {
  state: (): AdminMapState => ({
    visNodes: [],
    visEdges: [],
    loading: false,
    error: null,
  }),

  getters: {
    graphData: (state): { nodes: VisNode[]; edges: VisEdge[] } | null => {
      if (
        state.visNodes.length === 0 &&
        state.visEdges.length === 0 &&
        !state.loading
      ) {
        return null; // Nincs adat, vagy még nem töltődött be
      }
      return { nodes: state.visNodes, edges: state.visEdges };
    },
    isLoading: (state): boolean => state.loading,
    getError: (state): string | null => state.error,
  },

  actions: {
    async fetchStoryGraph() {
      this.loading = true;
      this.error = null;
      console.log("Fetching story graph data for admin map...");
      try {
        const response = await apiClient.get<StoryGraphDataFromApi>(
          "/admin/nodes/graph/data"
        );
        const nodesFromApi = response.data.nodes;
        const choicesFromApi = response.data.choices; // Adatok lekérve

        this.visNodes = nodesFromApi.map((node) => {
          // node-ok feldolgozása
          let group = node.is_end
            ? "endNode"
            : node.enemy_id
            ? "combatNode"
            : "normalNode";
          let issues: string[] = [];
          // ... (árva és zsákutca logika, ami a 'group'-ot és 'issues'-t módosítja) ...
          let nodeTitle = `ID: ${node.id}\nText: ${node.text}\nEnd: ${
            node.is_end
          }\nEnemy: ${node.enemy_id ?? "-"}\nItem: ${
            node.item_reward_id ?? "-"
          }`;
          if (issues.length > 0) {
            nodeTitle += `\nISSUES: ${issues.join(", ")}`;
          }
          return {
            id: node.id,
            label: `Node ${node.id}\n(${node.text.substring(0, 20)}${
              node.text.length > 20 ? "..." : ""
            })`,
            title: nodeTitle,
            group: group,
          };
        });
        this.visEdges = choicesFromApi.map((choice) => ({
          from: choice.sourceNodeId,
          to: choice.targetNodeId,
          label: `${choice.id}: ${choice.text.substring(0, 20)}${
            choice.text.length > 20 ? "..." : ""
          }`, // Láthatóbbá tettem az ID-t a labelben
          id: `c${choice.id}`,
          arrows: "to",
        }));
        // ---------------------------------------------------------------------

        // Ez a log most valószínűleg 0-t ír ki az élekre, ha a fenti blokk hiányzik
        console.log(
          `Processed ${this.visNodes.length} nodes and ${this.visEdges.length} edges for Vis.js.`
        );
      } catch (err: any) {
        console.error("Failed to fetch or process story graph data:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült betölteni a történet gráfját.";
        this.visNodes = [];
        this.visEdges = [];
      } finally {
        this.loading = false;
      }
    },
  },
});
