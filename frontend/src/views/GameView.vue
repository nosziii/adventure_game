<template>
    <div class="game-view">
        <div class="stats-bar" v-if="gameStore.getCharacterStats">
      <span>Életerő: {{ gameStore.getCharacterStats.health }}</span>
      <span> | </span>
      <span>Ügyesség: {{ gameStore.getCharacterStats.skill }}</span>
      </div>
    <hr v-if="gameStore.getCharacterStats" />
      <div v-if="gameStore.isLoading" class="loading">
        Játékállapot töltése...
      </div>
      <div v-else-if="gameStore.getError" class="error">
        Hiba történt: {{ gameStore.getError }}
      </div>
      <div v-else-if="gameStore.currentNode" class="game-content">
        <h2>Aktuális helyszín (Node {{ gameStore.currentNode.id }})</h2>
        <img
          v-if="gameStore.getNodeImage"
          :src="gameStore.getNodeImage"
          alt="Helyszín illusztráció"
          class="node-image"
        />
        <p class="node-text">{{ gameStore.getNodeText }}</p>
  
        <div v-if="gameStore.getChoices.length > 0" class="choices">
          <h3>Válassz:</h3>
          <button
            v-for="choice in gameStore.getChoices"
            :key="choice.id"
            @click="() => {
                console.log('[GameView] Button Data:', choice)
                handleChoice(choice.id)
            }"
            class="choice-button"
          >
            {{ choice.text }}
          </button>
        </div>
        <div v-else class="no-choices">
          Úgy tűnik, nincs több választásod itt... (Vége a jelenetnek?)
           </div>
      </div>
      <div v-else>
          Nem található játékállapot. Indíts új játékot? (Ezt majd később kezeljük)
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted } from 'vue'
  import { useGameStore } from '../stores/game'
  
  const gameStore = useGameStore()
  
  // Komponens betöltésekor lekérjük a játék állapotát
  onMounted(() => {
    gameStore.fetchGameState();
  })
  
  const handleChoice = async (choiceId: number) => {
    console.log(`[GameView] handleChoice called with ID: ${choiceId}`)
  console.log(`Choice button clicked, calling store action with ID: ${choiceId}`)
  // Meghívjuk a store makeChoice akcióját
  await gameStore.makeChoice(choiceId)
}
  
  </script>
  
  <style scoped>
  .game-view {
    padding: 20px;
    font-family: sans-serif;
  }
  .loading, .error {
    text-align: center;
    padding: 40px;
    font-size: 1.2em;
  }
  .error {
    color: red;
  }
  .node-image {
    max-width: 100%;
    height: auto;
    margin-bottom: 15px;
    border: 1px solid #eee;
  }
  .node-text {
    line-height: 1.6;
    margin-bottom: 25px;
    white-space: pre-wrap;
  }
  .choices h3 {
    margin-bottom: 10px;
  }
  .choice-button {
    display: block;
    width: 100%;
    padding: 12px 15px;
    margin-bottom: 10px;
    font-size: 1em;
    text-align: left;
    cursor: pointer;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  .choice-button:hover {
    background-color: #e0e0e0;
  }
  .no-choices {
    margin-top: 20px;
    font-style: italic;
    color: #666;
  }
  .stats-bar {
  padding: 10px;
  background-color: #eee;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
}
.stats-bar span {
  margin: 0 10px;
  font-weight: bold;
}
hr {
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #ccc;
}
  </style>