// src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '../stores/auth'; // Importáljuk az auth store-t (az alias '@' működéséhez lehet, hogy be kell állítani a tsconfig/vite configban)
                                            // Vagy relatív útvonallal: '../stores/auth'

// Olvassuk ki az API alap URL-jét a környezeti változókból (ajánlott)
// Ehhez a frontend gyökerében kell lennie egy .env fájlnak (pl. .env.development)
// és benne: VITE_API_URL=http://localhost:3000/api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Hozzunk létre egy Axios instance-t
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // 'Accept': 'application/json' // Opcionális
  }
})

// Opcionális: Interceptor a token automatikus hozzáadásához
// Ez minden kérés előtt lefut
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore(); // Pinia store elérése
    const token = authStore.getToken; // Vagy state.token

    if (token) {
      // Ha van token, hozzáadjuk az Authorization fejlécet
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Továbbengedjük a kérést a módosított configgal
  },
  (error) => {
    // Kérés hiba esetén
    return Promise.reject(error);
  }
);

// Opcionális: Interceptor a válaszok kezelésére (pl. 401 hiba esetén logout)
apiClient.interceptors.response.use(
  (response) => {
    // Sikeres válasz esetén csak továbbadjuk
    return response;
  },
  (error) => {
    // Hiba esetén
    if (error.response && error.response.status === 401) {
      // Ha 401 Unauthorized hiba (lejárt/érvénytelen token)
      const authStore = useAuthStore();
      console.warn('Unauthorized request or token expired, logging out.');
      authStore.logout(); // Kijelentkeztetjük a felhasználót
      // Opcionálisan átirányítás a login oldalra
      // window.location.href = '/login'; // Vagy router.push('/login') ha a router elérhető itt
    }
    // Továbbadjuk a hibát, hogy a hívó helyen is el lehessen kapni
    return Promise.reject(error);
  }
);


export default apiClient; // Exportáljuk az alapértelmezett instance-t