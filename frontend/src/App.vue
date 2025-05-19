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

const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  await authStore.checkAuth()
  console.log('Initial auth check complete in App.vue.')
})

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
