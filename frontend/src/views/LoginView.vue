<template>
    <div class="wrapper">
      <span class="bg-animate"></span>
      <span class="bg-animate2"></span>
  
      <div class="container">
        <form @submit.prevent="handleLogin">
          <p class="animation" :style="animStyle(0, 21)">Bejelentkezés</p>
  
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
            class="animation"
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
  
          <p class="animation" :style="animStyle(5, 26)">
            Nincs még fiókod?
            <router-link class="link" to="/register">Regisztrálj itt!</router-link>
          </p>
        </form>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
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
      await authStore.login({
        email: email.value,
        password: password.value
      })
      router.push('/')
    } catch (error: any) {
      errorMessage.value =
        error.response?.data?.message || 'A bejelentkezés sikertelen.'
      console.error('Login failed:', error)
    } finally {
      loading.value = false
    }
  }
  
  const animStyle = (i: number, j: number) => ({
    '--i': i,
    '--j': j
  })
  </script>
  
  <style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');
  
  body,
  .wrapper {
    background: linear-gradient(to right, #3F5EFB, #FC466B);
    font-family: 'Montserrat', sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .container {
    position: relative;
  }
  
  form {
    background: rgba(255, 255, 255, 0.06);
    padding: 3em;
    border-radius: 20px;
    border-left: 1px solid rgba(255, 255, 255, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    box-shadow: 20px 20px 40px -6px rgba(0, 0, 0, 0.2);
    text-align: center;
    width: 100%;
    max-width: 350px;
    transition: all 0.2s ease-in-out;
  }
  
  form p {
    font-weight: 500;
    color: #fff;
    opacity: 0.7;
    font-size: 1.2rem;
    margin: 0 0 1.5rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  form input {
    background: transparent;
    width: 100%;
    padding: 1em;
    margin-bottom: 1.5em;
    border: none;
    border-left: 1px solid rgba(255, 255, 255, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 5000px;
    backdrop-filter: blur(5px);
    color: #fff;
    font-weight: 500;
    font-family: Montserrat, sans-serif;
    transition: all 0.2s ease-in-out;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  form button {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 5000px;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    backdrop-filter: blur(5px);
    transition: 0.3s ease;
  }
  
  form button:disabled {
    background-color: #999;
    cursor: not-allowed;
  }
  
  form button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.4);
  }
  
  .link {
    color: #ddd;
    font-size: 12px;
    text-decoration: none;
  }
  
  .link:hover {
    text-shadow: 2px 2px 6px #00000040;
  }
  
  .error-message {
    color: red;
    font-size: 14px;
    margin-top: 1rem;
  }
  
  /* Background animation */
  .bg-animate,
  .bg-animate2 {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 1%, transparent 100%);
    animation: float 10s infinite alternate;
    pointer-events: none;
  }
  
  .bg-animate2 {
    animation-delay: 5s;
  }
  
  @keyframes float {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(-50px, -50px);
    }
  }
  
  /* Fade animation */
  .animation {
    opacity: 0;
    animation: fadeIn 0.6s forwards;
    animation-delay: calc(var(--i) * 0.2s + var(--j) * 0.02s);
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  </style>
  