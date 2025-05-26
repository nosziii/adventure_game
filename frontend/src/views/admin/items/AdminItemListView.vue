<template>
  <div class="admin-item-list">
    <header class="list-header">
      <h1>Tárgyak Kezelése</h1>
      <button @click="goToCreateItem" class="btn btn-primary">+ Új Tárgy</button>
    </header>

    <div v-if="store.isLoading" class="status-text">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-box">Hiba: {{ store.getError }}</div>

    <div v-else>
      <div v-if="store.allItems.length === 0" class="empty-state">
        Nincsenek még tárgyak.
      </div>
      <div v-else class="table-wrapper">
        <table class="item-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Név</th>
              <th>Típus</th>
              <th>Effekt</th>
              <th>Használható?</th>
              <th>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in store.allItems" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.type }}</td>
              <td>{{ item.effect || '-' }}</td>
              <td>
                <span :class="item.usable ? 'badge published' : 'badge unpublished'">
                  {{ item.usable ? 'Igen' : 'Nem' }}
                </span>
              </td>
              <td>
                <button @click="goToEditItem(item.id)" class="btn btn-secondary">✏️ Szerkesztés</button>
                <button @click="handleDeleteItem(item.id, item.name)" class="btn btn-danger">🗑️ Törlés</button>
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
import { useAdminItemsStore } from '../../../stores/adminItems'

const store = useAdminItemsStore()
const router = useRouter()

onMounted(() => {
  store.fetchItems()
})

const goToCreateItem = () => {
  router.push({ name: 'admin-items-new' })
}

const goToEditItem = (id: number) => {
  router.push({ name: 'admin-items-edit', params: { id: id.toString() } })
}

const handleDeleteItem = async (id: number, itemName: string) => {
  if (confirm(`Biztosan törölni akarod a következő tárgyat?\n\nID: ${id}\nNév: "${itemName}"`)) {
    await store.deleteItem(id)
  }
}
</script>

<style scoped>
.admin-item-list {
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

.item-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  color: var(--text-primary);
}

.item-table th,
.item-table td {
  border: 1px solid var(--panel-border);
  padding: 0.75rem;
  text-align: left;
}

.item-table th {
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
