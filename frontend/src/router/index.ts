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
import ArchetypeSelectionView from "../views/ArchetypeSelectionView.vue";

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

import AdminAbilityListView from "../views/admin/abilities/AdminAbilityListView.vue";
import AdminAbilityEditView from "../views/admin/abilities/AdminAbilityEditView.vue";

import AdminArchetypeListView from "../views/admin/archetypes/AdminArchetypeListView.vue";
import AdminArchetypeEditView from "../views/admin/archetypes/AdminArchetypeEditView.vue";

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
      meta: { requiresAuth: true },
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
    {
      path: "/select-archetype",
      name: "archetype-selection",
      component: ArchetypeSelectionView,
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
        {
          path: "abilities",
          name: "admin-abilities-list",
          component: AdminAbilityListView,
        },
        {
          path: "abilities/new",
          name: "admin-abilities-new",
          component: AdminAbilityEditView,
        },
        {
          path: "abilities/:id/edit",
          name: "admin-abilities-edit",
          component: AdminAbilityEditView,
        },
        {
          path: "archetypes",
          name: "admin-archetypes-list",
          component: AdminArchetypeListView,
        },
        {
          path: "archetypes/new",
          name: "admin-archetypes-new",
          component: AdminArchetypeEditView,
        },
        {
          path: "archetypes/:id/edit",
          name: "admin-archetypes-edit",
          component: AdminArchetypeEditView,
        },
      ],
    },
  ],
});

router.beforeEach(async (to: RouteLocationNormalized, from, next) => {
  const authStore = useAuthStore();
  const gameStore = useGameStore(); // GameStore példányosítása

  // 1. Auth állapot betöltése, ha szükséges (ez a részed jó volt)
  if (authStore.token && !authStore.user && !authStore.isLoadingUser) {
    console.log("[Guard] User data not loaded, attempting checkAuth...");
    try {
      await authStore.checkAuth(); // Ez frissíti az authStore.user-t, beleértve a selected_archetype_id-t
      console.log(
        "[Guard] checkAuth completed. User role:",
        authStore.user!.role,
        "Archetype ID:",
        authStore.user!.selected_archetype_id
      );
      // Ha checkAuth után még mindig nincs user, akkor a token érvénytelen volt,
      // az isAuthenticated false lesz, és a későbbi feltételek ezt kezelik.
    } catch (e) {
      console.error(
        "[Guard] Error during checkAuth, authStore.logout() might have been called:",
        e
      );
      // Ha a checkAuth hibát dob, az authStore.logout() valószínűleg lefutott benne,
      // így az isAuthenticated false lesz.
    }
  }

  const isAuthenticated = authStore.isAuthenticated;
  const isAdmin = authStore.isAdmin;
  const user = authStore.user; // Tartalmazza a selected_archetype_id-t

  console.log(
    `[Guard Decision] To: ${String(to.name)} | From: ${String(
      from.name
    )} | Auth: ${isAuthenticated}, Admin: ${isAdmin}, Archetype: ${
      user?.selected_archetype_id
    }, GameNode: ${gameStore.currentNode?.id}`
  );

  // --- ÚJ SORREND ÉS LOGIKA ---

  // A. Login és Register oldalak kezelése
  if (to.name === "login" || to.name === "register") {
    if (isAuthenticated) {
      // Ha be van lépve, de nincs archetípusa -> archetípus választó
      if (user && user.selected_archetype_id === null) {
        console.log(
          "[Guard] Authenticated user on login/register, no archetype -> redirect to archetype-selection"
        );
        next({ name: "archetype-selection" });
      } else {
        // Ha be van lépve ÉS van archetípusa (vagy admin és nem kell neki) -> dashboard
        console.log(
          "[Guard] Authenticated user on login/register, has archetype/is admin -> redirect to dashboard"
        );
        next({ name: "dashboard" });
      }
    } else {
      console.log(
        "[Guard] Not authenticated, allowing access to login/register."
      );
      next(); // Nincs bejelentkezve, mehet a login/register oldalra
    }
    return; // A guard itt véget ér erre az útvonalra
  }

  // B. Ha nincs bejelentkezve, és védett oldalra akar menni
  if (
    to.matched.some((record) => record.meta.requiresAuth) &&
    !isAuthenticated
  ) {
    console.log(
      "[Guard] Protected route, user not authenticated -> redirect to login."
    );
    next({ name: "login", query: { redirect: to.fullPath } });
    return;
  }

  // --- Csak bejelentkezett felhasználókra vonatkozó szabályok innentől ---
  if (isAuthenticated && user) {
    // Biztosítjuk, hogy a user objektum létezik
    // C. Admin útvonalak ellenőrzése
    if (to.matched.some((record) => record.meta.requiresAdmin)) {
      if (isAdmin) {
        console.log("[Guard] Admin route, access GRANTED.");
        next();
      } else {
        console.log(
          "[Guard] Admin route, user NOT ADMIN -> redirect to dashboard."
        );
        next({ name: "dashboard" }); // Nem admin, de be van lépve -> dashboard
      }
      return;
    }

    // D. Archetípus választó oldal speciális kezelése
    if (to.name === "archetype-selection") {
      if (user.selected_archetype_id !== null) {
        console.log(
          "[Guard] User has archetype, trying to access archetype-selection -> redirect to dashboard."
        );
        next({ name: "dashboard" }); // Már van archetípusa, ne menjen a választóba
      } else {
        console.log(
          "[Guard] User has no archetype, allowing access to archetype-selection."
        );
        next(); // Nincs archetípusa, ez a helyes oldal
      }
      return;
    }

    // E. Más (nem admin) védett oldalak, de még nincs archetípusa
    // (és nem az archetype-selection oldalra megy, mert azt a D. pont már lekezelte)
    if (user.selected_archetype_id === null && to.meta.requiresAuth) {
      console.log(
        `[Guard] Authenticated user (Auth route: ${String(
          to.name
        )}), but no archetype selected -> redirect to archetype-selection.`
      );
      next({ name: "archetype-selection" });
      return;
    }

    // F. /game útvonal ellenőrzése (már van archetípusa a usernek)
    if (to.name === "game") {
      // Ha a gameStore még tölti az adatokat az App.vue onMounted-ból, akkor engedjük
      if (gameStore.isLoading) {
        console.log("[Guard] Accessing /game, gameStore is loading, allowing.");
        next();
      } else if (!gameStore.currentNode) {
        // Ha betöltődött, de nincs aktív node
        console.log(
          "[Guard] Accessing /game, no active story (currentNode is null after load). Redirecting to dashboard."
        );
        next({ name: "dashboard" });
      } else {
        console.log("[Guard] Accessing /game, GRANTED (story active).");
        next();
      }
      return;
    }
  } // Bejelentkezett felhasználókra vonatkozó szabályok vége

  // Ha egyik fenti feltétel sem teljesült (pl. publikus oldal, vagy már engedélyeztük a next()-et)
  console.log("[Guard] Fallback: Allowing navigation.");
  next();
});

export default router;
