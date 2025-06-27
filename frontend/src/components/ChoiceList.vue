<template>
    <div v-if="choices.length > 0" class="choices">
      <h3>Válassz:</h3>
      <button
        v-for="choice in choices"
        :key="choice.id"
        @click="selectChoice(choice.id)"
        :disabled="!choice.isAvailable"
        class="choice-button"
        :title="!choice.isAvailable ? 'Feltétel nem teljesül' : ''"
      >
        {{ choice.text }} <span v-if="!choice.isAvailable">🔒</span>
         </button>
    </div>
    <div v-else class="no-choices">
      Úgy tűnik, nincs több választásod itt...
    </div>
  </template>
  
  <script setup lang="ts">
  import type { Choice } from '../types/game.types'; // Vagy relatív útvonal
  
  interface Props {
    choices: Choice[];
  }
  defineProps<Props>();
  
  // Definiáljuk az eseményt, amit a komponens kibocsát
  const emit = defineEmits<{
    (e: 'choice-selected', id: number): void
  }>();
  
  // Metódus, ami kibocsátja az eseményt a választott ID-val
  const selectChoice = (id: number) => {
    console.log(`[ChoiceList] Emitting choice-selected with ID: ${id}`);
    emit('choice-selected', id);
  };
  </script>
  
  <style scoped>
  /* Átemelheted a stílusokat a GameView-ból */
  .choices h3 {
    margin-bottom: 10px;
  }

  .choice-button {
  background: var(--accent-secondary); /* Sötétebb narancs/bronz */
  display: block;
  width: 100%;
  color: var(--text-primary);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 8px 15px;
  border-radius: 5px;
  padding: 12px 15px;
  font-size: 1em;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.1s ease;
}
.choice-button:hover:not(:disabled) {
  background-color: var(--accent-primary); /* Világosabb arany hoverre */
  color: var(--button-text); /* Sötét szöveg, ha az accent világos */
  transform: translateY(-1px);
}
.choice-button:disabled {
  background-color: #555;
  opacity: 0.7;
  cursor: not-allowed;
}
  </style>