import { defineStore } from "pinia";
import apiClient from "../services/api";
import type {
  User,
  LoginCredentials,
  ArchetypeForSelection,
} from "../types/auth.types";

interface RegisterData extends LoginCredentials {}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("authToken") || (null as string | null),
    user: null as User | null,
    isLoadingUser: false,
    loginError: null,
    registerError: null,
    availableArchetypes: [] as ArchetypeForSelection[],
    isLoadingArchetypes: false,
    archetypeSelectionError: null as string | null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    getToken: (state): string | null => state.token,
    getUser: (state): User | null => state.user,
    isAdmin: (state): boolean => state.user?.role === "admin",
    getAvailableArchetypes: (state): ArchetypeForSelection[] =>
      state.availableArchetypes,
    getIsLoadingArchetypes: (state): boolean => state.isLoadingArchetypes,
    getArchetypeSelectionError: (state): string | null =>
      state.archetypeSelectionError,
  },

  actions: {
    // --- Login Akció ---
    async login(credentials: LoginCredentials) {
      // this.loading = true;
      // this.error = null;
      try {
        console.log("Attempting login via API...");
        // Használd az apiClient-et a POST kéréshez
        const response = await apiClient.post<{ access_token: string }>(
          "/auth/login", // Az alap URL ("/api") már be van állítva az apiClient-ben
          credentials
        );

        const token = response.data.access_token;
        if (token) {
          this.token = token;
          localStorage.setItem("authToken", token);
          console.log("Login successful, token stored.");

          // Sikeres bejelentkezés után próbáljuk meg lekérni a felhasználói adatokat
          // Az Axios interceptor automatikusan hozzáadja a tokent ehhez a kéréshez
          await this.fetchUser();
        } else {
          // Ez valószínűleg nem fordul elő, ha a backend helyesen adja vissza a tokent
          console.error("Login failed: No token received in response.");
          throw new Error("Login failed: No token received");
        }
      } catch (error: any) {
        console.error("Login action failed:", error);
        this.logout(); // Hiba esetén kijelentkeztetünk
        throw error; // Továbbadjuk a hibát a komponensnek
      } finally {
        // this.loading = false;
      }
    },

    // --- Register Akció ---
    async register(userData: RegisterData): Promise<boolean> {
      // Jelezzük a sikert boolean-nel
      // this.loading = true;
      // this.error = null;
      try {
        console.log("Attempting registration via API...");
        // Használd az apiClient-et
        await apiClient.post("/auth/register", userData);
        console.log("Registration successful via API.");
        // Itt dönthetsz: vagy automatikus login, vagy csak siker jelzése.
        // Maradjunk a siker jelzésénél egyelőre.
        return true; // Sikert jelzünk
      } catch (error: any) {
        console.error("Registration action failed:", error);
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
      localStorage.removeItem("authToken");
      console.log("User logged out.");
      // Itt lehetne átirányítás is:
      // import router from '@/router'; // Importáld a routert
      // router.push('/login');
    },

    // --- Felhasználói adatok lekérése ---
    async fetchUser() {
      this.isLoadingUser = true;
      if (!this.token) {
        console.log("fetchUser skipped: No token found.");
        this.isLoadingUser = false;
        return;
      }
      // this.loading = true; // Jelezhetjük, hogy töltünk
      try {
        console.log("Attempting to fetch user data via API...");
        // Itt hívjuk meg a védett végpontot a felhasználói adatokért
        // Az interceptor hozzáadja a 'Bearer <token>' fejlécet
        // FONTOS: A backend oldalon kell egy '/users/me' (vagy hasonló) végpont,
        // ami visszaadja a bejelentkezett felhasználó adatait a token alapján!
        const response = await apiClient.get<User>("/users/me"); // <-- Backend végpont kell!

        this.user = response.data; // Tároljuk a kapott felhasználói adatokat
        console.log("User data fetched successfully:", this.user);
      } catch (error: any) {
        // Az Axios interceptorunk már kezeli a 401-es hibát (logout),
        // de itt is logolhatunk vagy specifikusabban kezelhetünk más hibákat.
        console.error("fetchUser action failed:", error);
        // Ha a hiba nem 401 volt, lehet, hogy csak a user adatokat nullázzuk,
        // de a token maradhatna - ez üzleti logikától függ.
        // Az interceptor logout-ja biztonságosabb alapértelmezés.
        // this.user = null; // Vagy logout hívása itt is a biztonság kedvéért
      } finally {
        this.isLoadingUser = false;
      }
    },

    // --- Auth ellenőrzés az app indulásakor ---
    async checkAuth() {
      this.isLoadingUser = true;
      console.log("checkAuth called.");
      if (this.token && !this.user) {
        // Ha van token, de nincs user adat (pl. oldalfrissítés után),
        // próbáljuk meg lekérni a felhasználót
        console.log("Token found in storage, attempting to fetch user...");
        await this.fetchUser();
      } else if (this.token && this.user) {
        this.isLoadingUser = false;
        console.log("User is already authenticated.");
      } else {
        this.isLoadingUser = false;
        console.log("No active session found.");
      }
    },
    _setUserAndToken(token: string | null, userData: User | null) {
      this.user = userData;
      this.token = token;
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
      apiClient.defaults.headers.common["Authorization"] = token
        ? `Bearer ${token}`
        : "";
    },
    async fetchSelectableArchetypes() {
      console.log("Attempting to set isLoadingArchetypes to true");
      try {
        this.isLoadingArchetypes = true;
        this.isLoadingArchetypes = true;
        console.log("isLoadingArchetypes SET to true successfully");
      } catch (e) {
        console.error(
          "ERROR directly when setting isLoadingArchetypes to true:",
          e
        );
      }
      this.archetypeSelectionError = null;
      try {
        const response = await apiClient.get<ArchetypeForSelection[]>(
          "/character/archetypes"
        );
        this.availableArchetypes = response.data;
      } catch (err: any) {
        this.archetypeSelectionError =
          err.response?.data?.message ||
          "Nem sikerült betölteni a karaktertípusokat.";
        this.availableArchetypes = [];
      } finally {
        this.isLoadingArchetypes = false;
      }
    },

    async selectAndSaveArchetype(archetypeId: number): Promise<boolean> {
      if (!this.user) {
        this.archetypeSelectionError =
          "Nincs bejelentkezett felhasználó az archetípus választáshoz."; // Ez most már helyes
        return false;
      }
      this.isLoadingUser = true; // Vagy egy külön loading flag az archetípus mentéséhez
      this.archetypeSelectionError = null;
      try {
        // Hívjuk a backendet, ami frissíti a characters.selected_archetype_id-t
        // és visszaadja a frissített User objektumot
        const response = await apiClient.post<User>(
          `/character/select-archetype`,
          { archetypeId }
        );

        // Frissítjük a user objektumot a store-ban, hogy a selected_archetype_id benne legyen
        this.user = response.data; // Feltételezve, hogy a UserDto-t adja vissza a backend

        console.log(
          `Archetype ${archetypeId} selected and saved for user ${this.user?.id}`
        );
        return true;
      } catch (err: any) {
        this.archetypeSelectionError =
          err.response?.data?.message ||
          "Nem sikerült elmenteni a karaktertípus választást.";
        return false;
      } finally {
        this.isLoadingUser = false;
      }
    },
  },
});
