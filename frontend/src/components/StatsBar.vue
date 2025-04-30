<template>
    <div class="stats-bar" v-if="stats">
      <span>Életerő: {{ stats.health }}</span>
      <span v-if="stats.skill !== null && stats.skill !== undefined"> | Ügyesség: {{ stats.skill }}</span>
      <span v-if="stats.luck !== null && stats.luck !== undefined"> | Szerencse: {{ stats.luck }}</span>
      <span v-if="stats.stamina !== null && stats.stamina !== undefined"> | Állóképesség: {{ stats.stamina }}</span>
      </div>
    <hr v-if="stats" />
  </template>
  
  <script setup lang="ts">
  import type { CharacterStats } from '../types/game.types'; // Vagy relatív útvonal
  
  // Definiáljuk a prop-ot, amit a komponens kapni fog
  interface Props {
    stats: CharacterStats | null;
  }
  defineProps<Props>();
  </script>
  
  <style scoped>
  /* Átemelheted a stílusokat a GameView-ból, vagy újakat definiálhatsz */
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