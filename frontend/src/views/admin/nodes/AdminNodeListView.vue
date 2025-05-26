<template>
  <div class="admin-node-list">
    <header class="list-header">
      <h1>Story Node-ok Kezelése</h1>
      <button @click="goToCreate" class="btn btn-primary">+ Új Node</button>
    </header>

    <div v-if="store.isLoading" class="status-text">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-box">Hiba: {{ store.getError }}</div>

    <div v-else>
      <div v-if="store.allNodes.length === 0" class="empty-state">
        Nincsenek még story node-ok.
      </div>

      <div v-else class="table-wrapper">
        <table class="node-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Szöveg (Részlet)</th>
              <th>Végpont?</th>
              <th>Enemy ID</th>
              <th>Item Reward ID</th>
              <th>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="node in store.allNodes" :key="node.id">
              <td>{{ node.id }}</td>
              <td>{{ truncateText(node.text, 50) }}</td>
              <td>
                <span :class="node.is_end ? 'badge published' : 'badge unpublished'">
                  {{ node.is_end ? 'Igen' : 'Nem' }}
                </span>
              </td>
              <td>{{ node.enemy_id ?? '-' }}</td>
              <td>{{ node.item_reward_id ?? '-' }}</td>
              <td>
                <button @click="goToEdit(node.id)" class="btn btn-secondary">✏️ Szerkesztés</button>
                <button @click="handleDeleteNode(node.id, node.text)" class="btn btn-danger">🗑️ Törlés</button>
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
import { useAdminNodesStore } from '../../../stores/adminNodes'

const store = useAdminNodesStore()
const router = useRouter()

onMounted(() => {
  store.fetchNodes()
})

const truncateText = (text: string, length: number): string => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

const goToCreate = () => {
  router.push({ name: 'admin-nodes-new' })
}

const goToEdit = (id: number) => {
  router.push({ name: 'admin-nodes-edit', params: { id } })
}

const handleDeleteNode = async (id: number, nodeText: string) => {
  if (confirm(`Biztosan törölni akarod a következő node-ot?\n\nID: ${id}\nSzöveg: "${truncateText(nodeText, 100)}"`)) {
    await store.deleteNode(id)
  }
}
</script>

<style scoped>
.admin-node-list {
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

.node-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  color: var(--text-primary);
}

.node-table th,
.node-table td {
  border: 1px solid var(--panel-border);
  padding: 0.75rem;
  text-align: left;
}

.node-table th {
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

.badge {
  padding: 0.2rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: bold;
}

.published {
  background-color: #2d9248;
  color: white;
}

.unpublished {
  background-color: #7a1f1f;
  color: white;
}
</style>
