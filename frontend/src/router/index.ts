import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

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

import AdminMapView from "../views/admin/map/AdminMapView.vue";

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
      ],
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Ha van token, de a user adatok még nincsenek betöltve ÉS nem fut már a betöltés
  if (authStore.token && !authStore.user && !authStore.isLoadingUser) {
    console.log(
      "[Guard] User data not loaded, token exists. Running checkAuth..."
    );
    try {
      await authStore.checkAuth(); // Megvárjuk, amíg a user adatok (és a role) betöltődnek
      console.log(
        "[Guard] checkAuth completed inside guard. User role:",
        authStore.user
      );
    } catch (e) {
      console.error("[Guard] Error during checkAuth in guard, logging out:", e);
      authStore.logout();
      if (to.name !== "login") {
        next({ name: "login", query: { redirect: to.fullPath } });
        return; // Fontos a return
      }
      // Ha már a login oldalon voltunk és hiba történt, ne csináljunk semmit (vagy next())
      // De a logout miatt valószínűleg a requiresAuth ág fogja elkapni
    }
  }

  // Most olvassuk ki a (potenciálisan frissített) állapotokat
  const isAuthenticated = authStore.isAuthenticated;
  const isAdmin = authStore.isAdmin;
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);

  console.log(
    `[Guard Decision] Path: ${to.path} | reqAuth: ${requiresAuth} | reqAdmin: ${requiresAdmin} | isAuth: ${isAuthenticated} | isAdmin: ${isAdmin}`
  );

  if (requiresAdmin) {
    if (isAuthenticated && isAdmin) {
      next();
    } else {
      next({ name: "login", query: { redirect: to.fullPath } });
    }
  } else if (requiresAuth) {
    if (isAuthenticated) {
      next();
    } else {
      next({ name: "login", query: { redirect: to.fullPath } });
    }
  } else if (
    (to.name === "login" || to.name === "register") &&
    isAuthenticated
  ) {
    next(isAdmin ? { name: "admin-dashboard" } : { name: "game" });
  } else {
    next();
  }
});

export default router;
