<template>
  <header class="app-header">
    <div class="logo-container">
      <router-link :to="{ name: 'dashboard' }" class="logo">KALANDJÁTÉK</router-link>
      </div>
    <nav class="main-navigation">
      <a @click="scrollToSection('stories-section')">Kalandok</a>
      <a @click="scrollToSection('gallery-teaser-section')">Galéria</a>
      <a @click="scrollToSection('character-slider-section')">Hősök</a>
      <a @click="scrollToSection('features-section')">Jellemzők</a>
      </nav>
    <div>
        <button v-if="authStore.isAuthenticated && authStore.isAdmin" @click="goToAdminPanel" class="btn-admin-header">Admin</button>
        <button @click="toggleDarkMode" class="dark-mode-toggle">
            {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
        <button v-if="authStore.isAuthenticated" @click="handleLogout" class="btn-logout-header">Kilépés</button>
        <router-link v-if="!authStore.isAuthenticated" :to="{ name: 'login' }" class="btn-login-header">Belépés</router-link>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute} from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const isDarkMode = ref(true); // Alapértelmezetten sötét

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('light-mode', !isDarkMode.value);
  localStorage.setItem('darkMode', isDarkMode.value.toString());
};

const handleLogout = () => {
    authStore.logout();
    router.push({ name: 'login' });
};
const goToAdminPanel = () => router.push({name: 'admin-dashboard'});

const scrollToSection = (sectionId: string) => {
  // Ha nem a dashboard oldalon vagyunk, először navigáljunk oda,
  // majd a nextTick után görgessünk (vagy a router hash módjával).
  // Egyszerűbb eset: feltételezzük, hogy ezek a linkek csak a dashboardon látszanak/relevánsak.
  if (route.name === 'dashboard' || route.path === '/dashboard') { // Vagy a dashboard route neve
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  } else {
    // Ha más oldalon vagyunk, előbb navigáljunk a dashboardra a hash-sel
    router.push({ name: 'dashboard', hash: `#${sectionId}` });
  }
};

onMounted(() => {
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedDarkMode = localStorage.getItem('darkMode');
  if (storedDarkMode !== null) {
    isDarkMode.value = storedDarkMode === 'true';
  } else {
    isDarkMode.value = prefersDark; // Rendszerbeállítás használata, ha nincs tárolt
  }
  document.body.classList.toggle('light-mode', !isDarkMode.value);
});
</script>

<style scoped>
.app-header {
  position: fixed; /* Vagy fixed, ha mindig látszódjon görgetésnél */
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem; /* A HTML-ből */
  color: var(--text);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Finom elválasztó */
  /* background: rgba(0,0,0,0.2); */
  background: var(--header-bg, rgba(5,5,15,0.85)); /* Háttér a sticky headernek, hogy ne legyen átlátszó */
  backdrop-filter: blur(5px); /* Finom blur a sticky header mögött */
  z-index: 900; /* Alacsonyabb, mint a minimap */
}
.main-navigation a { /* Legyenek gomb-szerűbbek vagy sima linkek */
  cursor: pointer;
  margin-left: 20px;
  /* ...többi stílus... */
}
.btn-admin-header, .btn-login-header {
    background-color: var(--accent);
    color: var(--button-text);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s;
    margin-left: 15px;
    font-weight: bold;
}
.btn-admin-header:hover, .btn-login-header:hover {
    background-color: #e04e00;
}

.logo-container {
    /* Stílus a logónak, ha kell */
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--accent);
  text-decoration: none;
}
/* .logo-subtitle { display: block; font-size: 0.8em; color: var(--text); } */

.main-navigation a, .btn-logout-header {
  text-decoration: none;
  color: var(--text);
  font-weight: 500; /* HTML-ből bold volt, itt kicsit finomabb */
  margin-left: 20px;
  transition: color 0.3s ease;
}
.main-navigation a:hover, .btn-logout-header:hover {
  color: var(--accent);
}
.btn-logout-header {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
}

.dark-mode-toggle {
  background: var(--accent);
  color: var(--button-text);
  border: none;
  padding: 0.4rem 0.9rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s;
}
.dark-mode-toggle:hover {
  background-color: #e04e00; /* Sötétebb narancs hoverre */
}
</style>