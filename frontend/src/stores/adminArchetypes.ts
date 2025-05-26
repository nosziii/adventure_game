// src/stores/adminArchetypes.ts
import { defineStore } from "pinia";
import apiClient from "../services/api";
import type {
  AdminArchetypeData,
  AdminCreateArchetypePayload,
  AdminUpdateArchetypePayload,
} from "../types/admin.types";

interface AdminArchetypesState {
  archetypes: AdminArchetypeData[];
  currentArchetype: AdminArchetypeData | null;
  loading: boolean;
  loadingCurrent: boolean;
  error: string | null;
}

export const useAdminArchetypesStore = defineStore("adminArchetypes", {
  state: (): AdminArchetypesState => ({
    archetypes: [],
    currentArchetype: null,
    loading: false,
    loadingCurrent: false,
    error: null,
  }),

  getters: {
    allArchetypes: (state): AdminArchetypeData[] => state.archetypes,
    isLoading: (state): boolean => state.loading,
    isLoadingCurrent: (state): boolean => state.loadingCurrent,
    getCurrentArchetype: (state): AdminArchetypeData | null =>
      state.currentArchetype,
    getError: (state): string | null => state.error,
  },

  actions: {
    async fetchArchetypes() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get<AdminArchetypeData[]>(
          "/admin/archetypes"
        );
        this.archetypes = response.data;
      } catch (err: any) {
        this.error =
          err.response?.data?.message ||
          "Nem sikerült lekérni a karakter archetípusokat.";
      } finally {
        this.loading = false;
      }
    },

    async fetchArchetype(id: number): Promise<boolean> {
      this.loadingCurrent = true;
      this.error = null;
      this.currentArchetype = null;
      try {
        const response = await apiClient.get<AdminArchetypeData>(
          `/admin/archetypes/${id}`
        );
        this.currentArchetype = response.data;
        return true;
      } catch (err: any) {
        this.error =
          err.response?.data?.message ||
          `Nem sikerült lekérni a(z) ${id} ID-jú archetípust.`;
        return false;
      } finally {
        this.loadingCurrent = false;
      }
    },

    // ---Archetype Létrehozása ---
    async createArchetype(
      payload: AdminCreateArchetypePayload
    ): Promise<AdminArchetypeData | null> {
      this.loading = true;
      this.error = null;
      console.log("Creating new archetype for admin with payload:", payload);
      try {
        const response = await apiClient.post<AdminArchetypeData>(
          "/admin/archetypes",
          payload
        );
        this.archetypes.push(response.data);
        console.log("Archetype created successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error("Failed to create admin archetype:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült létrehozni az archetípust.";
        return null;
      } finally {
        this.loading = false;
      }
    },

    // ---Archetype Frissítése ---
    async updateArchetype(
      id: number,
      payload: AdminUpdateArchetypePayload
    ): Promise<AdminArchetypeData | null> {
      this.loading = true;
      this.error = null;
      console.log(`Updating archetype ID: ${id} with payload:`, payload);
      try {
        // A payload.startingAbilityIds már number[] vagy null/undefined
        const response = await apiClient.patch<AdminArchetypeData>(
          `/admin/archetypes/${id}`,
          payload
        );
        const index = this.archetypes.findIndex((arch) => arch.id === id);
        if (index !== -1) {
          this.archetypes[index] = response.data;
        }
        if (this.currentArchetype?.id === id) {
          this.currentArchetype = response.data;
        }
        console.log("Archetype updated successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error(`Failed to update admin archetype ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült frissíteni a(z) ${id} ID-jú archetípust.`;
        return null;
      } finally {
        this.loading = false;
      }
    },

    // --- ÚJ AKCIÓ: Archetype Törlése ---
    async deleteArchetype(id: number): Promise<boolean> {
      this.loading = true; // Használhatjuk a fő loading flaget
      this.error = null;
      console.log(`Attempting to delete archetype ID: ${id}`);
      try {
        // Hívjuk a backend DELETE /api/admin/archetypes/:id végpontját
        await apiClient.delete(`/admin/archetypes/${id}`);

        // Sikeres törlés esetén eltávolítjuk az archetípust a helyi state-ből
        this.archetypes = this.archetypes.filter(
          (archetype) => archetype.id !== id
        );
        console.log(`Archetype ${id} deleted successfully from state.`);
        return true; // Jelezzük a sikert
      } catch (err: any) {
        console.error(`Failed to delete admin archetype ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült törölni a(z) ${id} ID-jú archetípust.`;
        // Figyelem: Ha a jövőben pl. a 'characters' tábla hivatkozna az archetypes.id-ra egy
        // ON DELETE RESTRICT külső kulccsal, akkor a backend itt ConflictException-t (409) dobhatna.
        return false; // Jelezzük a hibát
      } finally {
        this.loading = false;
      }
    },
  },
});
