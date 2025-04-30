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
  .choice-button:hover:not(:disabled) {
    background-color: #e0e0e0;
  }
  .choice-button:disabled {
      background-color: #e9ecef;
      color: #6c757d;
      cursor: not-allowed;
      opacity: 0.65;
  }
  .no-choices {
    margin-top: 20px;
    font-style: italic;
    color: #666;
  }
  </style>