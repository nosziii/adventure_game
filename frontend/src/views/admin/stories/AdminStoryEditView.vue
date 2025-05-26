<template>
  <div class="admin-story-edit">
    <h1>{{ isEditing ? `Sztori Szerkesztése (ID: ${storyId})` : 'Új Sztori Létrehozása' }}</h1>

    <div v-if="pageLoading" class="status-text">Adatok töltése...</div>

    <div v-else-if="store.getError || adminNodesStore.getError" class="error-box">
      <p><strong>Hiba történt:</strong></p>
      <p v-if="store.getError">Sztori hiba: {{ store.getError }}</p>
      <p v-if="adminNodesStore.getError">Node lista hiba: {{ adminNodesStore.getError }}</p>
    </div>

    <form @submit.prevent="handleSubmit" v-else class="story-form">
      <div class="form-group">
        <label for="title">Cím</label>
        <input type="text" id="title" v-model="storyData.title" required />
      </div>

      <div class="form-group">
        <label for="description">Leírás (opcionális)</label>
        <textarea id="description" v-model="storyData.description" rows="4" />
      </div>

      <div class="form-group">
        <label for="startingNodeId">Kezdő Node</label>
        <select id="startingNodeId" v-model.number="storyData.startingNodeId" required>
          <option :value="0" disabled>Válassz egy kezdő node-ot...</option>
          <option
            v-for="node in adminNodesStore.allNodes"
            :key="node.id"
            :value="node.id"
          >
            ID: {{ node.id }} – {{ truncateText(node.text, 50) }}
          </option>
        </select>
      </div>

      <div class="form-group checkbox">
        <input type="checkbox" id="isPublished" v-model="storyData.isPublished" />
        <label for="isPublished">Publikált?</label>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="store.isLoading || pageLoading">
          {{ store.isLoading ? 'Mentés...' : isEditing ? 'Módosítások Mentése' : 'Létrehozás' }}
        </button>
        <router-link :to="{ name: 'admin-stories-list' }" class="btn btn-secondary">Mégse</router-link>
      </div>

      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStoriesStore } from '../../../stores/adminStories'
import { useAdminNodesStore } from '../../../stores/adminNodes'
import type { AdminCreateStoryPayload, AdminUpdateStoryPayload, AdminStoryData } from '../../../types/admin.types'

const store = useAdminStoriesStore()
const adminNodesStore = useAdminNodesStore()
const router = useRouter()
const route = useRoute()

const storyId = ref<number | null>(null)
const isEditing = computed(() => storyId.value !== null)
const pageLoading = ref(false)

const getInitialStoryData = (): AdminCreateStoryPayload => ({
  title: '',
  description: null,
  startingNodeId: 0,
  isPublished: false
})

const storyData = ref<AdminCreateStoryPayload | AdminUpdateStoryPayload>(getInitialStoryData())
const successMessage = ref<string | null>(null)

onMounted(async () => {
  pageLoading.value = true
  store.error = null
  adminNodesStore.error = null

  const fetchNodesPromise = adminNodesStore.fetchNodes()
  let fetchStoryPromise: Promise<boolean> | null = null

  const idParam = route.params.id
  if (idParam) {
    const idToFetch = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10)
    if (!isNaN(idToFetch)) {
      storyId.value = idToFetch
      fetchStoryPromise = store.fetchStory(storyId.value)
    } else {
      store.error = 'Érvénytelen Sztori ID.'
      storyId.value = null
    }
  }

  await fetchNodesPromise
  if (fetchStoryPromise) await fetchStoryPromise

  pageLoading.value = false
})

watch(
  () => store.getCurrentStory,
  (currentStory) => {
    if (isEditing.value && currentStory) {
      storyData.value = {
        title: currentStory.title,
        description: currentStory.description ?? null,
        startingNodeId: currentStory.startingNodeId,
        isPublished: currentStory.isPublished
      }
    } else {
      storyData.value = getInitialStoryData()
    }
  },
  { immediate: true, deep: true }
)

const handleSubmit = async () => {
  successMessage.value = null
  store.error = null
  let result: AdminStoryData | null = null

  if (!storyData.value.title || !storyData.value.startingNodeId) {
    store.error = 'A Cím és a Kezdő Node ID kitöltése kötelező!'
    return
  }

  if (isEditing.value && storyId.value !== null) {
    result = await store.updateStory(storyId.value, storyData.value as AdminUpdateStoryPayload)
    if (result) successMessage.value = `Sztori (ID: ${result.id}) sikeresen frissítve!`
  } else {
    result = await store.createStory(storyData.value as AdminCreateStoryPayload)
    if (result) successMessage.value = `Sztori sikeresen létrehozva (ID: ${result.id})!`
  }

  if (result) {
    setTimeout(() => router.push({ name: 'admin-stories-list' }), 1500)
  }
}

const truncateText = (text: string, length: number): string => {
  return text && text.length > length ? text.substring(0, length) + '...' : text || ''
}
</script>

<style scoped>
.admin-story-edit {
  padding: 2rem;
  max-width: 700px;
  margin: 80px auto;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 1rem;
  box-shadow: 0 0 20px rgba(179, 136, 255, 0.1);
  backdrop-filter: blur(6px);
}

h1 {
  font-family: 'Cinzel Decorative', cursive;
  font-size: 1.8rem;
  color: var(--accent-primary);
  margin-bottom: 1.5rem;
}

.status-text,
.success-message {
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

.story-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

input[type='text'],
textarea,
select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding: 0.6rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--input-text);
  border-radius: 0.5rem;
  transition: border 0.2s ease;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg width='14' height='10' viewBox='0 0 14 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23b388ff' d='M7 10L0.0717975 0.25L13.9282 0.25L7 10Z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.8rem center;
  background-size: 1rem;
  color:rgb(68, 45, 90);
}
option {
  background-color: var(--bg-deep-dark);
  color: var(--text-primary);
}

/* Firefoxban külön kell az option színezését engedni */
select:-moz-focusring {
  color: transparent;
  text-shadow: 0 0 0 var(--text-primary);
}
input:focus,
textarea:focus,
select:focus {
  border-color: var(--input-focus-border);
  outline: none;
}

.checkbox {
  flex-direction: row;
  align-items: center;
}

.checkbox input {
  margin-right: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: background 0.3s ease;
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
  background: transparent;
  border: 1px solid var(--accent-secondary);
  color: var(--accent-secondary);
}

.btn-secondary:hover {
  background: var(--accent-secondary);
  color: white;
}
</style>
