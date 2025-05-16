<template>
  <div class="game-view">
    <StatsBar :stats="gameStore.getCharacterStats" />
    <div class="game-actions-bar">
        <button @click="toggleMinimapHandler" class="minimap-toggle-button">
            {{ gameStore.isMinimapVisible ? 'Minimap Bezárása' : 'Minimap Mutatása' }}
        </button>
    </div>
    <PlayerMinimap v-if="gameStore.isMinimapVisible" />

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
    </div> </div> </template>

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

const gameStore = useGameStore()

onMounted(() => {
  gameStore.fetchGameState();
});

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
      delay += 1500; // 1.5 másodperc késleltetés az események között (állítsd be ízlés szerint)
    });
  } else if (newActions && newActions.length === 0 && !gameStore.isInCombat) {
      // Ha a harc véget ért és a roundActions üres, töröljük a logot
      displayedLogEntries.value = [];
  }
}, { deep: true }); // deep: true fontos, hogy a tömb tartalmának változását is figyelje
</script>

<style scoped>
/* A GameView saját stílusai itt maradhatnak vagy törölhetők,
   ha a komponensek stílusai elegendőek */
 hr { /* Stílus az elválasztóhoz */
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
}

.game-view {
  padding: 20px;
  font-family: sans-serif;
  max-width: 700px; /* Példa szélesség */
  margin: 20px auto;
}
.loading, .error {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
}
.error {
  color: red;
}
/* A harci nézet placeholder stílusa (később mehet a CombatDisplay-be) */
 .combat-view {
    border: 2px dashed red;
    padding: 15px;
    margin-top: 20px;
  }
  .enemy-info {
    background-color: #fdd;
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 15px;
  }
   .enemy-info h3{
     margin-top: 0;
   }
  .action-button {
     padding: 10px 15px;
     margin-right: 10px;
     cursor: pointer;
     border: none;
  }
  .attack-button {
    background-color: #dc3545; /* Piros */
    color: white;
  }
   .attack-button:hover {
    background-color: #c82333;
  }
  .game-actions-bar {
    margin-bottom: 15px;
    text-align: right; /* Vagy ahova szeretnéd tenni a gombot */
}
.minimap-toggle-button {
    padding: 8px 12px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
.minimap-toggle-button:hover {
    background-color: #0056b3;
}

.defend-button {
  background-color: #17a2b8; /* Kékeszöld, mint az admin gomb */
  color: white;
  border: none;
}
.defend-button:hover:not(:disabled) {
  background-color: #138496;
}

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

.combat-log {
  margin-top: 15px;
  border: 1px solid #eee; /* Kicsit szolidabb keret */
  padding: 10px;
  max-height: 200px; /* Vagy amennyi kényelmes */
  overflow-y: auto;
  background-color: #f8f9fa; /* Világos háttér */
  border-radius: 4px;
}
.combat-log h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 0.9em;
  color: #333;
  border-bottom: 1px solid #ddd;
  padding-bottom: 5px;
}
.log-entry {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dotted #ddd;
}
.log-entry:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.log-entry p {
  margin: 2px 0;
  font-size: 0.9em;
}
.log-entry .actor-player { color: navy; }
.log-entry .actor-enemy { color: darkred; }
.roll-details {
  list-style: none;
  padding-left: 15px;
  font-size: 0.8em;
  color: #555;
}
.damage-info .damage { font-weight: bold; color: red; }
.heal-info .heal { font-weight: bold; color: green; }

.charge-info { font-style: italic; color: #660066; }
.combat-actions button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}
</style>