import { defineStore } from "pinia";
import apiClient from "../services/api";
import type {
  AdminEnemyData,
  AdminCreateEnemyPayload,
  AdminUpdateEnemyPayload,
} from "../types/admin.types"; // Ellenőrizd az útvonalat

interface AdminEnemiesState {
  enemies: AdminEnemyData[];
  currentEnemy: AdminEnemyData | null;
  loading: boolean;
  loadingCurrent: boolean;
  error: string | null;
}

export const useAdminEnemiesStore = defineStore("adminEnemies", {
  state: (): AdminEnemiesState => ({
    enemies: [],
    currentEnemy: null,
    loading: false,
    loadingCurrent: false,
    error: null,
  }),

  getters: {
    allEnemies: (state): AdminEnemyData[] => state.enemies,
    isLoading: (state): boolean => state.loading,
    isLoadingCurrent: (state): boolean => state.loadingCurrent,
    getCurrentEnemy: (state): AdminEnemyData | null => state.currentEnemy,
    getError: (state): string | null => state.error,
  },

  actions: {
    async fetchEnemies() {
      this.loading = true;
      this.error = null;
      console.log("Fetching all enemies for admin...");
      try {
        const response = await apiClient.get<AdminEnemyData[]>(
          "/admin/enemies"
        );
        this.enemies = response.data;
        console.log(`Workspaceed ${this.enemies.length} enemies.`);
      } catch (err: any) {
        console.error("Failed to fetch admin enemies:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült lekérni az ellenségeket.";
      } finally {
        this.loading = false;
      }
    },

    async fetchEnemy(id: number): Promise<boolean> {
      this.loadingCurrent = true;
      this.error = null;
      this.currentEnemy = null;
      console.log(`Workspaceing enemy ID: ${id} for admin edit...`);
      try {
        const response = await apiClient.get<AdminEnemyData>(
          `/admin/enemies/${id}`
        );
        this.currentEnemy = response.data;
        console.log("Enemy fetched successfully:", this.currentEnemy);
        return true;
      } catch (err: any) {
        console.error(`Failed to fetch admin enemy ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült lekérni a(z) ${id} ID-jú ellenséget.`;
        return false;
      } finally {
        this.loadingCurrent = false;
      }
    },

    async createEnemy(
      payload: AdminCreateEnemyPayload
    ): Promise<AdminEnemyData | null> {
      this.loading = true;
      this.error = null;
      console.log("Creating new enemy for admin with payload:", payload);
      try {
        const response = await apiClient.post<AdminEnemyData>(
          "/admin/enemies",
          payload
        );
        this.enemies.push(response.data); // Optimista hozzáadás a listához
        console.log("Enemy created successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error("Failed to create admin enemy:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült létrehozni az ellenséget.";
        return null;
      } finally {
        this.loading = false;
      }
    },

    // --- ÚJ AKCIÓ: Enemy Frissítése ---
    async updateEnemy(
      id: number,
      payload: AdminUpdateEnemyPayload
    ): Promise<AdminEnemyData | null> {
      this.loading = true; // Használhatjuk a fő loading flaget, vagy a loadingCurrent-et
      this.error = null;
      console.log(`Updating enemy ID: ${id} with payload:`, payload);
      try {
        const response = await apiClient.patch<AdminEnemyData>(
          `/admin/enemies/${id}`,
          payload
        );
        // Frissítjük a listában és a currentEnemy-ben is
        const index = this.enemies.findIndex((enemy) => enemy.id === id);
        if (index !== -1) {
          this.enemies[index] = response.data;
        }
        if (this.currentEnemy?.id === id) {
          this.currentEnemy = response.data;
        }
        console.log("Enemy updated successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error(`Failed to update admin enemy ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült frissíteni a(z) ${id} ID-jú ellenséget.`;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async deleteEnemy(id: number): Promise<boolean> {
      this.loading = true; // Használhatjuk a fő loading flaget
      this.error = null;
      console.log(`Attempting to delete enemy ID: ${id}`);
      try {
        // Hívjuk a backend DELETE /api/admin/enemies/:id végpontját
        await apiClient.delete(`/admin/enemies/${id}`);

        // Sikeres törlés esetén eltávolítjuk az enemyt a helyi state-ből
        this.enemies = this.enemies.filter((enemy) => enemy.id !== id);
        console.log(`Enemy ${id} deleted successfully from state.`);
        return true; // Jelezzük a sikert
      } catch (err: any) {
        console.error(`Failed to delete admin enemy ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült törölni a(z) ${id} ID-jú ellenséget.`;
        // A backend ConflictException-t dobhat (409), ha az enemy használatban van
        return false; // Jelezzük a hibát
      } finally {
        this.loading = false;
      }
    },
  },
});
