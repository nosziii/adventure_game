import { defineStore } from "pinia";
import apiClient from "../services/api";
import type {
  GameStateResponse,
  Choice,
  StoryNodeData,
  CharacterStats,
  EnemyData,
  InventoryItem,
  PlayerProgressStep,
  PlayerMapNode,
  PlayerMapEdge,
  PlayerMapData,
  CombatActionDetails,
} from "../types/game.types";

interface GameState {
  currentNode: StoryNodeData | null;
  currentChoices: Choice[];
  characterStats: CharacterStats | null;
  currentRoundDetailedActions: CombatActionDetails[];
  messages: string[];
  loading: boolean;
  error: string | null;
  combatState: EnemyData | null;
  combatLogMessages: string[];
  inventory: InventoryItem[];
  equippedWeaponId: number | null;
  equippedArmorId: number | null;
  equipLoading: boolean; // Külön töltés jelző a fel/le szereléshez (opcionális)
  visitedPath: PlayerProgressStep[];
  mapNodes: PlayerMapNode[];
  mapEdges: PlayerMapEdge[];
  minimapVisible: boolean;
  loadingMinimap: boolean;
}

export const useGameStore = defineStore("game", {
  state: (): GameState => ({
    currentNode: null,
    currentChoices: [],
    characterStats: null,
    currentRoundDetailedActions: [],
    messages: [],
    loading: false,
    error: null,
    combatState: null,
    combatLogMessages: [],
    inventory: [],
    equippedWeaponId: null,
    equippedArmorId: null,
    equipLoading: false,
    visitedPath: [],
    mapNodes: [],
    mapEdges: [],
    minimapVisible: false,
    loadingMinimap: false,
  }),

  getters: {
    getNodeText: (state): string => state.currentNode?.text ?? "",
    getNodeImage: (state): string | null => state.currentNode?.image ?? null,
    getCharacterStats: (state): CharacterStats | null => state.characterStats,
    getChoices: (state): Choice[] => state.currentChoices, // Típus itt is frissül
    isLoading: (state): boolean => state.loading,
    getError: (state): string | null => state.error,
    // getCombatLog: (state): string[] => state.combatLogMessages, // Getter a harci üzenetekhez
    getRoundActions: (state): CombatActionDetails[] =>
      state.currentRoundDetailedActions,
    getGameMessages: (state): string[] => state.messages,
    isInCombat: (state): boolean => !!state.combatState, // Getter a harc állapot ellenőrzésére
    getCombatState: (state): EnemyData | null => state.combatState, // Getter a harc adatokhoz
    getInventory: (state): InventoryItem[] => state.inventory, // Getter az inventoryhoz
    getLevel: (state): number => state.characterStats?.level ?? 1,
    getXp: (state): number => state.characterStats?.xp ?? 0,
    getXpToNextLevel: (state): number =>
      state.characterStats?.xpToNextLevel ?? 100,
    getEquippedWeaponId: (state): number | null => state.equippedWeaponId,
    getEquippedArmorId: (state): number | null => state.equippedArmorId,
    isEquipping: (state): boolean => state.equipLoading, // Getter az equip töltéshez
    getVisitedPath: (state): PlayerProgressStep[] => state.visitedPath,
    getMapNodes: (state): PlayerMapNode[] => state.mapNodes,
    getMapEdges: (state): PlayerMapEdge[] => state.mapEdges,
    isMinimapVisible: (state): boolean => state.minimapVisible,
    isLoadingMinimap: (state): boolean => state.loadingMinimap,
  },

  actions: {
    _updateStateFromResponse(data: GameStateResponse) {
      this.currentNode = data.node;
      this.currentChoices = data.choices;
      this.characterStats = data.character
        ? {
            health: data.character.health,
            skill: data.character.skill,
            luck: data.character.luck,
            stamina: data.character.stamina,
            name: data.character.name,
            level: data.character.level,
            xp: data.character.xp,
            xpToNextLevel: data.character.xpToNextLevel,
            defense: data.character.defense,
          }
        : null;
      this.combatState = data.combat;
      this.inventory = data.inventory ?? [];
      this.equippedWeaponId = data.equippedWeaponId ?? null;
      this.equippedArmorId = data.equippedArmorId ?? null;
      this.currentRoundDetailedActions = data.roundActions ?? [];
      this.messages = data.messages ?? [];
    },

    async fetchGameState() {
      this.loading = true;
      this.error = null;
      console.log("Fetching game state...");
      try {
        // Az API hívás most a frontend GameStateResponse típusát várja
        const response = await apiClient.get<GameStateResponse>("/game/state");
        this._updateStateFromResponse(response.data);
      } catch (err: any) {
        console.error("Failed to fetch game state:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült betölteni a játék állapotát.";
      } finally {
        this.loading = false;
      }
    },

    async makeChoice(choiceId: number) {
      const payload = { choiceId: choiceId };
      console.log(
        "Frontend: Sending makeChoice payload:",
        payload,
        "Type of choiceId:",
        typeof choiceId
      );
      this.loading = true;
      this.error = null;
      console.log(`Making choice ID: ${choiceId}`);
      try {
        const response = await apiClient.post<GameStateResponse>(
          "/game/choice",
          { choiceId: choiceId }
        );

        //Refresh...
        this._updateStateFromResponse(response.data);
      } catch (err: any) {
        console.error("Failed to make choice:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült feldolgozni a választást.";
        // Lehet, hogy itt nem kell logout, hacsak nem 401 hiba jön
      } finally {
        this.loading = false; // Betöltés vége
      }
    },

    // Harci akciók kezelése
    async attackEnemy() {
      // Csak akkor támadunk, ha tényleg harcban vagyunk
      if (!this.combatState) {
        console.error("Attack action called but not in combat!");
        return;
      }

      this.loading = true;
      this.error = null;
      console.log("Executing attack action...");
      try {
        // Hívjuk a backend combat/action végpontját
        // A bodyban megadjuk, hogy 'attack' az akció
        const response = await apiClient.post<GameStateResponse>(
          "/game/combat/action",
          { action: "attack" }
        );
        // Frissítjük az állapotot a válasz alapján
        this._updateStateFromResponse(response.data);

        console.log(
          "Combat action processed, new state received:",
          response.data
        );
      } catch (err: any) {
        console.error("Failed to execute combat action:", err);
        this.error =
          err.response?.data?.message || "A harci művelet sikertelen volt.";
        // Itt is lehetne logout 401 esetén, de az interceptor valószínűleg már kezelte
      } finally {
        this.loading = false;
      }
    },

    async useItemInCombat(itemId: number) {
      if (!this.combatState) {
        console.error("useItemInCombat action called but not in combat!");
        this.error = "Nem vagy harcban."; // Adjunk visszajelzést
        return; // Ne csinálj semmit, ha nincs harc
      }
      // Ellenőrizzük, hogy van-e ilyen tárgy (opcionális, a backend is ellenőrzi)
      const item = this.inventory.find((i) => i.itemId === itemId);
      if (!item || item.quantity < 1) {
        console.error(
          `Attempted to use item ${itemId} but not available in inventory.`
        );
        this.error = "Nincs ilyen tárgyad, vagy elfogyott.";
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
          "/game/combat/action",
          {
            action: "use_item",
            itemId: itemId,
          } // A CombatActionDto-nak megfelelően
        );

        // Frissítjük a teljes store állapotot a kapott válasszal
        this._updateStateFromResponse(response.data);
        console.log(
          "Use item action processed, new state received:",
          response.data
        );
      } catch (err: any) {
        console.error("Failed to execute use_item action:", err);
        this.error =
          err.response?.data?.message || "A tárgyhasználat sikertelen volt.";
      } finally {
        this.loading = false;
      }
    }, // useItemInCombat vége

    async useItemOutOfCombat(itemId: number) {
      if (this.isInCombat) {
        // Extra ellenőrzés a frontend oldalon is
        console.error("Tried to use item out of combat while in combat state.");
        this.error = "Harc közben másként kell tárgyat használni.";
        return;
      }
      const item = this.inventory.find((i) => i.itemId === itemId);
      if (!item || item.quantity < 1 || !item.usable) {
        this.error = "Ez a tárgy nem található vagy nem használható.";
        return;
      }

      this.loading = true; // Jelezhetjük, hogy a háttérben dolgozik
      this.error = null;
      console.log(`Using item ${itemId} out of combat...`);
      try {
        // Hívjuk az új backend végpontot
        const response = await apiClient.post<CharacterStats>( // Visszatérési típus CharacterStatsDto
          "/game/use-item",
          { itemId: itemId }
        );

        // Frissítjük a karakter statisztikákat és az inventoryt
        this.characterStats = response.data; // A válasz csak a friss statokat tartalmazza
        // Mivel az inventory is változhatott (elfogyott a tárgy), újra le kell kérni
        // vagy a backendnek vissza kellene adnia a teljes új GameState-et itt is?
        // Egyszerűbb lehet itt egy teljes state frissítést kérni:
        await this.fetchGameState(); // Újra lekérjük a teljes állapotot
        console.log("Item used successfully out of combat, state refreshed.");
      } catch (err: any) {
        console.error("Failed to use item out of combat:", err);
        this.error =
          err.response?.data?.message || "A tárgyhasználat sikertelen volt.";
      } finally {
        this.loading = false;
      }
    },

    async equipItem(itemId: number) {
      this.equipLoading = true;
      this.error = null;
      console.log(`Attempting to equip item ID: ${itemId}`);
      try {
        // Hívjuk az ÚJ backend végpontot
        const response = await apiClient.post<CharacterStats>( // A válasz csak a CharacterStatsDto
          "/character/equip", // Figyelj az útvonalra! /api/character/equip lesz a teljes
          { itemId: itemId }
        );
        // Közvetlenül frissítjük a karakter statokat a válasszal
        this.characterStats = response.data;
        // Az inventory nem változott, de a felszerelt ID igen, kérjük le újra a teljes state-et
        // VAGY a backend válasza tartalmazhatná az új equipped ID-kat is?
        // Maradjunk a fetchGameState-nél a konzisztencia miatt.
        await this.fetchGameState(); // Biztosítjuk, hogy az equipped ID-k is frissüljenek
        console.log("Equip successful, state refreshed.");
      } catch (err: any) {
        console.error("Failed to equip item:", err);
        this.error =
          err.response?.data?.message ||
          "A tárgy felszerelése sikertelen volt.";
      } finally {
        this.equipLoading = false;
      }
    },

    async unequipItem(itemType: "weapon" | "armor") {
      this.equipLoading = true;
      this.error = null;
      console.log(`Attempting to unequip item type: ${itemType}`);
      try {
        // Hívjuk az ÚJ backend végpontot
        const response = await apiClient.post<CharacterStats>(
          "/character/unequip",
          { itemType: itemType }
        );
        // Frissítjük a statokat és lekérjük a teljes állapotot
        this.characterStats = response.data;
        await this.fetchGameState();
        console.log("Unequip successful, state refreshed.");
      } catch (err: any) {
        console.error("Failed to unequip item:", err);
        this.error =
          err.response?.data?.message || "A tárgy levétele sikertelen volt.";
      } finally {
        this.equipLoading = false;
      }
    },

    // ---Játékos térkép adatainak lekérése ---
    async fetchPlayerMapData() {
      this.loadingMinimap = true;
      this.error = null; // Általános error flaget itt is nullázhatunk
      console.log("Fetching player map data for minimap...");
      try {
        // A backend PlayerMapDataDto-t küld, ami PlayerMapData-ként használható itt
        const response = await apiClient.get<PlayerMapData>(
          "/game/map-progress"
        );
        this.mapNodes = response.data.nodes;
        this.mapEdges = response.data.edges;
        console.log(
          `Workspaceed ${this.mapNodes.length} nodes and ${this.mapEdges.length} edges for minimap.`
        );
      } catch (err: any) {
        console.error("Failed to fetch player map data:", err);
        this.error =
          err.response?.data?.message ||
          "Nem sikerült betölteni a térkép adatokat.";
        this.mapNodes = [];
        this.mapEdges = [];
      } finally {
        this.loadingMinimap = false;
      }
    },
    // --- Védekezés harcban ---
    async defendInCombat() {
      if (!this.combatState) {
        console.error("defendInCombat action called but not in combat!");
        this.error = "Nem vagy harcban, nem tudsz védekezni.";
        return;
      }

      this.loading = true; // Használhatjuk az általános loading flaget
      this.error = null;
      console.log("Executing defend action...");
      try {
        // Hívjuk a backend combat/action végpontját 'defend' akcióval
        const response = await apiClient.post<GameStateResponse>(
          "/game/combat/action",
          { action: "defend" } // A CombatActionDto-nak megfelelően
        );

        // Frissítjük a teljes store állapotot a kapott válasszal
        this._updateStateFromResponse(response.data);
        console.log(
          "Defend action processed, new state received:",
          response.data
        );
      } catch (err: any) {
        console.error("Failed to execute defend action:", err);
        this.error =
          err.response?.data?.message || "A védekezés sikertelen volt.";
      } finally {
        this.loading = false;
      }
    }, // defendInCombat vége

    // --- Minimap láthatóságának váltása ---
    async toggleMinimap() {
      this.minimapVisible = !this.minimapVisible;
      console.log(`Minimap visible: ${this.minimapVisible}`);
      // Ha láthatóvá tesszük ÉS még nincs adat (vagy mindig frissíteni akarjuk), akkor töltsük be
      if (
        this.minimapVisible &&
        this.visitedPath.length === 0 /* || mindig_frissit_flag */
      ) {
        await this.fetchPlayerMapData();
      }
    },

    async selectAndStartStory(storyId: number): Promise<boolean> {
      this.loading = true;
      this.error = null;
      console.log(`Attempting to start story ID: ${storyId} via API...`);
      try {
        // Hívjuk az új backend végpontot, ami beállítja az aktív sztorit
        // és visszaadja az új, kezdő GameStateDto-t.
        const response = await apiClient.post<GameStateResponse>(
          `/character/story/${storyId}/start`,
          {}
        );

        // Közvetlenül frissítjük a teljes store állapotot a kapott válasszal
        this._updateStateFromResponse(response.data);
        console.log(
          `Story ${storyId} started successfully, new game state received:`,
          response.data
        );

        // Nincs szükség külön fetchGameState-re, mert a válasz már a friss állapot
        // Átirányítás a játékra
        // A routert itt közvetlenül ne használjuk, ha lehet, inkább a komponensből indítsuk az átirányítást
        // De ha a store felelős érte, akkor itt kell a router példány.
        // Jobb, ha az akció csak visszaad egy sikerességet, és a komponens navigál.
        return true;
      } catch (err: any) {
        console.error(`Failed to start story ${storyId}:`, err);
        this.error =
          err.response?.data?.message ||
          `Nem sikerült elindítani a(z) ${storyId} ID-jú sztorit.`;
        return false;
      } finally {
        this.loading = false;
      }
    },
  }, // actions vége
});
