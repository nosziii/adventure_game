<template>
  <div class="game-view">
    <StatsBar :stats="gameStore.getCharacterStats" />
    <div class="game-actions-bar">
        <button @click="toggleMinimapHandler" class="minimap-toggle-button">
            {{ gameStore.isMinimapVisible ? 'Minimap Bezárása' : 'Minimap Mutatása' }}
        </button>
    </div>
    <PlayerMinimap v-if="gameStore.isMinimapVisible" />

    <div v-if="gameStore.isLoading && !gameStore.isInCombat" class="loading"> Töltés... </div>
    <div v-else-if="gameStore.getError" class="error"> Hiba történt: {{ gameStore.getError }} </div>

    <div v-else>
      <div v-if="gameStore.isInCombat && gameStore.getCombatState" class="combat-view">
        <h2>HARC!</h2>
        <div class="enemy-info">
          <h3>Ellenfél: {{ gameStore.getCombatState.name }}</h3>
          <p>Életerő: {{ gameStore.getCombatState.currentHealth }} / {{ gameStore.getCombatState.health }}</p>
        </div>
        <div class="combat-actions">
          <button @click="handleAttack" class="action-button attack-button" :disabled="gameStore.isLoading">
            {{ gameStore.isLoading ? 'Támadás...' : 'Támadás!' }}
          </button>
          </div>
        <div class="combat-log">
            <h4>Harc Napló:</h4>
            <p v-for="(message, index) in gameStore.getCombatLog" :key="index"> {{ message }} </p>
            <p v-if="gameStore.getCombatLog.length === 0"><i>A harc elkezdődött...</i></p>
        </div>

        <InventoryDisplay :inventory="gameStore.getInventory" />
        </div>

      <div v-else-if="gameStore.currentNode" class="game-content">
        <NodeDisplay :node="gameStore.currentNode" />
        <InventoryDisplay :inventory="gameStore.getInventory" />
        <hr />
        <ChoiceList :choices="gameStore.getChoices" @choice-selected="handleChoiceSelection" />
      </div>

      <div v-else> Nem található játékállapot. </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useGameStore } from '../stores/game' // Vagy relatív útvonal
// Importáljuk az új komponenseket
import StatsBar from '../components/StatsBar.vue'
import NodeDisplay from '../components/NodeDisplay.vue'
import ChoiceList from '../components/ChoiceList.vue'
import InventoryDisplay from '../components/InventoryDisplay.vue'
// import CombatDisplay from '@/components/CombatDisplay.vue'; // Később kell majd
import PlayerMinimap from '../components/PlayerMinimap.vue'

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
// Minimap megjelenítésének kezelése
const toggleMinimapHandler = () => {
    gameStore.toggleMinimap();
};
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
</style>