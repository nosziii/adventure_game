// src/stores/adminChoices.ts
import { defineStore } from "pinia";
import apiClient from "../services/api";
import type {
  AdminChoiceData,
  AdminCreateChoicePayload,
  AdminUpdateChoicePayload,
} from "../types/admin.types";

interface AdminChoicesState {
  choices: AdminChoiceData[];
  currentChoice: AdminChoiceData | null;
  loading: boolean;
  loadingCurrent: boolean;
  error: string | null;
}

export const useAdminChoicesStore = defineStore("adminChoices", {
  state: (): AdminChoicesState => ({
    choices: [],
    currentChoice: null,
    loading: false,
    loadingCurrent: false,
    error: null,
  }),

  getters: {
    allChoices: (state): AdminChoiceData[] => state.choices,
    isLoading: (state): boolean => state.loading,
    isLoadingCurrent: (state): boolean => state.loadingCurrent,
    getCurrentChoice: (state): AdminChoiceData | null => state.currentChoice,
    getError: (state): string | null => state.error,
  },

  actions: {
    // Összes choice lekérése, opcionálisan sourceNodeId alapján
    async fetchChoices(sourceNodeId?: number) {
      this.loading = true;
      this.error = null;
      let url = "/admin/choices";
      if (sourceNodeId) {
        url += `?sourceNodeId=${sourceNodeId}`;
      }
      console.log(`Workspaceing choices for admin from: ${url}`);
      try {
        const response = await apiClient.get<AdminChoiceData[]>(url);
        this.choices = response.data;
        console.log(`Workspaceed ${this.choices.length} choices.`);
      } catch (err: any) {
        console.error("Failed to fetch admin choices:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült lekérni a választásokat.";
      } finally {
        this.loading = false;
      }
    },

    async fetchChoice(id: number): Promise<boolean> {
      this.loadingCurrent = true;
      this.error = null;
      this.currentChoice = null; // Előző törlése
      console.log(`Workspaceing single choice ID: ${id} for admin edit...`);
      try {
        const response = await apiClient.get<AdminChoiceData>(
          `/admin/choices/${id}`
        );
        this.currentChoice = response.data;
        console.log("Single choice fetched successfully:", this.currentChoice);
        return true; // Sikeres lekérdezés
      } catch (err: any) {
        console.error(`Failed to fetch admin choice ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült lekérni a(z) ${id} ID-jú választást.`;
        return false; // Sikertelen lekérdezés
      } finally {
        this.loadingCurrent = false;
      }
    },

    async createChoice(
      payload: AdminCreateChoicePayload
    ): Promise<AdminChoiceData | null> {
      this.loading = true; // Általános loading flaget használunk a CUD műveletekre
      this.error = null;
      console.log("Creating new choice for admin with payload:", payload);
      try {
        const response = await apiClient.post<AdminChoiceData>(
          "/admin/choices",
          payload
        );
        // Opcionálisan hozzáadhatjuk a listához, vagy a lista nézet majd újra lekéri
        this.choices.push(response.data); // Optimista hozzáadás a listához
        console.log("Choice created successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error("Failed to create admin choice:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült létrehozni a választást.";
        return null;
      } finally {
        this.loading = false;
      }
    },

    // --- ÚJ: Choice Frissítése ---
    async updateChoice(
      id: number,
      payload: AdminUpdateChoicePayload
    ): Promise<AdminChoiceData | null> {
      this.loading = true;
      this.error = null;
      console.log(`Updating choice ID: ${id} with payload:`, payload);
      try {
        const response = await apiClient.patch<AdminChoiceData>(
          `/admin/choices/${id}`,
          payload
        );
        // Frissítjük a listában és a currentChoice-ban is
        const index = this.choices.findIndex((choice) => choice.id === id);
        if (index !== -1) {
          this.choices[index] = response.data;
        }
        if (this.currentChoice?.id === id) {
          this.currentChoice = response.data;
        }
        console.log("Choice updated successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error(`Failed to update admin choice ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült frissíteni a(z) ${id} ID-jú választást.`;
        return null;
      } finally {
        this.loading = false;
      }
    },
    // async deleteChoice(id: number) { ... }
  },
});
