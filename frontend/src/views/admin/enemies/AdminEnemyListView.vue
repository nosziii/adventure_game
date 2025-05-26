<template>
  <div class="admin-enemy-list">
    <header class="list-header">
      <h1>Ellenségek Kezelése</h1>
      <button @click="goToCreateEnemy" class="btn btn-primary">+ Új Ellenség</button>
    </header>

    <div v-if="store.isLoading" class="status-text">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-box">Hiba: {{ store.getError }}</div>

    <div v-else>
      <div v-if="store.allEnemies.length === 0" class="empty-state">
        Nincsenek még ellenségek.
      </div>
      <div v-else class="table-wrapper">
        <table class="enemy-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Név</th>
              <th>HP</th>
              <th>Skill</th>
              <th>XP Jutalom</th>
              <th>Item Drop ID</th>
              <th>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="enemy in store.allEnemies" :key="enemy.id">
              <td>{{ enemy.id }}</td>
              <td>{{ enemy.name }}</td>
              <td>{{ enemy.health }}</td>
              <td>{{ enemy.skill }}</td>
              <td>{{ enemy.xpReward }}</td>
              <td>{{ enemy.itemDropId ?? '-' }}</td>
              <td>
                <button @click="goToEditEnemy(enemy.id)" class="btn btn-secondary">✏️ Szerkesztés</button>
                <button @click="handleDeleteEnemy(enemy.id, enemy.name)" class="btn btn-danger">🗑️ Törlés</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminEnemiesStore } from '../../../stores/adminEnemies'

const store = useAdminEnemiesStore()
const router = useRouter()

onMounted(() => {
  store.fetchEnemies()
})

const goToCreateEnemy = () => {
  router.push({ name: 'admin-enemies-new' })
}

const goToEditEnemy = (id: number) => {
  router.push({ name: 'admin-enemies-edit', params: { id: id.toString() } })
}

const handleDeleteEnemy = async (id: number, enemyName: string) => {
  if (confirm(`Biztosan törölni akarod a következő ellenséget?\n\nID: ${id}\nNév: "${enemyName}"`)) {
    await store.deleteEnemy(id)
  }
}
</script>

<style scoped>
.admin-enemy-list {
  padding: 2rem;
  margin-top: 80px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 1rem;
  box-shadow: 0 0 20px rgba(179, 136, 255, 0.1);
  backdrop-filter: blur(6px);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.list-header h1 {
  font-family: 'Cinzel Decorative', cursive;
  font-size: 1.8rem;
  color: var(--accent-primary);
}

.status-text {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.error-box {
  background-color: rgba(160, 32, 32, 0.2);
  color: #ffcfcf;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #cc5555;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}

.table-wrapper {
  overflow-x: auto;
}

.enemy-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  color: var(--text-primary);
}

.enemy-table th,
.enemy-table td {
  border: 1px solid var(--panel-border);
  padding: 0.75rem;
  text-align: left;
}

.enemy-table th {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease;
  border: none;
  margin-right: 0.4rem;
}

.btn-primary {
  background: var(--button-bg);
  color: var(--button-text);
}

.btn-primary:hover {
  background: var(--button-hover-bg);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--accent-secondary);
  color: var(--accent-secondary);
}

.btn-secondary:hover {
  background: var(--accent-secondary);
  color: white;
}

.btn-danger {
  background: #862d45;
  color: white;
}

.btn-danger:hover {
  background: #aa3c5a;
}
</style>
