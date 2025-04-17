import { defineStore } from 'pinia';
import apiClient from '../services/api'

// Interfészek maradnak (vagy pontosítsd őket a backend válaszai alapján)
interface User {
  id: number;
  email: string;
  // ...további adatok...
}
interface LoginCredentials { email: string; password: string; }
interface RegisterData extends LoginCredentials { /* ...további adatok... */ }

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('authToken') || null as string | null,
    user: null as User | null,
    // loading: false,
    // error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    getToken: (state): string | null => state.token,
    getUser: (state): User | null => state.user,
  },

  actions: {
    // --- Login Akció ---
    async login(credentials: LoginCredentials) {
      // this.loading = true;
      // this.error = null;
      try {
        console.log('Attempting login via API...');
        // Használd az apiClient-et a POST kéréshez
        const response = await apiClient.post<{ access_token: string }>(
            '/auth/login', // Az alap URL ("/api") már be van állítva az apiClient-ben
            credentials
        );

        const token = response.data.access_token;
        if (token) {
          this.token = token;
          localStorage.setItem('authToken', token);
          console.log('Login successful, token stored.');

          // Sikeres bejelentkezés után próbáljuk meg lekérni a felhasználói adatokat
          // Az Axios interceptor automatikusan hozzáadja a tokent ehhez a kéréshez
          await this.fetchUser();

        } else {
          // Ez valószínűleg nem fordul elő, ha a backend helyesen adja vissza a tokent
          console.error('Login failed: No token received in response.');
          throw new Error('Login failed: No token received');
        }

      } catch (error: any) {
        console.error('Login action failed:', error);
        this.logout(); // Hiba esetén kijelentkeztetünk
        throw error; // Továbbadjuk a hibát a komponensnek
      } finally {
        // this.loading = false;
      }
    },

    // --- Register Akció ---
    async register(userData: RegisterData): Promise<boolean> { // Jelezzük a sikert boolean-nel
      // this.loading = true;
      // this.error = null;
      try {
        console.log('Attempting registration via API...');
        // Használd az apiClient-et
        await apiClient.post('/auth/register', userData);
        console.log('Registration successful via API.');
        // Itt dönthetsz: vagy automatikus login, vagy csak siker jelzése.
        // Maradjunk a siker jelzésénél egyelőre.
        return true; // Sikert jelzünk

      } catch (error: any) {
        console.error('Registration action failed:', error);
        // this.error = error.response?.data?.message || 'Registration failed';
        throw error; // Továbbadjuk a hibát
      } finally {
        // this.loading = false;
      }
    },

    // --- Logout Akció ---
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('authToken');
      console.log('User logged out.');
      // Itt lehetne átirányítás is:
      // import router from '@/router'; // Importáld a routert
      // router.push('/login');
    },

    // --- Felhasználói adatok lekérése ---
    async fetchUser() {
      if (!this.token) {
          console.log('fetchUser skipped: No token found.');
          return;
      }
      // this.loading = true; // Jelezhetjük, hogy töltünk
      try {
        console.log('Attempting to fetch user data via API...');
        // Itt hívjuk meg a védett végpontot a felhasználói adatokért
        // Az interceptor hozzáadja a 'Bearer <token>' fejlécet
        // FONTOS: A backend oldalon kell egy '/users/me' (vagy hasonló) végpont,
        // ami visszaadja a bejelentkezett felhasználó adatait a token alapján!
        const response = await apiClient.get<User>('/users/me'); // <-- Backend végpont kell!

        this.user = response.data; // Tároljuk a kapott felhasználói adatokat
        console.log('User data fetched successfully:', this.user);

      } catch (error: any) {
        // Az Axios interceptorunk már kezeli a 401-es hibát (logout),
        // de itt is logolhatunk vagy specifikusabban kezelhetünk más hibákat.
        console.error('fetchUser action failed:', error);
        // Ha a hiba nem 401 volt, lehet, hogy csak a user adatokat nullázzuk,
        // de a token maradhatna - ez üzleti logikától függ.
        // Az interceptor logout-ja biztonságosabb alapértelmezés.
        // this.user = null; // Vagy logout hívása itt is a biztonság kedvéért
      } finally {
        // this.loading = false;
      }
    },

    // --- Auth ellenőrzés az app indulásakor ---
    async checkAuth() {
        console.log('checkAuth called.');
        if (this.token && !this.user) {
            // Ha van token, de nincs user adat (pl. oldalfrissítés után),
            // próbáljuk meg lekérni a felhasználót
            console.log('Token found in storage, attempting to fetch user...');
            await this.fetchUser();
        } else if (this.token && this.user) {
            console.log('User is already authenticated.');
        } else {
            console.log('No active session found.');
        }
    }
  },
});