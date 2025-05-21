// src/stores/story.ts
import { defineStore } from "pinia";
import apiClient from "../services/api";
import type { PlayerStoryListItem } from "../types/game.types"; // Vagy ahova a típust tetted

interface StoryState {
  availableStories: PlayerStoryListItem[];
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
    stories: (state): PlayerStoryListItem[] => state.availableStories,
    isLoading: (state): boolean => state.loading,
    getError: (state): string | null => state.error,
  },

  actions: {
    async fetchAvailableStories() {
      this.loading = true;
      this.error = null;
      console.log("Fetching available stories with progress for dashboard...");
      try {
        // Az API hívás most PlayerStoryListItem[] tömböt vár vissza
        const response = await apiClient.get<PlayerStoryListItem[]>(
          "/game/stories"
        ); // A backend ezt adja vissza
        this.availableStories = response.data;
        console.log(
          `Workspaceed ${this.availableStories.length} stories with progress data.`
        );
      } catch (err: any) {
        console.error("Failed to fetch available stories:", err);
        this.error =
          err.response?.data?.message || "Nem sikerült lekérni a sztorikat.";
        this.availableStories = [];
      } finally {
        this.loading = false;
      }
    },
  },
});
