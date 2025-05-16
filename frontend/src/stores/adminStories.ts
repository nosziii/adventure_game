// src/stores/adminStories.ts
import { defineStore } from "pinia";
import apiClient from "../services/api";
import type {
  AdminStoryData,
  AdminCreateStoryPayload,
  AdminUpdateStoryPayload,
} from "../types/admin.types"; // Ellenőrizd az útvonalat

interface AdminStoriesState {
  stories: AdminStoryData[];
  currentStory: AdminStoryData | null;
  loading: boolean;
  loadingCurrent: boolean;
  error: string | null;
}

export const useAdminStoriesStore = defineStore("adminStories", {
  state: (): AdminStoriesState => ({
    stories: [],
    currentStory: null,
    loading: false,
    loadingCurrent: false,
    error: null,
  }),

  getters: {
    allStories: (state): AdminStoryData[] => state.stories,
    isLoading: (state): boolean => state.loading,
    isLoadingCurrent: (state): boolean => state.loadingCurrent,
    getCurrentStory: (state): AdminStoryData | null => state.currentStory,
    getError: (state): string | null => state.error,
  },

  actions: {
    async fetchStories() {
      this.loading = true;
      this.error = null;
      console.log("Fetching all stories for admin...");
      try {
        const response = await apiClient.get<AdminStoryData[]>(
          "/admin/stories"
        );
        this.stories = response.data;
        console.log(`Workspaceed ${this.stories.length} stories.`);
      } catch (err: any) {
        console.error("Failed to fetch admin stories:", err);
        this.error =
          err.response?.data?.message || "Nem sikerült lekérni a sztorikat.";
      } finally {
        this.loading = false;
      }
    },

    async fetchStory(id: number): Promise<boolean> {
      this.loadingCurrent = true;
      this.error = null;
      this.currentStory = null;
      console.log(`Workspaceing story ID: ${id} for admin edit...`);
      try {
        const response = await apiClient.get<AdminStoryData>(
          `/admin/stories/${id}`
        );
        this.currentStory = response.data;
        console.log("Story fetched successfully:", this.currentStory);
        return true;
      } catch (err: any) {
        console.error(`Failed to fetch admin story ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült lekérni a(z) ${id} ID-jú sztorit.`;
        return false;
      } finally {
        this.loadingCurrent = false;
      }
    },
    // ---Story Létrehozása ---
    async createStory(
      payload: AdminCreateStoryPayload
    ): Promise<AdminStoryData | null> {
      this.loading = true;
      this.error = null;
      console.log("Creating new story for admin with payload:", payload);
      try {
        const response = await apiClient.post<AdminStoryData>(
          "/admin/stories",
          payload
        );
        this.stories.push(response.data); // Optimista hozzáadás a listához
        console.log("Story created successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error("Failed to create admin story:", err);
        this.error =
          err.response?.data?.message || "Nem sikerült létrehozni a sztorit.";
        return null;
      } finally {
        this.loading = false;
      }
    },

    // --- Story Frissítése ---
    async updateStory(
      id: number,
      payload: AdminUpdateStoryPayload
    ): Promise<AdminStoryData | null> {
      this.loading = true;
      this.error = null;
      console.log(`Updating story ID: ${id} with payload:`, payload);
      try {
        const response = await apiClient.patch<AdminStoryData>(
          `/admin/stories/${id}`,
          payload
        );
        const index = this.stories.findIndex((story) => story.id === id);
        if (index !== -1) {
          this.stories[index] = response.data;
        }
        if (this.currentStory?.id === id) {
          this.currentStory = response.data;
        }
        console.log("Story updated successfully:", response.data);
        return response.data;
      } catch (err: any) {
        console.error(`Failed to update admin story ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült frissíteni a(z) ${id} ID-jú sztorit.`;
        return null;
      } finally {
        this.loading = false;
      }
    },
    // --- Story Törlése ---
    async deleteStory(id: number): Promise<boolean> {
      this.loading = true; // Használhatjuk a fő loading flaget
      this.error = null;
      console.log(`Attempting to delete story ID: ${id}`);
      try {
        // Hívjuk a backend DELETE /api/admin/stories/:id végpontját
        await apiClient.delete(`/admin/stories/${id}`);

        // Sikeres törlés esetén eltávolítjuk a sztorit a helyi state-ből
        this.stories = this.stories.filter((story) => story.id !== id);
        console.log(`Story ${id} deleted successfully from state.`);
        return true; // Jelezzük a sikert
      } catch (err: any) {
        console.error(`Failed to delete admin story ${id}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült törölni a(z) ${id} ID-jú sztorit.`;
        // A backend ConflictException-t dobhatna, ha lenne rá FK hivatkozás, de a stories táblára jelenleg nincs ilyen.
        return false; // Jelezzük a hibát
      } finally {
        this.loading = false;
      }
    },
  },
});
