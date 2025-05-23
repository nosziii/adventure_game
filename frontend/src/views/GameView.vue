<template>
  <div class="game-view-wrapper"> 
    <div class="game-view">
      <StatsBar :stats="gameStore.getCharacterStats" />
      <div class="game-actions-bar">
          <button @click="toggleMinimapHandler" class="themed-button minimap-toggle-button">
              {{ gameStore.isMinimapVisible ? 'Minimap Bezárása' : 'Minimap Mutatása' }}
          </button>
          <button @click="toggleCharacterSheet" class="themed-button char-sheet-button">
          Karakterlap
        </button>
      </div>
      <PlayerMinimap v-if="gameStore.isMinimapVisible" />
       <CharacterSheetModal v-if="isCharacterSheetVisible" @close="toggleCharacterSheet" />

      <div v-if="gameStore.isLoading && !gameStore.isInCombat && !gameStore.isLoadingMinimap" class="loading">
        Töltés...
      </div>
      <div v-else-if="gameStore.getError" class="error-message">
        Hiba történt: {{ gameStore.getError }}
      </div>

      <div v-else>
        <div v-if="gameStore.isInCombat && gameStore.getCombatState" class="combat-view">
          <h2>HARC!</h2>
          <div class="enemy-info">
            <h3>Ellenfél: {{ gameStore.getCombatState.name }}</h3>
            <p>Életerő: {{ gameStore.getCombatState.currentHealth }} / {{ gameStore.getCombatState.health }}</p>
          </div>

          <div v-if="gameStore.getCombatState.isChargingSpecial && gameStore.getCombatState.specialAttackTelegraphText" class="telegraph-message">
            <p><strong>Figyelem!</strong> {{ gameStore.getCombatState.specialAttackTelegraphText }}</p>
            <p v-if="gameStore.getCombatState.currentChargeTurns && gameStore.getCombatState.maxChargeTurns">
              Töltés: {{ gameStore.getCombatState.currentChargeTurns }} / {{ gameStore.getCombatState.maxChargeTurns }}
            </p>
          </div>

          <div class="combat-actions">
            <button @click="handleAttack" class="action-button attack-button" :disabled="gameStore.isLoading || isDisplayingActions">
              {{ gameStore.isLoading ? 'Támadás...' : 'Támadás!' }}
            </button>
            <button @click="handleDefend" class="action-button defend-button" :disabled="gameStore.isLoading || isDisplayingActions">
              {{ gameStore.isLoading ? 'Védekezés...' : 'Védekezés' }}
            </button>
          </div>

          <div class="combat-log">
            <h4>Harc Napló:</h4>
            <div v-if="displayedLogEntries.length === 0 && !gameStore.isLoadingMinimap && !isDisplayingActions">
              <p><i>Válassz egy akciót...</i></p>
            </div>
            <div v-for="(action, index) in displayedLogEntries" :key="`log-${index}`" class="log-entry">
              <p :class="`actor-${action.actor}`">
                <strong>{{ action.actor === 'player' ? 'Te' : gameStore.getCombatState?.name ?? 'Ellenfél' }}:</strong>
                {{ action.description }}
              </p>
              <ul v-if="action.attackerRollDetails" class="roll-details">
                <li>
                  Támadó: {{ action.attackerRollDetails.actorSkill }}(skill) + {{ action.attackerRollDetails.diceRoll }}(kocka) = <strong>{{ action.attackerRollDetails.totalValue }}</strong>
                </li>
                <li v-if="action.defenderRollDetails">
                  Védekező: {{ action.defenderRollDetails.actorSkill }}(skill) + {{ action.defenderRollDetails.diceRoll }}(kocka) = <strong>{{ action.defenderRollDetails.totalValue }}</strong>
                </li>
              </ul>
              <p v-if="action.damageDealt !== undefined" class="damage-info">
                Sebzés: <span class="damage">{{ action.damageDealt }}</span>.
                Célpont új HP: {{ action.targetCurrentHp }}/{{ action.targetMaxHp }}
              </p>
              <p v-if="action.healthHealed !== undefined" class="heal-info">
                Gyógyulás: <span class="heal">+{{ action.healthHealed }}</span>.
                Új HP: {{ action.targetCurrentHp }}/{{ action.targetMaxHp }}
              </p>
              <p v-if="action.actionType === 'special_attack_charge'" class="charge-info">
                  Töltés: {{action.currentChargeTurns}} / {{action.maxChargeTurns}}
              </p>
            </div>
          </div>
          <InventoryDisplay :inventory="gameStore.getInventory" />
        </div>

        <div v-else-if="gameStore.currentNode" class="game-content">
          <NodeDisplay :node="gameStore.currentNode" />
          <InventoryDisplay :inventory="gameStore.getInventory" />
          <hr />
          <ChoiceList :choices="gameStore.getChoices" @choice-selected="handleChoiceSelection" />
        </div>

        <div v-else>
            Nem található játékállapot. Indíts új játékot?
        </div>
      </div>
    </div>
  </div>
 </template>

