// src/stores/adminItems.ts
import { defineStore } from "pinia";
import apiClient from "../services/api";
import type {
  AdminItemData,
  AdminCreateItemPayload,
  AdminUpdateItemPayload,
} from "../types/admin.types"; // Ellenőrizd az útvonalat

interface AdminItemsState {
  items: AdminItemData[];
  currentItem: AdminItemData | null;
  loading: boolean;
  loadingCurrent: boolean;
  error: string | null;
}

export const useAdminItemsStore = defineStore("adminItems", {
  state: (): AdminItemsState => ({
    items: [],
    currentItem: null,
    loading: false,
    loadingCurrent: false,
    error: null,
  }),

  getters: {
    allItems: (state): AdminItemData[] => state.items,
    isLoading: (state): boolean => state.loading,
    isLoadingCurrent: (state): boolean => state.loadingCurrent,
    getCurrentItem: (state): AdminItemData | null => state.currentItem,
    getError: (state): string | null => state.error,
  },

  actions: {
    async fetchItems() {
      this.loading = true;
      this.error = null;
      console.log("Fetching all items for admin...");
      try {
        const response = await apiClient.get<AdminItemData[]>("/admin/items");
        this.items = response.data;
        console.log(`Workspaceed ${this.items.length} items.`);
      } catch (err: any) {
        console.error("Failed to fetch admin items:", err);
        this.error =
          err.response?.data?.message || "Nem sikerült lekérni a tárgyakat.";
      } finally {
        this.loading = false;
      }
    },

    async fetchItem(id: number): Promise<boolean> {
      this.loadingCurrent = true;
      this.error = null;
      this.currentItem = null;
      console.log(`Workspaceing item ID: ${id} for admin edit...`);
      try {
        const response = await apiClient.get<AdminItemData>(
          `/admin/items/${id}`
        );
        this.currentItem = response.data;
        console.log("Item fetched successfully:", this.currentItem);
        return true;
      } catch (err: any) {
        console.error(`Failed to fetch admin item ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült lekérni a(z) ${id} ID-jú tárgyat.`;
        return false;
      } finally {
        this.loadingCurrent = false;
      }
    },

    // --- ÚJ AKCIÓ: Item Létrehozása ---
    async createItem(
      payload: AdminCreateItemPayload
    ): Promise<AdminItemData | null> {
      this.loading = true;
      this.error = null;
      console.log("Creating new item for admin with payload:", payload);
      try {
        const response = await apiClient.post<AdminItemData>(
          "/admin/items",
          payload
        );
        this.items.push(response.data);
        console.log("Item created successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error("Failed to create admin item:", err);
        this.error =
          err.response?.data?.message || "Nem sikerült létrehozni a tárgyat.";
        return null;
      } finally {
        this.loading = false;
      }
    },

    // --- ÚJ AKCIÓ: Item Frissítése ---
    async updateItem(
      id: number,
      payload: AdminUpdateItemPayload
    ): Promise<AdminItemData | null> {
      this.loading = true;
      this.error = null;
      console.log(`Updating item ID: ${id} with payload:`, payload);
      try {
        const response = await apiClient.patch<AdminItemData>(
          `/admin/items/${id}`,
          payload
        );
        const index = this.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          this.items[index] = response.data;
        }
        if (this.currentItem?.id === id) {
          this.currentItem = response.data;
        }
        console.log("Item updated successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error(`Failed to update admin item ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült frissíteni a(z) ${id} ID-jú tárgyat.`;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async deleteItem(id: number): Promise<boolean> {
      this.loading = true; // Használhatjuk a fő loading flaget
      this.error = null;
      console.log(`Attempting to delete item ID: ${id}`);
      try {
        // Hívjuk a backend DELETE /api/admin/items/:id végpontját
        await apiClient.delete(`/admin/items/${id}`);

        // Sikeres törlés esetén eltávolítjuk az itemet a helyi state-ből
        this.items = this.items.filter((item) => item.id !== id);
        console.log(`Item ${id} deleted successfully from state.`);
        return true; // Jelezzük a sikert
      } catch (err: any) {
        console.error(`Failed to delete admin item ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült törölni a(z) ${id} ID-jú tárgyat.`;
        // A backend ConflictException-t dobhat (409), ha a tárgy használatban van
        return false; // Jelezzük a hibát
      } finally {
        this.loading = false;
      }
    },
  },
});
