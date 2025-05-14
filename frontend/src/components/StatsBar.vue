<template>
  <div class="stats-bar-container">
    <div class="stats-bar" v-if="stats">
      <span>HP: {{ stats.health }}</span>
      <span v-if="stats.skill !== null"> | Skill: {{ stats.skill }}</span>
      <span v-if="stats.defense !== null && stats.defense !== undefined"> | Védelem: {{ stats.defense }}</span> <span v-if="stats.luck !== null"> | Luck: {{ stats.luck }}</span>
      <span v-if="stats.luck !== null"> | Luck: {{ stats.luck }}</span>
      <span v-if="stats.stamina !== null"> | Stamina: {{ stats.stamina }}</span>
      <span v-if="stats.level !== null"> | Szint: {{ stats.level }}</span>
      <span v-if="stats.xp !== null && stats.xpToNextLevel !== null"> | XP: {{ stats.xp }} / {{ stats.xpToNextLevel }}</span>
    </div>
        <div class="action-buttons">
      <router-link
        v-if="authStore.isAuthenticated && authStore.isAdmin"
        :to="{ name: 'admin-dashboard' }"
        class="admin-button"
      >
        Admin Felület
      </router-link>

      <button v-if="authStore.isAuthenticated" @click="handleLogout" class="logout-button">
        Kijelentkezés
      </button>
    </div>
  </div>
  <hr v-if="stats || authStore.isAuthenticated" />
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f0f0f0; /* Kicsit világosabb háttér */
    padding: 8px 15px;
    border-radius: 4px;
    margin-bottom: 10px; /* Kisebb margó alul */
    flex-wrap: wrap; /* Tördelés kisebb képernyőn */
}
.stats-bar {
    display: flex; /* Statok is egymás mellett */
    flex-wrap: wrap; /* Tördelés kisebb képernyőn */
    gap: 0 10px; /* Kis térköz a statok között */
}
.stats-bar span {
  /* margin: 0 8px; -> kiváltva gap-pel */
  font-weight: bold;
  font-size: 0.9em;
  white-space: nowrap; /* Ne tördelődjenek a stat nevek/értékek */
}
.action-buttons {
    display: flex; /* Gombok egymás mellett */
    align-items: center;
    gap: 10px; /* Térköz a gombok között */
}
.admin-button,
.logout-button {
    padding: 6px 12px;
    font-size: 0.85em;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none; /* router-link esetén */
    display: inline-block; /* router-link esetén */
    transition: background-color 0.2s;
}
.admin-button {
    background-color: #17a2b8; /* Másik szín az admin gombnak */
}
.admin-button:hover {
    background-color: #138496;
}
.logout-button {
    background-color: #6c757d;
}
.logout-button:hover {
    background-color: #5a6268;
}
hr {
    margin-top: 0; /* Az elválasztó közvetlenül a sáv alatt */
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #ccc;
}
  </style>