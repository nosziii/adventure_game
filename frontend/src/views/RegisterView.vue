<template>
    <div class="register-view">
      <h1>Regisztráció</h1>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="email">Email cím:</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="pelda@email.com"
          />
        </div>
        <div class="form-group">
          <label for="password">Jelszó:</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Minimum 6 karakter"
          />
        </div>
         <div class="form-actions">
          <button type="submit" :disabled="loading">
            {{ loading ? 'Regisztráció...' : 'Regisztráció' }}
          </button>
        </div>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </form>
       <p>
         Van már fiókod? <router-link to="/login">Jelentkezz be itt!</router-link>
       </p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'; // Vagy relatív útvonal
  
  const authStore = useAuthStore();
  const router = useRouter();
  
  const email = ref('');
  const password = ref('');
  // const passwordConfirm = ref(''); // Ha használod a jelszó megerősítést
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);
  
  const handleRegister = async () => {
    loading.value = true;
    errorMessage.value = null;
  
    // Opcionális: Jelszó egyezés ellenőrzése
    // if (password.value !== passwordConfirm.value) {
    //   errorMessage.value = 'A két jelszó nem egyezik!';
    //   loading.value = false;
    //   return;
    // }
  
    try {
      // Meghívjuk a store register akcióját
      const success = await authStore.register({
        email: email.value,
        password: password.value,
        // Ha vannak további regisztrációs adatok, itt add át őket
      });
  
      if (success) {
        // Sikeres regisztráció után átirányítás a login oldalra
        // Vagy megjeleníthetsz egy üzenetet is
        console.log('Registration successful, navigating to login...');
        router.push('/login');
        // Opcionális: Jeleníts meg egy üzenetet a login oldalon, hogy sikeres volt a regisztráció
      }
      // A store akció hibakezelése már megtörténik, de itt is lehetne finomítani
  
    } catch (error: any) {
      errorMessage.value = error.response?.data?.message || 'A regisztráció sikertelen.';
      console.error('Register failed in component:', error);
    } finally {
      loading.value = false;
    }
  };
  </script>
  
  <style scoped>
  /* Használhatod ugyanazokat a stílusokat, mint a LoginView-nál,
     vagy másold át és módosítsd. A lényeg, hogy olvasható legyen. */
  .register-view {
    max-width: 400px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    text-align: center;
  }
  
  .form-group {
    margin-bottom: 15px;
    text-align: left;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
  }
  
  .form-group input {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
  }
  
  .form-actions button {
    padding: 10px 20px;
    background-color: #007bff; /* Kék */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .form-actions button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .form-actions button:not(:disabled):hover {
    background-color: #0056b3;
  }
  
  .error-message {
    color: red;
    margin-top: 15px;
  }
  
  p {
    margin-top: 20px;
  }
  </style>