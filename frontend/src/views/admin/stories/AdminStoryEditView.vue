<template>
  <div class="admin-story-edit">
    <h1>{{ isEditing ? `Sztori Szerkesztése (ID: ${storyId})` : 'Új Sztori Létrehozása' }}</h1>

    <div v-if="pageLoading">Adatok töltése...</div>
    <div v-else-if="store.getError || adminNodesStore.getError" class="error-message">
        Hiba történt:
        <span v-if="store.getError">Sztori hiba: {{ store.getError }}</span>
        <span v-if="adminNodesStore.getError">Node lista hiba: {{ adminNodesStore.getError }}</span>
    </div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
        <label for="title">Cím:</label>
        <input type="text" id="title" v-model="storyData.title" required />
      </div>

      <div class="form-group">
        <label for="description">Leírás (opcionális):</label>
        <textarea id="description" v-model="storyData.description" rows="4"></textarea>
      </div>

      <div class="form-group">
        <label for="startingNodeId">Kezdő Node:</label>
        <select id="startingNodeId" v-model.number="storyData.startingNodeId" required>
          <option :value="0" disabled>Válassz egy kezdő node-ot...</option>
          <option v-for="node in adminNodesStore.allNodes" :key="node.id" :value="node.id">
            ID: {{ node.id }} - {{ truncateText(node.text, 50) }}
          </option>
        </select>
      </div>

      <div class="form-group checkbox-group">
        <input type="checkbox" id="isPublished" v-model="storyData.isPublished" />
        <label for="isPublished">Publikált?</label>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="store.isLoading || pageLoading">
          {{ store.isLoading ? 'Mentés...' : (isEditing ? 'Módosítások Mentése' : 'Létrehozás') }}
        </button>
        <router-link :to="{ name: 'admin-stories-list' }" class="cancel-button">Mégse</router-link>
      </div>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminStoriesStore } from '../../../stores/adminStories';
import { useAdminNodesStore } from '../../../stores/adminNodes'; // <-- Node store import
import type { AdminCreateStoryPayload, AdminUpdateStoryPayload, AdminStoryData } from '../../../types/admin.types';

const store = useAdminStoriesStore();
const adminNodesStore = useAdminNodesStore(); // Node store példányosítása
const router = useRouter();
const route = useRoute();

const storyId = ref<number | null>(null);
const isEditing = computed(() => storyId.value !== null);
const pageLoading = ref(false); // Oldal és a dropdown adatok töltésének jelzése

const getInitialStoryData = (): AdminCreateStoryPayload => ({
  title: '',
  description: null,
  startingNodeId: 0, // Vagy null, ha a select megengedi
  isPublished: false,
});

const storyData = ref<AdminCreateStoryPayload | AdminUpdateStoryPayload>(getInitialStoryData());
const successMessage = ref<string | null>(null);

onMounted(async () => {
  pageLoading.value = true;
  store.error = null;
  adminNodesStore.error = null;

  // Párhuzamosan lekérjük a node listát a dropdownhoz
  const fetchNodesPromise = adminNodesStore.fetchNodes();
  let fetchStoryPromise: Promise<boolean> | null = null;

  const idParam = route.params.id;
  if (idParam) {
    const idToFetch = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(idToFetch)) {
      storyId.value = idToFetch;
      fetchStoryPromise = store.fetchStory(storyId.value); // Ez beállítja a store.currentStory-t
    } else {
      store.error = "Érvénytelen Sztori ID."; storyId.value = null;
      storyData.value = getInitialStoryData();
    }
  } else {
    store.currentStory = null;
    storyData.value = getInitialStoryData();
  }

  try {
    await fetchNodesPromise; // Megvárjuk a node-okat
    if (fetchStoryPromise) await fetchStoryPromise; // És a sztorit, ha szerkesztünk
  } catch (listError) {
    console.error("Failed to fetch data for story edit/create page", listError);
  }
  pageLoading.value = false;
});

watch(() => store.getCurrentStory, (currentStory) => {
    if (isEditing.value && currentStory) {
        storyData.value = {
            title: currentStory.title,
            description: currentStory.description ?? null,
            startingNodeId: currentStory.startingNodeId,
            isPublished: currentStory.isPublished,
        };
    } else if (!isEditing.value) {
        storyData.value = getInitialStoryData();
    }
}, { immediate: true, deep: true });


const handleSubmit = async () => {
  successMessage.value = null;
  store.error = null;
  let result: AdminStoryData | null = null;

  if (!storyData.value.title || !storyData.value.startingNodeId) {
      store.error = "A Cím és a Kezdő Node ID kitöltése kötelező!";
      return;
  }

  if (isEditing.value && storyId.value !== null) {
    result = await store.updateStory(storyId.value, storyData.value as AdminUpdateStoryPayload);
    if (result) successMessage.value = `Sztori (ID: ${result.id}) sikeresen frissítve!`;
  } else {
    result = await store.createStory(storyData.value as AdminCreateStoryPayload);
    if (result) successMessage.value = `Sztori sikeresen létrehozva (ID: ${result.id})!`;
  }

  if (result) {
    setTimeout(() => router.push({ name: 'admin-stories-list' }), 1500);
  }
};

const truncateText = (text: string, length: number): string => {
    return text && text.length > length ? text.substring(0, length) + '...' : text || '';
};
</script>

<style scoped>
/* Hasonló stílusok, mint a többi Admin EditView */
select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background-color: white;}
.admin-story-edit { padding: 20px; max-width: 600px; margin: auto; }
/* ... (többi stílus) ... */
</style>