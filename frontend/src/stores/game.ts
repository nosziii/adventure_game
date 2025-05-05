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
  
       async useItemInCombat(itemId: number) {
      if (!this.combatState) {
        console.error('useItemInCombat action called but not in combat!');
        this.error = 'Nem vagy harcban.'; // Adjunk visszajelzést
        return; // Ne csinálj semmit, ha nincs harc
      }
      // Ellenőrizzük, hogy van-e ilyen tárgy (opcionális, a backend is ellenőrzi)
      const item = this.inventory.find(i => i.itemId === itemId);
      if (!item || item.quantity < 1) {
           console.error(`Attempted to use item ${itemId} but not available in inventory.`);
           this.error = 'Nincs ilyen tárgyad, vagy elfogyott.';
           return;
      }
       if (!item.usable) {
           console.error(`Attempted to use non-usable item ${itemId}.`);
           this.error = `Ez a tárgy (${item.name}) nem használható.`;
           return;
       }


      this.loading = true;
      this.error = null;
      console.log(`Executing use_item action for item ID: ${itemId}`);
      try {
        // Hívjuk a backend combat/action végpontját 'use_item' akcióval
        const response = await apiClient.post<GameStateResponse>(
          '/game/combat/action',
          {
            action: 'use_item',
            itemId: itemId
          } // A CombatActionDto-nak megfelelően
        );

        // Frissítjük a teljes store állapotot a kapott válasszal
        this._updateStateFromResponse(response.data);
        console.log('Use item action processed, new state received:', response.data);

      } catch (err: any) {
        console.error('Failed to execute use_item action:', err);
        this.error = err.response?.data?.message || 'A tárgyhasználat sikertelen volt.';
      } finally {
        this.loading = false;
      }
      }, // useItemInCombat vége
       
       async useItemOutOfCombat(itemId: number) {
        if (this.isInCombat) { // Extra ellenőrzés a frontend oldalon is
            console.error('Tried to use item out of combat while in combat state.');
            this.error = 'Harc közben másként kell tárgyat használni.';
            return;
        }
        const item = this.inventory.find(i => i.itemId === itemId);
         if (!item || item.quantity < 1 || !item.usable) {
              this.error = 'Ez a tárgy nem található vagy nem használható.';
              return;
         }

        this.loading = true; // Jelezhetjük, hogy a háttérben dolgozik
        this.error = null;
        console.log(`Using item ${itemId} out of combat...`);
        try {
            // Hívjuk az új backend végpontot
            const response = await apiClient.post<CharacterStats>( // Visszatérési típus CharacterStatsDto
                '/game/use-item',
                { itemId: itemId }
            );

            // Frissítjük a karakter statisztikákat és az inventoryt
            this.characterStats = response.data; // A válasz csak a friss statokat tartalmazza
            // Mivel az inventory is változhatott (elfogyott a tárgy), újra le kell kérni
            // vagy a backendnek vissza kellene adnia a teljes új GameState-et itt is?
            // Egyszerűbb lehet itt egy teljes state frissítést kérni:
            await this.fetchGameState(); // Újra lekérjük a teljes állapotot
            console.log('Item used successfully out of combat, state refreshed.');

        } catch (err: any) {
            console.error('Failed to use item out of combat:', err);
            this.error = err.response?.data?.message || 'A tárgyhasználat sikertelen volt.';
        } finally {
            this.loading = false;
        }
    },
} // actions vége
  })