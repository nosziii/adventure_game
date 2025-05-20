import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useGameStore } from "../stores/game";

import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import GameView from "../views/GameView.vue";

import AdminDashboardView from "../views/admin/AdminDashboardView.vue"; // Placeholder kezdőoldal
import AdminNodeListView from "../views/admin/nodes/AdminNodeListView.vue"; // Node lista nézet
import AdminNodeEditView from "../views/admin/nodes/AdminNodeEditView.vue"; // Node szerkesztő nézet

import AdminChoiceListView from "../views/admin/choices/AdminChoiceListView.vue";
import AdminChoiceEditView from "../views/admin/choices/AdminChoiceEditView.vue";

import AdminItemListView from "../views/admin/items/AdminItemListView.vue";
import AdminItemEditView from "../views/admin/items/AdminItemEditView.vue";

import AdminEnemyListView from "../views/admin/enemies/AdminEnemyListView.vue";
import AdminEnemyEditView from "../views/admin/enemies/AdminEnemyEditView.vue";

import AdminStoryListView from "../views/admin/stories/AdminStoryListView.vue";
import AdminStoryEditView from "../views/admin/stories/AdminStoryEditView.vue";

import AdminMapView from "../views/admin/map/AdminMapView.vue";

import DashboardView from "../views/DashboardView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // HTML5 history mód
  routes: [
    // Ide definiáljuk az útvonalakat
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/dashboard", // <-- ÚJ DASHBOARD ÚTVONAL
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
    },
    {
      path: "/game", // A játék fő útvonala
      name: "game",
      component: GameView,
      meta: { requiresAuth: true },
    },
    // --- ADMIN ÚTVONALAK ---
    {
      path: "/admin",
      // component: AdminLayout, // Opcionális keret komponens
      meta: { requiresAdmin: true }, // Jelöljük, hogy admin jog kell
      children: [
        { path: "", name: "admin-dashboard", component: AdminDashboardView }, // /admin
        {
          path: "nodes",
          name: "admin-nodes-list",
          component: AdminNodeListView,
        }, // /admin/nodes
        {
          path: "nodes/new",
          name: "admin-nodes-new",
          component: AdminNodeEditView,
        },
        {
          path: "nodes/:id/edit",
          name: "admin-nodes-edit",
          component: AdminNodeEditView,
        },
        {
          path: "choices",
          name: "admin-choices-list",
          component: AdminChoiceListView,
        },
        {
          path: "choices/new",
          name: "admin-choices-new",
          component: AdminChoiceEditView,
        },
        {
          path: "choices/:id/edit",
          name: "admin-choices-edit",
          component: AdminChoiceEditView,
        },
        {
          path: "items",
          name: "admin-items-list",
          component: AdminItemListView,
        },
        {
          path: "items/new",
          name: "admin-items-new",
          component: AdminItemEditView,
        },
        {
          path: "items/:id/edit",
          name: "admin-items-edit",
          component: AdminItemEditView,
        },
        {
          path: "enemies",
          name: "admin-enemies-list",
          component: AdminEnemyListView,
        },
        {
          path: "enemies/new",
          name: "admin-enemies-new",
          component: AdminEnemyEditView,
        },
        {
          path: "enemies/:id/edit",
          name: "admin-enemies-edit",
          component: AdminEnemyEditView,
        },
        { path: "map", name: "admin-map-view", component: AdminMapView },
        {
          path: "stories",
          name: "admin-stories-list",
          component: AdminStoryListView,
        },
        {
          path: "stories/new",
          name: "admin-stories-new",
          component: AdminStoryEditView,
        },
        {
          path: "stories/:id/edit",
          name: "admin-stories-edit",
          component: AdminStoryEditView,
        },
      ],
    },
  ],
});

