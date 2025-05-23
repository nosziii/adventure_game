<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content character-sheet">
      <button @click="$emit('close')" class="close-button-modal">X</button>
      <h2>Karakterlap</h2>

      <div v-if="!stats" class="loading-text">Karakteradatok töltése...</div>
      <div v-else>
        <div class="char-info-grid">
          <div><strong>Név:</strong> {{ stats.name || 'Ismeretlen' }}</div>
          <div><strong>Szint:</strong> {{ stats.level }}</div>
          <div><strong>XP:</strong> {{ stats.xp }} / {{ stats.xpToNextLevel }}</div>
          <div><strong>HP:</strong> {{ stats.health }} / {{ stats.stamina }}</div>
        </div>

        <hr class="divider" />

        <h3>Statisztikák és Tehetségpontok</h3>
        <p class="talent-points">
          Elkölthető tehetségpontok: 
          <strong>{{ stats.talentPointsAvailable ?? 0 }}</strong>
        </p>

        <ul class="stats-list">
          <li>
            <span>Skill: {{ stats.skill }}</span>
            <button 
              @click="handleSpendPoint('skill')" 
              :disabled="!canSpendPoints || gameStore.isLoading"
              class="spend-point-button"
              title="+1 Skill pontért"
            >+</button>
          </li>
          <li>
            <span>Luck: {{ stats.luck }}</span>
            <button 
              @click="handleSpendPoint('luck')" 
              :disabled="!canSpendPoints || gameStore.isLoading"
              class="spend-point-button"
              title="+1 Luck pontért"
            >+</button>
          </li>
          <li>
            <span>Stamina (Max HP): {{ stats.stamina }}</span>
            <button 
              @click="handleSpendPoint('stamina')" 
              :disabled="!canSpendPoints || gameStore.isLoading"
              class="spend-point-button"
              title="+5 Stamina pontért"
            >+</button>
          </li>
          <li>
            <span>Defense: {{ stats.defense }}</span>
            <button 
              @click="handleSpendPoint('defense')" 
              :disabled="!canSpendPoints || gameStore.isLoading"
              class="spend-point-button"
              title="+1 Defense pontért"
            >+</button>
          </li>
        </ul>
        <p v-if="gameStore.isLoading" class="loading-text small">Pont elköltése folyamatban...</p>
        <p v-if="gameStore.getError" class="error-message small">{{ gameStore.getError }}</p>
      </div>
      
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/game';
// import type { CharacterStats } from '@/types/game.types'; // SpendableStatName is in gameStore now
import type { SpendableStatName } from "../types/character.dto.types";
// Ha a SpendableStatName a gameStore-ban van definiálva, akkor onnan is elérhető,
// de jobb lenne egy közös types fájlban. Most a gameStore-beli definícióra támaszkodunk.
// type SpendableStatName = 'skill' | 'luck' | 'defense' | 'stamina';


defineEmits(['close']);

const gameStore = useGameStore();
const stats = computed(() => gameStore.getCharacterStats);

const canSpendPoints = computed(() => (stats.value?.talentPointsAvailable ?? 0) > 0);

const handleSpendPoint = async (statName: SpendableStatName) => {
  if (!canSpendPoints.value) return;
  // A store hibaüzenetét a template már megjeleníti
  await gameStore.spendTalentPoint(statName);
  // Az UI automatikusan frissül, mert a gameStore.characterStats reaktív
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(var(--bg-gradient-deep-purple-rgb, 28, 21, 63), 0.85); /* Sötét, áttetszőbb */
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
}

.modal-content.character-sheet {
  background-color: var(--panel-bg);
  color: var(--text-primary);
  padding: 25px 30px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  position: relative; /* A close buttonhoz */
}

.close-button-modal {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255,255,255,0.1);
  color: var(--text-secondary);
  border: 1px solid var(--panel-border);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}
.close-button-modal:hover {
  background: rgba(255,255,255,0.2);
  color: var(--text-primary);
}

h2 {
  font-family: 'Cinzel Decorative', cursive;
  color: var(--accent-primary);
  text-align: center;
  margin-top: 0;
  margin-bottom: 25px;
}
h3 {
  font-family: 'Cinzel', serif;
  color: var(--accent-secondary);
  margin-top: 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--panel-border);
  padding-bottom: 8px;
}
.char-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px 20px;
    margin-bottom: 20px;
    font-size: 0.95em;
}
.char-info-grid div strong {
    color: var(--text-secondary);
}

.divider {
    border: 0;
    border-top: 1px dashed var(--panel-border);
    margin: 25px 0;
}

.talent-points {
  text-align: center;
  font-size: 1.1em;
  margin-bottom: 20px;
}
.talent-points strong {
  color: var(--accent-primary);
  font-size: 1.3em;
}

.stats-list {
  list-style: none;
  padding: 0;
}
.stats-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(var(--panel-border-rgb, 70, 62, 82), 0.2);
}
.stats-list li:last-child {
  border-bottom: none;
}
.stats-list span {
  font-size: 1em;
}
.spend-point-button {
  background-color: var(--accent-secondary);
  color: var(--button-text);
  border: none;
  border-radius: 5px;
  width: 30px;
  height: 30px;
  font-size: 1.2em;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.spend-point-button:hover:not(:disabled) {
  background-color: var(--accent-primary);
}
.spend-point-button:disabled {
  background-color: #555;
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-text.small, .error-message.small {
    font-size: 0.85em;
    text-align: center;
    margin-top: 10px;
    padding: 5px;
}
.error-message.small { color: #ff8080; }

</style>