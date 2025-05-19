<template>
  <div class="wrapper">
    <span class="bg-animate"></span>
    <span class="bg-animate2"></span>

    <div class="container">
      <form @submit.prevent="handleRegister">
        <p class="form-title animation" :style="animStyle(0, 0)">Regisztráció</p>

        <div class="form-group animation" :style="animStyle(1, 0)">
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="Email cím"
          />
        </div>
        <div class="form-group animation" :style="animStyle(2, 0)">
          <input
            type="password"
            id="passwordConfirm"
            v-model="passwordConfirm"
            required
            placeholder="Jelszó megerősítése"
          />
        </div>
          <div class="form-group animation" :style="animStyle(3, 0)">
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Jelszó (minimum 6 karakter)"
          />
        </div>
        <div class="form-actions animation" :style="animStyle(4,0)">
          <button type="submit" :disabled="loading" class="form-button">
            {{ loading ? 'Regisztráció...' : 'Regisztráció' }}
          </button>
        </div>

        <p v-if="errorMessage" class="error-message animation" :style="animStyle(5,0)">
            {{ errorMessage }}
        </p>

        <p class="form-footer-text animation" :style="animStyle(6,0)">
          Van már fiókod? <router-link class="link" to="/login">Jelentkezz be itt!</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth'; // Igazítsd az útvonalat, ha kell

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const passwordConfirm = ref(''); // Ha használod
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const handleRegister = async () => {
  loading.value = true;
  errorMessage.value = null;

  if (password.value !== passwordConfirm.value) {
    errorMessage.value = 'A két jelszó nem egyezik!';
    loading.value = false;
    return;
  }
  // Ha a backend validálja a jelszó hosszát, itt nem feltétlenül kell.

  try {
    const success = await authStore.register({
      email: email.value,
      password: password.value,
    });

    if (success) {
      console.log('Registration successful, navigating to login...');
      // Opcionális: Jeleníts meg egy üzenetet a login oldalon a sikeres regisztrációról
      // pl. router.push({ name: 'login', query: { registered: 'true' } });
      // És a LoginView onMounted-ban ezt ellenőrizhetnéd és kiírhatnál egy üzenetet.
      router.push({ name: 'login' });
    }
  } catch (error: any) { // Ez a catch ág valószínűleg nem fut le, ha a store már kezeli
    errorMessage.value = error.response?.data?.message || 'A regisztráció sikertelen.';
    console.error('Register failed in component:', error);
  } finally {
    loading.value = false;
  }
};

// Animációhoz CSS változók beállítása
const animStyle = (i: number, j: number = 0) => ({ // j default értékkel
  '--i': i,
  '--j': j
});
</script>

<style scoped>
/* Átvesszük a LoginView.vue stílusait, kisebb módosításokkal, ha kellenek */

.wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  /* A háttér a globális body stílusból jön (var(--bg)) */
}

.container {
  position: relative;
  z-index: 1;
}

form {
  background: var(--panel-bg);
  padding: 2.5em 3em;
  border-radius: 15px;
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(8px);
  box-shadow: 0px 15px 35px -10px rgba(0, 0, 0, 0.5);
  text-align: center;
  width: 100%;
  max-width: 400px; /* Ugyanaz, mint a Login */
}

.form-title {
  font-family: 'Cinzel Decorative', cursive;
  font-weight: 700;
  color: var(--accent-primary);
  font-size: 1.8em;
  margin-bottom: 1.5em;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.4);
}

.form-footer-text {
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 1.5rem;
}

.form-group { /* Hozzáadtam ezt a class-t a jobb tagolásért */
  margin-bottom: 1.5em;
}

.form-group label { /* Ha mégis kellenének a labelek */
  display: block;
  text-align: left;
  margin-bottom: 0.5em;
  color: var(--text-secondary);
  font-size: 0.9em;
}

form input[type="email"],
form input[type="password"] {
  background: var(--input-bg);
  width: 100%;
  padding: 1em;
  /* margin-bottom: 1.5em; A form-group adja a térközt */
  border: 1px solid var(--input-border);
  border-radius: 8px;
  color: var(--input-text);
  font-weight: 500;
  font-family: 'EB Garamond', serif;
  font-size: 1em;
  transition: border-color 0.3s ease, background-color 0.3s ease;
}

form input::placeholder {
  color: var(--placeholder-text);
  opacity: 0.8;
}

form input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--input-focus-border);
  outline: none;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.form-actions { /* Hozzáadtam ezt a class-t a gomb köré */
    margin-top: 2em; /* Nagyobb térköz a gomb előtt */
}

.form-button { /* Univerzálisabb class név a gombnak */
  width: 100%;
  padding: 0.8em 1em;
  border: none;
  border-radius: 8px;
  background: var(--button-bg);
  color: var(--button-text);
  font-weight: bold;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 1em;
  transition: background-color 0.3s ease, transform 0.1s ease;
}

.form-button:disabled {
  background-color: #555;
  opacity: 0.6;
  cursor: not-allowed;
}

.form-button:hover:not(:disabled) {
  background: var(--button-hover-bg);
  transform: translateY(-1px);
}
.form-button:active:not(:disabled) {
    transform: translateY(0px);
}

.link {
  color: var(--accent-secondary);
  font-weight: bold;
  font-size: inherit;
}
.link:hover {
  text-decoration: underline;
  filter: brightness(1.2);
}

.error-message {
  color: #ff8080;
  font-size: 0.9em;
  margin-top: 1rem;
  background-color: rgba(255,0,0,0.1);
  padding: 0.5em;
  border-radius: 4px;
}

/* Background animation - Ugyanazok, mint a LoginView-nál */
.bg-animate,
.bg-animate2 {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
  background: radial-gradient(circle at var(--x) var(--y), rgba(var(--accent-rgb, 255, 92, 0), 0.1) 0%, transparent 40%);
  animation: float 15s infinite alternate linear;
  opacity: 0.7;
  --x: 50%;
  --y: 50%;
}

.bg-animate2 {
  animation-delay: -7.5s;
  animation-direction: alternate-reverse;
  background: radial-gradient(circle at var(--x) var(--y), rgba(var(--accent-secondary-rgb, 230, 167, 86), 0.08) 0%, transparent 35%);
}

@keyframes float {
  0% { --x: 10%; --y: 20%; opacity: 0.3; }
  25% { --x: 80%; --y: 70%; opacity: 0.7; }
  50% { --x: 30%; --y: 90%; opacity: 0.4; }
  75% { --x: 60%; --y: 10%; opacity: 0.6; }
  100% { --x: 10%; --y: 20%; opacity: 0.3; }
}

/* Fade animation - Ugyanazok, mint a LoginView-nál */
.animation {
  opacity: 0;
  animation: fadeIn 0.6s forwards;
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>