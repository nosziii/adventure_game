// src/stores/adminAbilities.ts
import { defineStore } from "pinia";
import apiClient from "../services/api";
import { AbilityType } from "../types/admin.types";

import type {
  AdminAbilityData,
  AdminCreateAbilityPayload,
  AdminUpdateAbilityPayload,
} from "../types/admin.types";

interface AdminAbilitiesState {
  abilities: AdminAbilityData[];
  currentAbility: AdminAbilityData | null;
  loading: boolean;
  loadingCurrent: boolean;
  error: string | null;
}

export const useAdminAbilitiesStore = defineStore("adminAbilities", {
  state: (): AdminAbilitiesState => ({
    abilities: [],
    currentAbility: null,
    loading: false,
    loadingCurrent: false,
    error: null,
  }),

  getters: {
    allAbilities: (state): AdminAbilityData[] => state.abilities,
    isLoading: (state): boolean => state.loading,
    isLoadingCurrent: (state): boolean => state.loadingCurrent,
    getCurrentAbility: (state): AdminAbilityData | null => state.currentAbility,
    getError: (state): string | null => state.error,
    // Segéd getter az AbilityType enumhoz a template-ben való használathoz
    getAbilityTypesArray: (): { value: AbilityType; label: string }[] => {
      // Dinamikusabb getter az enumhoz
      return Object.values(AbilityType).map((type) => ({
        value: type,
        label: type
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      }));
    },
  },

  actions: {
    async fetchAbilities() {
      this.loading = true;
      this.error = null;
      console.log("Fetching all abilities for admin...");
      try {
        const response = await apiClient.get<AdminAbilityData[]>(
          "/admin/abilities"
        );
        this.abilities = response.data;
        console.log(`Workspaceed ${this.abilities.length} abilities.`);
      } catch (err: any) {
        console.error("Failed to fetch admin abilities:", err);
        this.error =
          err.response?.data?.message || "Nem sikerült lekérni a képességeket.";
      } finally {
        this.loading = false;
      }
    },

    async fetchAbility(id: number): Promise<boolean> {
      this.loadingCurrent = true;
      this.error = null;
      this.currentAbility = null;
      console.log(`Workspaceing ability ID: ${id} for admin edit...`);
      try {
        const response = await apiClient.get<AdminAbilityData>(
          `/admin/abilities/${id}`
        );
        this.currentAbility = response.data;
        console.log("Ability fetched successfully:", this.currentAbility);
        return true;
      } catch (err: any) {
        console.error(`Failed to fetch admin ability ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült lekérni a(z) ${id} ID-jú képességet.`;
        return false;
      } finally {
        this.loadingCurrent = false;
      }
    },

    // --- Ability Létrehozása ---
    async createAbility(
      payload: AdminCreateAbilityPayload
    ): Promise<AdminAbilityData | null> {
      this.loading = true;
      this.error = null;
      console.log("Creating new ability for admin with payload:", payload);
      try {
        // A prerequisites mezőt stringként küldjük, ha a backend JSONB-ként stringet vár

        const response = await apiClient.post<AdminAbilityData>(
          "/admin/abilities",
          payload
        );
        this.abilities.push(response.data);
        console.log("Ability created successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error("Failed to create admin ability:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült létrehozni a képességet.";
        return null;
      } finally {
        this.loading = false;
      }
    },

    // --- Ability Frissítése ---
    async updateAbility(
      id: number,
      payload: AdminUpdateAbilityPayload
    ): Promise<AdminAbilityData | null> {
      this.loading = true;
      this.error = null;
      console.log(`Updating ability ID: ${id} with payload:`, payload);
      try {
        const payloadToSend = {
          ...payload,
          prerequisites: payload.prerequisites
            ? JSON.stringify(payload.prerequisites)
            : payload.prerequisites === null
            ? null
            : undefined,
        };
        const response = await apiClient.patch<AdminAbilityData>(
          `/admin/abilities/${id}`,
          payloadToSend
        );
        const index = this.abilities.findIndex((ability) => ability.id === id);
        if (index !== -1) {
          this.abilities[index] = response.data;
        }
        if (this.currentAbility?.id === id) {
          this.currentAbility = response.data;
        }
        console.log("Ability updated successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error(`Failed to update admin ability ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült frissíteni a(z) ${id} ID-jú képességet.`;
        return null;
      } finally {
        this.loading = false;
      }
    },
    async deleteAbility(id: number): Promise<boolean> {
      this.loading = true; // Használhatjuk a fő loading flaget
      this.error = null;
      console.log(`Attempting to delete ability ID: ${id}`);
      try {
        // Hívjuk a backend DELETE /api/admin/abilities/:id végpontját
        await apiClient.delete(`/admin/abilities/${id}`);

        // Sikeres törlés esetén eltávolítjuk a képességet a helyi state-ből
        this.abilities = this.abilities.filter((ability) => ability.id !== id);
        console.log(`Ability ${id} deleted successfully from state.`);
        return true; // Jelezzük a sikert
      } catch (err: any) {
        console.error(`Failed to delete admin ability ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült törölni a(z) ${id} ID-jú képességet.`;
        // A backend ConflictException-t dobhatna, ha lenne rá FK hivatkozás RESTRICT-tel,
        // de a character_story_abilities ON DELETE CASCADE-del van, így az ottani rekordok törlődnek.
        return false; // Jelezzük a hibát
      } finally {
        this.loading = false;
      }
    },
  },
});
