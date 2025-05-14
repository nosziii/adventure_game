<template>
  <div class="admin-choice-edit">
    <h1>{{ isEditing ? `Választás Szerkesztése (ID: ${choiceId})` : 'Új Választás Létrehozása' }}</h1>

    <div v-if="pageLoading">Adatok töltése...</div> <div v-else-if="store.getError" class="error-message">{{ store.getError }}</div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
        <label for="sourceNodeId">Forrás Node:</label>
        <select id="sourceNodeId" v-model.number="choiceData.sourceNodeId" required>
          <option :value="0" disabled>Válassz egy forrás node-ot...</option>
          <option v-for="node in adminNodesStore.allNodes" :key="node.id" :value="node.id">
            ID: {{ node.id }} - {{ truncateText(node.text, 40) }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="targetNodeId">Cél Node:</label>
        <select id="targetNodeId" v-model.number="choiceData.targetNodeId" required>
          <option :value="0" disabled>Válassz egy cél node-ot...</option>
          <option v-for="node in adminNodesStore.allNodes" :key="node.id" :value="node.id">
            ID: {{ node.id }} - {{ truncateText(node.text, 40) }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="text">Szöveg:</label>
        <textarea id="text" v-model="choiceData.text" rows="3" required></textarea>
      </div>

      <div class="form-group">
        <label for="requiredItemId">Szükséges Tárgy (opcionális):</label>
        <select id="requiredItemId" v-model.number="choiceData.requiredItemId">
          <option :value="null">Nincs</option>
          <option v-for="item in adminItemsStore.allItems" :key="item.id" :value="item.id">
            ID: {{ item.id }} - {{ item.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="itemCostId">Tárgy Költség (opcionális):</label>
        <select id="itemCostId" v-model.number="choiceData.itemCostId">
          <option :value="null">Nincs</option>
          <option v-for="item in adminItemsStore.allItems" :key="item.id" :value="item.id">
            ID: {{ item.id }} - {{ item.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="requiredStatCheck">Statisztika Feltétel (opcionális, pl. "skill >= 10"):</label>
        <input type="text" id="requiredStatCheck" v-model="choiceData.requiredStatCheck" />
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="store.isLoading || adminNodesStore.isLoading || adminItemsStore.isLoading">
          {{ store.isLoading ? 'Mentés...' : (isEditing ? 'Módosítások Mentése' : 'Létrehozás') }}
        </button>
        <router-link :to="{ name: 'admin-choices-list' }" class="cancel-button">Mégse</router-link>
      </div>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminChoicesStore } from '../../../stores/adminChoices'; // Vagy relatív útvonal
import type { AdminCreateChoicePayload, AdminUpdateChoicePayload, AdminChoiceData } from '../../../types/admin.types';
import { useAdminNodesStore } from '../../../stores/adminNodes'; 
import { useAdminItemsStore } from '../../../stores/adminItems'; 

const store = useAdminChoicesStore();
const adminNodesStore = useAdminNodesStore(); // Node store példányosítása
const adminItemsStore = useAdminItemsStore(); // Item store példányosítása
const router = useRouter();
const route = useRoute();

const choiceId = ref<number | null>(null);
const isEditing = computed(() => choiceId.value !== null);
const pageLoading = ref(false); // Új loading flag az oldal betöltéséhez

const getInitialChoiceData = (): AdminCreateChoicePayload => ({
  sourceNodeId: 0, // Vagy null, és a selectben van egy "Válassz..." opció
  targetNodeId: 0,
  text: '',
  requiredItemId: null,
  itemCostId: null,
  requiredStatCheck: null,
});

const choiceData = ref<AdminCreateChoicePayload | AdminUpdateChoicePayload>(getInitialChoiceData());
const successMessage = ref<string | null>(null);

onMounted(async () => {
  pageLoading.value = true;
  // Párhuzamosan lekérjük a node és item listákat a dropdownokhoz
  const fetchNodesPromise = adminNodesStore.fetchNodes();
  const fetchItemsPromise = adminItemsStore.fetchItems();

  const idParam = route.params.id;
  if (idParam) {
    const idToFetch = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(idToFetch)) {
      choiceId.value = idToFetch;
      await store.fetchChoice(choiceId.value); // Ez beállítja a store.currentChoice-ot
    } else {
      store.error = "Érvénytelen Választás ID."; choiceId.value = null;
      choiceData.value = getInitialChoiceData();
    }
  } else {
    store.currentChoice = null;
    choiceData.value = getInitialChoiceData();
  }
  // Megvárjuk a listák betöltését is
  try {
      await Promise.all([fetchNodesPromise, fetchItemsPromise]);
  } catch (listError) {
      console.error("Failed to fetch lists for dropdowns", listError);
      // A store-ok error mezője már kezeli a saját hibáikat
  }
  pageLoading.value = false;
});

watch(() => store.getCurrentChoice, (currentChoice) => {
    if (isEditing.value && currentChoice) {
        choiceData.value = {
            sourceNodeId: currentChoice.sourceNodeId,
            targetNodeId: currentChoice.targetNodeId,
            text: currentChoice.text,
            requiredItemId: currentChoice.requiredItemId ?? null,
            itemCostId: currentChoice.itemCostId ?? null,
            requiredStatCheck: currentChoice.requiredStatCheck ?? null,
        };
    } else if (!isEditing.value) {
         choiceData.value = getInitialChoiceData();
    }
}, { immediate: true, deep: true }); // deep: true a currentChoice objektum változásaira

const handleSubmit = async () => { /* ... (változatlan) ... */ };

// Segédfüggvény a szöveg rövidítésére (ha kellene itt is)
const truncateText = (text: string, length: number): string => {
    return text && text.length > length ? text.substring(0, length) + '...' : text || '';
};
</script>

<style scoped>
/* Hasonló stílusok, mint az AdminNodeEditView */
.admin-choice-edit { padding: 20px; max-width: 600px; margin: auto; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
}
.form-group textarea { min-height: 80px; }
.form-actions { margin-top: 20px; }
.form-actions button { padding: 10px 15px; margin-right: 10px; }
.cancel-button { padding: 10px 15px; text-decoration: none; background-color: #6c757d; color:white; border-radius: 4px;}
.error-message { color: red; margin-top: 10px; }
.success-message { color: green; margin-top: 10px; }
</style>