<script setup lang="ts">
import { onMounted, watch, ref } from 'vue';
import { useGameStore } from '../stores/game' // Vagy relatív útvonal
// Importáljuk az új komponenseket
import StatsBar from '../components/StatsBar.vue'
import NodeDisplay from '../components/NodeDisplay.vue'
import ChoiceList from '../components/ChoiceList.vue'
import InventoryDisplay from '../components/InventoryDisplay.vue'
// import CombatDisplay from '@/components/CombatDisplay.vue'; // Később kell majd
import PlayerMinimap from '../components/PlayerMinimap.vue'
import type { CombatActionDetails } from '../types/game.types'
import CharacterSheetModal from '../components/CharacterSheetModal.vue'

const gameStore = useGameStore()
const isCharacterSheetVisible = ref(false); // Új állapot a modalhoz

onMounted(() => {
  gameStore.fetchGameState();
});

const toggleCharacterSheet = () => {
  isCharacterSheetVisible.value = !isCharacterSheetVisible.value;
  if (isCharacterSheetVisible.value) {
      // Ha megnyitjuk, frissíthetjük a game state-et, hogy biztosan a legfrissebb statok legyenek
      // Bár a store már reaktív, egy explicit fetch sosem árt, ha pl. háttérben változhatna
      // gameStore.fetchGameState(); // Opcionális
  }
};

// Ez a metódus fogadja az eseményt a ChoiceList-től
const handleChoiceSelection = async (choiceId: number) => {
  console.log(`[GameView] Choice selected event received with ID: ${choiceId}`);
  await gameStore.makeChoice(choiceId);
};

// Harci támadás kezelő (változatlan placeholder)
const handleAttack = async () => { // Legyen async
  console.log('[GameView] Attack button clicked! Calling store action...');
  // Meghívjuk a store attackEnemy akcióját
  await gameStore.attackEnemy()
  // A view a store állapotának változása miatt automatikusan frissül
}
const handleDefend = async () => {
  console.log('[GameView] Defend button clicked! Calling store action...');
  await gameStore.defendInCombat();
  // A view a store állapotának változása miatt automatikusan frissül
};
// Minimap megjelenítésének kezelése
const toggleMinimapHandler = () => {
    gameStore.toggleMinimap();
};

// Új reaktív változók a harci napló késleltetett megjelenítéséhez
const displayedLogEntries = ref<CombatActionDetails[]>([]);
const isDisplayingActions = ref(false); // Jelzi, hogy éppen fut-e az eseménymegjelenítő sorozat

// Figyeljük a store-ban lévő teljes körös akciókat
watch(() => gameStore.getRoundActions, (newActions, oldActions) => {
  // Csak akkor indítsuk a szekvenciát, ha új akciók érkeztek
  // és nem ugyanaz a tömb referencia (bár a tartalom változhatott)
  if (newActions && newActions.length > 0 && newActions !== oldActions) {
    displayedLogEntries.value = []; // Előző kör logjának törlése
    isDisplayingActions.value = true; // Jelezzük, hogy a megjelenítés elkezdődött
    
    let delay = 0;
    newActions.forEach((action, index) => {
      setTimeout(() => {
        displayedLogEntries.value.push(action);
        // Ha ez volt az utolsó akció, jelezzük, hogy a megjelenítés befejeződött
        if (index === newActions.length - 1) {
          isDisplayingActions.value = false;
        }
      }, delay);
      delay += 1000; // 1.5 másodperc késleltetés az események között (állítsd be ízlés szerint)
    });
  } else if (newActions && newActions.length === 0 && !gameStore.isInCombat) {
      // Ha a harc véget ért és a roundActions üres, töröljük a logot
      displayedLogEntries.value = [];
  }
}, { deep: true }); // deep: true fontos, hogy a tömb tartalmának változását is figyelje
</script>

<style scoped>
/* A .game-view-wrapper stílusa mehet a globális body stílus helyett, ha csak itt akarjuk ezt a hátteret */
.game-view-wrapper {
  min-height: 100vh; /* Teljes magasság */
  /* A háttér a globális body stílusból jön (var(--bg-gradient-start), etc.) */
  /* Vagy ha itt specifikusat akarsz: */
  /* background: linear-gradient(to bottom, var(--bg-gradient-start), var(--bg-gradient-end)); */
  padding: 20px 0; /* Vertikális padding, hogy ne érjen a böngésző széléhez */
  display: flex; /* Középre igazításhoz */
  justify-content: center;
  align-items: flex-start; /* Felülre igazít */
}

.game-view {
  width: 100%; /* Teljes szélesség */
  max-width: 1400px; /* Kicsit szélesebb lehet, vagy akár 90% */
  margin: 20px; /* Térköz a széleken */
  padding: 25px 30px;
  background: var(--panel-bg); /* Sötét, áttetsző panel háttér */
  color: var(--text-primary);
  font-family: 'EB Garamond', serif;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  box-shadow: 0 8px 25px rgba(0,0,0,0.5);
}

