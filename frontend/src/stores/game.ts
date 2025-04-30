import { defineStore } from 'pinia'
import apiClient from '../services/api'
import type { GameStateResponse, Choice, StoryNodeData, CharacterStats, EnemyData, InventoryItem } from '../types/game.types'

interface GameState {
    currentNode: StoryNodeData | null
    currentChoices: Choice[]
    characterStats: CharacterStats | null
    loading: boolean
    error: string | null
    combatState: EnemyData | null 
    combatLogMessages: string[]
    inventory: InventoryItem[]
  }
  
  export const useGameStore = defineStore('game', {
    state: (): GameState => ({
      currentNode: null,
      currentChoices: [],
      characterStats: null,
      loading: false,
      error: null,
      combatState: null,
      combatLogMessages: [],
      inventory: []
    }),
  
    getters: {
      getNodeText: (state): string => state.currentNode?.text ?? '',
      getNodeImage: (state): string | null => state.currentNode?.image ?? null,
      getCharacterStats: (state): CharacterStats | null => state.characterStats,
      getChoices: (state): Choice[] => state.currentChoices, // Típus itt is frissül
      isLoading: (state): boolean => state.loading,
      getError: (state): string | null => state.error,
      getCombatLog: (state): string[] => state.combatLogMessages, // Getter a harci üzenetekhez
      isInCombat: (state): boolean => !!state.combatState, // Getter a harc állapot ellenőrzésére
      getCombatState: (state): EnemyData | null => state.combatState, // Getter a harc adatokhoz
      getInventory: (state): InventoryItem[] => state.inventory, // Getter az inventoryhoz
    },
  
    actions: {

_updateStateFromResponse(data: GameStateResponse) {
        this.currentNode = data.node
        this.currentChoices = data.choices
        this.characterStats = data.character
        this.combatState = data.combat
        this.inventory = data.inventory ?? []
        // Ha vannak üzenetek a válaszban, felülírjuk a logot, különben töröljük  **skipped**
        // this.combatLogMessages = data.messages ?? [] // todo nem tudom melyiket használjam még
        // Hozzáadjuk az új üzeneteket a meglévőkhöz?
        if (data.messages) {
           this.combatLogMessages.push(...data.messages)
           // Opcionálisan limitálhatjuk a log hosszát
           if (this.combatLogMessages.length > 20) {
               this.combatLogMessages.splice(0, this.combatLogMessages.length - 20)
           }
        } else if (!this.combatState) { // Ha nincs harc, töröljük a logot
            this.combatLogMessages = []
        }
    },

      async fetchGameState() {
        this.loading = true
        this.error = null
        console.log('Fetching game state...')
        try {
          // Az API hívás most a frontend GameStateResponse típusát várja
          const response = await apiClient.get<GameStateResponse>('/game/state')
          this._updateStateFromResponse(response.data)
        } catch (err: any) {
          console.error('Failed to fetch game state:', err)
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
          this._updateStateFromResponse(response.data)
        } catch (err: any) {
          console.error('Failed to make choice:', err)
          this.error = err.response?.data?.message || 'Nem sikerült feldolgozni a választást.'
          // Lehet, hogy itt nem kell logout, hacsak nem 401 hiba jön
        } finally {
          this.loading = false // Betöltés vége
        }
      },

      // Harci akciók kezelése
      async attackEnemy() {
        // Csak akkor támadunk, ha tényleg harcban vagyunk
        if (!this.combatState) {
          console.error('Attack action called but not in combat!')
          return;
        }
  
        this.loading = true;
        this.error = null;
        console.log('Executing attack action...')
        try {
          // Hívjuk a backend combat/action végpontját
          // A bodyban megadjuk, hogy 'attack' az akció
          const response = await apiClient.post<GameStateResponse>(
            '/game/combat/action',
            { action: 'attack' }
          );
          // Frissítjük az állapotot a válasz alapján
          this._updateStateFromResponse(response.data)
  
          console.log('Combat action processed, new state received:', response.data)
  
        } catch (err: any) {
          console.error('Failed to execute combat action:', err)
          this.error = err.response?.data?.message || 'A harci művelet sikertelen volt.'
          // Itt is lehetne logout 401 esetén, de az interceptor valószínűleg már kezelte
        } finally {
          this.loading = false
        }
      },
  
       // TODO: Később jöhet a useItemInCombat akció is
      // async useItemInCombat(itemId: number) {
      //   this.loading = true
      //   this.error = null
      //   console.log(`Using item ID: ${itemId} in combat`)
      //   try {
      //     const response = await apiClient.post<GameStateDto>(
      //       '/game/combat/action',
      //       { action: 'useItem', itemId: itemId } // A CombatActionDto-nak megfelelően
      //     )
      //     this.currentNode = response.data.node
      //     this.currentChoices = response.data.choices
      //     this.characterStats = response.data.character
      //     this.combatState = response.data.combat // Frissítjük az ellenfél HP-ját, vagy null lesz, ha a harc véget ért
      //     console.log('Item used in combat, new state received:', response.data)
      //   } catch (err: any) {
      //     console.error('Failed to use item in combat:', err)
      //     this.error = err.response?.data?.message || 'A tárgy használata a harcban sikertelen volt.'
      //   } finally {
      //     this.loading = false
      //   }
      // },

    },
  })