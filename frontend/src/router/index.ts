import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import GameView from '../views/GameView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // HTML5 history mód
  routes: [
    // Ide definiáljuk az útvonalakat
    // Példák (a komponenseket majd importálni kell):
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    }, 
    {
      path: '/game', // A játék fő útvonala
      name: 'game',
      component: GameView,
      meta: { requiresAuth: true }
    }
  ]
})
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = authStore.isAuthenticated

  console.log(`Navigating to: ${to.path}, requiresAuth: ${requiresAuth}, isAuthenticated: ${isAuthenticated}`)

  if (requiresAuth && !isAuthenticated) {
    console.log('Redirecting to login.')
    next({ name: 'login' })
  } else if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    console.log('User already authenticated, redirecting from login/register.')
    next({ name: 'game' });
  } else {
    console.log('Allowing navigation.')
    next()
  }
})

export default router