hr {
  border: 0;
  border-top: 1px solid var(--panel-border); /* Témához illő elválasztó */
  margin-top: 25px;
  margin-bottom: 25px;
}

.loading-text, .error-message.main-error, .info-message { /* A game-view-n belüli általános üzenetek */
  text-align: center;
  padding: 30px;
  font-size: 1.1em;
  color: var(--text-secondary);
  background-color: rgba(0,0,0,0.1);
  border-radius: 6px;
}
.error-message.main-error {
  color: #ff8080; /* Élénkebb piros */
  border: 1px solid #ff8080;
}

.game-actions-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end; /* Gomb jobbra */
}

/* Általános gomb stílus a témához (ezt használhatjuk több helyen) */
.themed-button {
  background: var(--accent-secondary); /* Sötétebb narancs/bronz */
  color: var(--text-primary);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.1s ease;
}
.themed-button:hover:not(:disabled) {
  background-color: var(--accent-primary); /* Világosabb arany hoverre */
  color: var(--button-text); /* Sötét szöveg, ha az accent világos */
  transform: translateY(-1px);
}
.themed-button:disabled {
  background-color: #555;
  opacity: 0.7;
  cursor: not-allowed;
}

/* Combat View specifikus stílusok */
.combat-view {
  border: 1px solid var(--panel-border); /* Finomabb keret */
  padding: 20px;
  margin-top: 20px;
  border-radius: 8px;
  background-color: rgba(0,0,0,0.15); /* Enyhén sötétebb háttér a harcnak */
}

.combat-view h2 {
    font-family: 'Cinzel Decorative', cursive;
    color: var(--accent-primary);
    text-align: center;
    margin-bottom: 20px;
}

.enemy-info {
  /* background-color: #fdd; Régi */
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 1px dashed var(--panel-border);
}
.enemy-info h3 {
  margin-top: 0;
  color: var(--accent-secondary);
  font-family: 'Cinzel', serif;
}

.combat-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 20px 0;
}
.action-button { /* A harci gombok közös stílusa */
    /* Most már a .themed-button-t használhatnák, de felülírhatjuk itt */
    padding: 10px 20px;
    font-family: 'Cinzel', serif;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}
.attack-button {
    background-color: #a03c3c; /* Sötétebb vörös */
    color: var(--text-primary);
    border-color: #7c2e2e;
}
.attack-button:hover:not(:disabled) { background-color: #c04c4c; }

.defend-button {
    background-color: #3c7ca0; /* Sötétebb kék */
    color: var(--text-primary);
    border-color: #2e5e7c;
}
.defend-button:hover:not(:disabled) { background-color: #4c9bc0; }


.telegraph-message {
  background-color: #fff3cd; /* Világos sárga figyelmeztető háttér */
  color: #856404; /* Sötét sárga/barna szöveg */
  border: 1px solid #ffeeba;
  padding: 10px 15px;
  margin-top: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
  text-align: center;
}
.telegraph-message p {
    margin: 0;
}

.combat-log { /* Finomítások */
  margin-top: 20px;
  border: 1px solid var(--panel-border);
  padding: 15px;
  max-height: 250px;
  overflow-y: auto;
  background-color: rgba(0,0,0,0.2); /* Sötétebb log háttér */
  border-radius: 6px;
  font-size: 0.9em;
}
.combat-log h4 { /* ... */ color: var(--text-secondary); }
.log-entry { /* ... */ border-bottom: 1px dotted rgba(var(--panel-border), 0.5); }
.log-entry p { color: var(--text-secondary); }
.log-entry .actor-player { color: #90caf9; } /* Világoskék játékos */
.log-entry .actor-enemy { color: #f48fb1; } /* Pinkesebb piros ellenfél */
.roll-details { color: #a0a0b0; }
.damage-info .damage { color: #ff7043; } /* Narancsosabb piros sebzés */
.heal-info .heal { color: #81c784; } /* Világoszöld gyógyítás */
.charge-info { color: #ba68c8; /* Lila töltés */ }

/* Game Content stílusai (ahol a NodeDisplay, InventoryDisplay, ChoiceList van) */
.game-content {
    padding-top: 20px;
}

.char-sheet-button {
    background-color: #6f42c1; /* Lila gomb */
    margin-left: 10px; /* Térköz a minimap gomb mellett */
}
.char-sheet-button:hover:not(:disabled) {
    background-color: #5a2d9e;
}

.minimap-toggle-button {
    background-color: #6f42c1; /* Lila gomb */
    margin-left: 10px; /* Térköz a minimap gomb mellett */
}

.minimap-toggle-button:hover:not(:disabled) {
    background-color: #5a2d9e;
}

</style>