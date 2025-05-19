// src/stores/story.ts
import { defineStore } from "pinia";
import apiClient from "../services/api";
import type { StoryInfo } from "../types/game.types"; // Vagy ahova a típust tetted

interface StoryState {
  availableStories: StoryInfo[];
  loading: boolean;
  error: string | null;
}

export const useStoryStore = defineStore("story", {
  state: (): StoryState => ({
    availableStories: [],
    loading: false,
    error: null,
  }),

  getters: {
    stories: (state): StoryInfo[] => state.availableStories,
    isLoading: (state): boolean => state.loading,
    getError: (state): string | null => state.error,
  },

  actions: {
    async fetchAvailableStories() {
      this.loading = true;
      this.error = null;
      console.log("Fetching available stories for dashboard...");
      try {
        // Hívjuk a backend /api/game/stories végpontját
        const response = await apiClient.get<StoryInfo[]>("/game/stories");
        this.availableStories = response.data;
        console.log(`Workspaceed ${this.availableStories.length} stories.`);
      } catch (err: any) {
        console.error("Failed to fetch available stories:", err);
        this.error =
          err.response?.data?.message || "Nem sikerült lekérni a sztorikat.";
        this.availableStories = []; // Hiba esetén üres lista
      } finally {
        this.loading = false;
      }
    },
  },
});
