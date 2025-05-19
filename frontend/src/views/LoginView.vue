<template>
  <div class="wrapper"> <span class="bg-animate"></span> <span class="bg-animate2"></span>

    <div class="container">
      <form @submit.prevent="handleLogin">
        <p class="form-title animation" :style="animStyle(0, 21)">Bejelentkezés</p>

        <input
          class="animation"
          :style="animStyle(1, 22)"
          type="email"
          v-model="email"
          required
          placeholder="Email cím"
        />

        <input
          class="animation"
          :style="animStyle(2, 23)"
          type="password"
          v-model="password"
          required
          placeholder="Jelszó"
        />

        <button
          class="form-button animation"
          :style="animStyle(3, 24)"
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Bejelentkezés...' : 'Bejelentkezés' }}
        </button>

        <p
          v-if="errorMessage"
          class="error-message animation"
          :style="animStyle(4, 25)"
        >
          {{ errorMessage }}
        </p>

        <p class="form-footer-text animation" :style="animStyle(5, 26)">
          Nincs még fiókod?
          <router-link class="link" to="/register">Regisztrálj itt!</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// A script rész változatlan maradhat, a #133-as válasz alapján
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = null
  try {
    await authStore.login({ email: email.value, password: password.value })
    if (authStore.isAdmin) {
      router.push({ name: 'admin-dashboard' })
    } else {
      router.push({ name: 'dashboard' })
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'A bejelentkezés sikertelen.'
    console.error('Login failed:', error)
  } finally {
    loading.value = false
  }
}
const animStyle = (i: number, j: number) => ({ '--i': i, '--j': j })
</script>

<style scoped>
/* A .wrapper itt már nem kell, ha a body stílusát használjuk globálisan.
   Ha mégis itt akarod felülírni a hátteret, akkor itt add meg.
   Most feltételezem, a body már a helyes hátteret adja. */
.wrapper {
  /* Ha a body-n van a fő háttér, ez lehet transparent vagy egy overlay */
  /* background: transparent; */
  /* De ha itt specifikus hátteret akarsz a login oldalnak, ami eltér a globálistól: */
  /* background: linear-gradient(to right, #232526, #414345); Sötétszürke átmenet pl. */
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px; /* Hogy mobilon ne érjen a széléhez az űrlap */
}

.container {
  position: relative;
  z-index: 1; /* Hogy a form az animációk felett legyen */
}

form {
  background: var(--panel-bg); /* CSS változó használata */
  padding: 2.5em 3em; /* Kicsit több padding */
  border-radius: 15px;
  border: 1px solid var(--panel-border); /* CSS változó */
  backdrop-filter: blur(8px); /* Kicsit kevesebb blur lehet jobb sötét témán */
  box-shadow: 0px 15px 35px -10px rgba(0, 0, 0, 0.5); /* Finomabb árnyék */
  text-align: center;
  width: 100%;
  max-width: 380px;
}

.form-title { /* Korábban form p:first-of-type */
  font-family: 'Cinzel Decorative', cursive;
  font-weight: 700;
  color: var(--accent-primary); /* Arany */
  font-size: 1.8em; /* Kicsit kisebb, ha a Cinzel Decorative túl nagy */
  margin-bottom: 1.5em;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.4);
}

.form-footer-text { /* Korábban form p */
  font-weight: 400; /* Normál vastagság */
  color: var(--text-secondary); /* Halványabb szöveg */
  font-size: 0.9rem;
  margin-top: 1.5rem;
}

form input {
  background: var(--input-bg); /* Sötét, enyhén áttetsző input háttér */
  width: 100%;
  padding: 1em;
  margin-bottom: 1.5em;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  color: var(--input-text); /* Fehér input szöveg */
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
  background: rgba(255, 255, 255, 0.08); /* Kicsit világosabb fókuszban */
  border-color: var(--input-focus-border); /* Kiemelő színnel */
  outline: none;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3); /* Finom arany glow */
}

.form-button { /* Korábban form button[type="submit"] */
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
  letter-spacing: 0.5px; /* Kisebb letter-spacing */
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
  font-size: inherit; /* Igazodjon a .form-footer-text-hez */
}
.link:hover {
  text-decoration: underline;
  filter: brightness(1.2);
}

.error-message {
  color: #ff8080; /* Világosabb piros sötét háttéren */
  font-size: 0.9em;
  margin-top: 1rem;
  background-color: rgba(255,0,0,0.1);
  padding: 0.5em;
  border-radius: 4px;
}

/* Background animation - ezek maradhatnak, ha tetszenek az új háttéren */
.bg-animate,
.bg-animate2 {
  position: fixed; /* Fixed, hogy a teljes viewportra vonatkozzon, ne csak a wrapperre */
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0; /* Legyen a form mögött */
  /* Az eredeti radial-gradient nagyon halvány volt, sötét háttéren lehet, hogy nem látszik jól.
     Próbálkozhatsz másfajta finom animációval, pl. lassan mozgó csillagok, köd stb.
     Vagy hagyd ki, ha a fő háttérkép/gradient elég. */
  background: radial-gradient(circle at var(--x) var(--y), rgba(var(--accent-rgb, 255, 92, 0), 0.1) 0%, transparent 40%);
  animation: float 15s infinite alternate linear;
  opacity: 0.7;
  --x: 50%; /* CSS változók az animációhoz */
  --y: 50%;
}

.bg-animate2 {
  animation-delay: -7.5s; /* Félidőben induljon a másik */
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


/* Fade animation (ez változatlan és jó) */
.animation {
  opacity: 0;
  animation: fadeIn 0.6s forwards;
  animation-delay: calc(var(--i) * 0.1s); /* Kicsit csökkentettem a delayt */
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>