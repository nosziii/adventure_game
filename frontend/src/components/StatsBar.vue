<template>
  <div class="stats-bar-container">
    <div class="stats-bar" v-if="stats">
      <span>HP: {{ stats.health }}</span>
      <span v-if="stats.skill !== null"> | Skill: {{ stats.skill }}</span>
      <span v-if="stats.defense !== null && stats.defense !== undefined"> | Védelem: {{ stats.defense }}</span>
      <span v-if="stats.luck !== null"> | Luck: {{ stats.luck }}</span>
      <span v-if="stats.stamina !== null"> | Stamina: {{ stats.stamina }}</span>
      <span v-if="stats.level !== null"> | Szint: {{ stats.level }}</span>
      <span v-if="stats.xp !== null && stats.xpToNextLevel !== null"> | XP: {{ stats.xp }} / {{ stats.xpToNextLevel }}</span>
    </div>
    <div class="action-buttons">
      <router-link v-if="authStore.isAuthenticated && authStore.isAdmin" :to="{ name: 'admin-dashboard' }" class="themed-button admin-button-stats">
        Admin
      </router-link>
      <button v-if="authStore.isAuthenticated" @click="handleDashboard" class="themed-button logout-button-stats">
        Dashboard
      </button> 
      <button v-if="authStore.isAuthenticated" @click="handleLogout" class="themed-button logout-button-stats">
        Kilépés
      </button>
    </div>
  </div>
  <hr v-if="stats || authStore.isAuthenticated" class="stats-hr" />
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
const handleDashboard = () => {
  router.push({ name: 'dashboard' })
}

  </script>
  
  <style scoped>
.stats-bar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,0,0,0.25); /* Sötétebb, áttetsző sáv */
  padding: 10px 20px;
  border-radius: 6px;
  margin-bottom: 0; /* Az hr adja a térközt */
  border: 1px solid var(--panel-border);
  flex-wrap: wrap;
  gap: 10px; /* Térköz a statok és a gombok között, ha tördelődik */
}
.stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0 12px; /* Térköz a statok között */
  color: var(--text-secondary);
}
.stats-bar span {
  font-weight: 500; /* Normál vastagság, a szín kiemeli */
  font-size: 0.9em;
  white-space: nowrap;
  color: var(--text-primary); /* Jól olvasható legyen */
}
.stats-bar span:not(:first-child)::before {
    content: "|"; /* Elválasztó */
    margin-right: 12px;
    color: var(--text-secondary);
    opacity: 0.5;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* .themed-button stílus a GameView-ból (vagy globálisból) öröklődhet,
   vagy itt definiáljuk újra/felülírjuk. */
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
.admin-button-stats {
  background-color: var(--accent-secondary); /* Bronzosabb */
}
.admin-button-stats:hover {
  background-color: var(--accent-primary);
  transform: translateY(-1px);
}
.logout-button-stats {
  background-color: #6c757d; /* Szürke */
   color: white;
}
.logout-button-stats:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.stats-hr {
  margin-top: 15px; /* Térköz a sáv után */
  margin-bottom: 25px;
  border: 0;
  border-top: 1px solid var(--panel-border);
  opacity: 0.5;
}
  </style>