<template>
  <div class="stats-bar-container">
    <div class="stats-bar" v-if="stats">
      <span>HP: {{ stats.health }}</span>
      <span v-if="stats.skill !== null"> | Skill: {{ stats.skill }}</span>
      <span v-if="stats.luck !== null"> | Luck: {{ stats.luck }}</span>
      <span v-if="stats.stamina !== null"> | Stamina: {{ stats.stamina }}</span>
      <span v-if="stats.level !== null"> | Szint: {{ stats.level }}</span>
      <span v-if="stats.xp !== null && stats.xpToNextLevel !== null"> | XP: {{ stats.xp }} / {{ stats.xpToNextLevel }}</span>
    </div>
    <button v-if="authStore.isAuthenticated" @click="handleLogout" class="logout-button">
      Kijelentkezés
    </button>
  </div>
  <hr v-if="stats" />
</template>
  
  <script setup lang="ts">
import type { CharacterStats } from '../types/game.types'
  import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { defineProps } from 'vue'
  
  // Definiáljuk a prop-ot, amit a komponens kapni fog
  interface Props {
    stats: CharacterStats | null;
  }
defineProps<Props>()

const authStore = useAuthStore();
const router = useRouter(); // Router példányosítása

// Logout függvény
const handleLogout = () => {
  console.log('Logging out...')
  authStore.logout()
  router.push({ name: 'login' })
}

  </script>
  
  <style scoped>
  .stats-bar-container {
    display: flex; /* Elemek egymás mellé rendezése */
    justify-content: space-between; /* Hely kihasználása */
    align-items: center; /* Középre igazítás függőlegesen */
    background-color: #eee;
    padding: 5px 10px; /* Kisebb padding lehet elég */
    border-radius: 4px;
    margin-bottom: 15px;
}
  .stats-bar span {
    margin: 0 10px;
    font-weight: bold;
    font-size: 0.9em;
  }
  .logout-button:hover {
    background-color: #5a6268;
}
  hr {
      margin-bottom: 20px;
      border: 0;
      border-top: 1px solid #ccc;
  }
  </style>