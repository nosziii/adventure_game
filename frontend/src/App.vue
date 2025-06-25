<template>
 <main>
  <AppHeader v-if="showHeader"/>
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAuthStore } from './stores/auth'
import AppHeader from './components/AppHeader.vue'
import { RouterView, useRoute } from 'vue-router'
import { useGameStore } from './stores/game'


const route = useRoute()
// const router = useRouter();
const authStore = useAuthStore()
const gameStore = useGameStore()


onMounted(async () => {
  await authStore.checkAuth(); 
  console.log('[App.vue] Initial auth check complete. isAuthenticated:', authStore.isAuthenticated);

  if (authStore.isAuthenticated) {
    console.log('[App.vue] User authenticated, fetching initial game state...');
    await gameStore.fetchGameState();
    console.log('[App.vue] Initial game state fetch attempt complete. CurrentNode ID:', gameStore.currentNode?.id);
  }
});

const showHeader = computed(() => {
  // Azoknak az útvonalaknak a neve, ahol NEM akarjuk megjeleníteni a headert
  const nonHeaderRoutes = ['login', 'register', 'game'];
  // Ha az aktuális útvonal neve benne van a listában, akkor false, egyébként true
  return !nonHeaderRoutes.includes(route.name as string);
});
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
