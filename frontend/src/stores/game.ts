import { defineStore } from 'pinia'
import apiClient from '../services/api'
import type { GameStateResponse, Choice, StoryNodeData, CharacterStats } from '../types/game.types'

interface GameState {
    currentNode: StoryNodeData | null
    currentChoices: Choice[]
    characterStats: CharacterStats | null
    loading: boolean
    error: string | null
  }
  
  export const useGameStore = defineStore('game', {
    state: (): GameState => ({
      currentNode: null,
      currentChoices: [],
      characterStats: null,
      loading: false,
      error: null,
    }),
  
    getters: {
      getNodeText: (state): string => state.currentNode?.text ?? '',
      getNodeImage: (state): string | null => state.currentNode?.image ?? null,
      getCharacterStats: (state): CharacterStats | null => state.characterStats,
      getChoices: (state): Choice[] => state.currentChoices, // Típus itt is frissül
      isLoading: (state): boolean => state.loading,
      getError: (state): string | null => state.error,
    },
  
    actions: {
      async fetchGameState() {
        this.loading = true
        this.error = null
        console.log('Fetching game state...')
        try {
          // Az API hívás most a frontend GameStateResponse típusát várja
          const response = await apiClient.get<GameStateResponse>('/game/state')
          this.currentNode = response.data.node
          this.currentChoices = response.data.choices
          this.characterStats = response.data.character
          console.log('Game state fetched:', response.data)
        } catch (err: any) {
          console.error('Failed to fetch game state:', err);
          this.error = err.response?.data?.message || 'Nem sikerült betölteni a játék állapotát.'
        } finally {
          this.loading = false
        }
      },

      async makeChoice(choiceId: number) {
        this.loading = true
        this.error = null
        console.log(`Making choice ID: ${choiceId}`)
        try {
          const response = await apiClient.post<GameStateResponse>(
            '/game/choice',
            { choiceId: choiceId }
          )
  
          //Refresh...
          this.currentNode = response.data.node
          this.currentChoices = response.data.choices
          this.characterStats = response.data.character
          console.log('Choice processed, new game state received:', response.data)
  
        } catch (err: any) {
          console.error('Failed to make choice:', err)
          this.error = err.response?.data?.message || 'Nem sikerült feldolgozni a választást.'
          // Lehet, hogy itt nem kell logout, hacsak nem 401 hiba jön
        } finally {
          this.loading = false // Betöltés vége
        }
      },
    },
  })