router.beforeEach(async (to: RouteLocationNormalized, from, next) => {
  const authStore = useAuthStore();
  const gameStore = useGameStore(); // Szükségünk lesz rá a currentNode ellenőrzéséhez

  // Biztosítjuk, hogy az auth állapot (user adatok, role) betöltődjön, ha van token
  if (authStore.token && !authStore.user && !authStore.isLoadingUser) {
    console.log(
      "[Guard] User data not loaded from token, running checkAuth..."
    );
    try {
      await authStore.checkAuth();
      console.log(
        "[Guard] checkAuth completed in guard. User role:",
        authStore.user
      );
      // Ha a checkAuth után még mindig nincs user, az probléma lehet (pl. token lejárt)
      // Ezt az authStore.isAuthenticated már figyelembe veszi
    } catch (e) {
      console.error("[Guard] Error during checkAuth, logging out:", e);
      // Hiba esetén kijelentkeztetjük, a további logika kezeli a loginra irányítást
      // Nincs szükség itt explicit next({name: 'login'})-re, mert az isAuthenticated false lesz
    }
  }

  // Friss állapotok kiolvasása az esetleges checkAuth után
  const isAuthenticated = authStore.isAuthenticated;
  const isAdmin = authStore.isAdmin;
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);

  console.log(
    `[Guard Decision] Path: ${to.path} (Name: ${String(
      to.name
    )}) | reqAuth: ${requiresAuth} | reqAdmin: ${requiresAdmin} | isAuth: ${isAuthenticated} | isAdmin: ${isAdmin} | gameNode: ${
      gameStore.currentNode?.id
    }`
  );

  // 1. Ha admin oldalt akar elérni
  if (requiresAdmin) {
    if (isAuthenticated && isAdmin) {
      console.log("[Guard] Admin access GRANTED.");
      next(); // Admin és be van lépve -> mehet
    } else if (isAuthenticated && !isAdmin) {
      console.log(
        "[Guard] Admin access DENIED (not admin). Redirecting to dashboard."
      );
      next({ name: "dashboard" }); // Be van lépve, de nem admin -> dashboard
    } else {
      console.log(
        "[Guard] Admin access DENIED (not authenticated). Redirecting to login."
      );
      next({ name: "login", query: { redirect: to.fullPath } }); // Nincs bejelentkezve -> login
    }
  }
  // 2. Ha bejelentkezett felhasználó a login vagy register oldalra téved
  else if ((to.name === "login" || to.name === "register") && isAuthenticated) {
    console.log(
      "[Guard] User already authenticated. Redirecting from login/register to dashboard."
    );
    next({ name: "dashboard" }); // Mindig a dashboardra, onnan mehet adminba vagy játékba
  }
  // 3. Ha "sima" védett oldalt akar elérni (ami nem admin, pl. /dashboard, /game)
  else if (requiresAuth) {
    if (isAuthenticated) {
      // Speciális ellenőrzés a /game útvonalra: csak akkor engedjük, ha van aktív játék
      if (to.name === "game") {
        // Ha a gameStore még tölti az adatokat, várjunk (ezt az App.vue onMounted kezeli jobban)
        // Itt feltételezzük, hogy az App.vue onMounted már lefutott és a gameStore állapota releváns
        if (!gameStore.currentNode && !gameStore.isLoading) {
          // és nem épp tölt
          console.log(
            "[Guard] Accessing /game but no active story (no currentNode). Redirecting to dashboard."
          );
          next({ name: "dashboard" });
        } else {
          console.log("[Guard] Authenticated access to /game GRANTED.");
          next(); // Van aktív játék, vagy épp tölt -> engedjük
        }
      } else {
        // Más védett oldal (pl. /dashboard)
        console.log("[Guard] Authenticated access GRANTED.");
        next();
      }
    } else {
      console.log(
        "[Guard] Authenticated access DENIED (not authenticated). Redirecting to login."
      );
      next({ name: "login", query: { redirect: to.fullPath } }); // Nincs bejelentkezve -> login
    }
  }
  // 4. Publikus oldalak (ha lennének, a login/register már le van kezelve)
  else {
    console.log("[Guard] Public route or unhandled case. Allowing navigation.");
    next();
  }
});

export default router;
