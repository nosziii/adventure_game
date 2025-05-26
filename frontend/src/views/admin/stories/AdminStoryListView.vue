<template>
  <div class="admin-story-list">
    <header class="list-header">
      <h1>Sztorik Kezelése</h1>
      <button @click="goToCreateStory" class="btn btn-primary">+ Új Sztori</button>
    </header>

    <div v-if="store.isLoading" class="status-text">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error">Hiba: {{ store.getError }}</div>
    <div v-else>
      <div v-if="store.allStories.length === 0" class="empty-state">
        <p>Nincsenek még sztorik.</p>
      </div>
      <div v-else class="table-wrapper">
        <table class="story-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cím</th>
              <th>Kezdő Node ID</th>
              <th>Publikált?</th>
              <th>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="story in store.allStories" :key="story.id">
              <td>{{ story.id }}</td>
              <td>{{ story.title }}</td>
              <td>{{ story.startingNodeId }}</td>
              <td>
                <span :class="story.isPublished ? 'badge published' : 'badge unpublished'">
                  {{ story.isPublished ? 'Igen' : 'Nem' }}
                </span>
              </td>
              <td>
                <button @click="goToEditStory(story.id)" class="btn btn-secondary">✏️ Szerkesztés</button>
                <button @click="handleDeleteStory(story.id, story.title)" class="btn btn-danger">🗑️ Törlés</button>
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
import { useAdminStoriesStore } from '../../../stores/adminStories'

const store = useAdminStoriesStore()
const router = useRouter()

onMounted(() => {
  store.fetchStories()
})

const goToCreateStory = () => {
  router.push({ name: 'admin-stories-new' })
}

const goToEditStory = (id: number) => {
  router.push({ name: 'admin-stories-edit', params: { id: id.toString() } })
}

const handleDeleteStory = async (id: number, storyTitle: string) => {
  if (confirm(`Biztosan törölni akarod a következő sztorit?\n\nID: ${id}\nCím: "${storyTitle}"`)) {
    await store.deleteStory(id)
  }
}
</script>

<style scoped>
.admin-story-list {
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
}

.table-wrapper {
  overflow-x: auto;
}

.story-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  color: var(--text-primary);
}

.story-table th,
.story-table td {
  border: 1px solid var(--panel-border);
  padding: 0.75rem;
  text-align: left;
}

.story-table th {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
  border: none;
}

.btn-primary {
  background: var(--button-bg);
  color: var(--button-text);
}

.btn-primary:hover {
  background: var(--button-hover-bg);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border: 1px solid var(--accent-secondary);
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

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
</style>
