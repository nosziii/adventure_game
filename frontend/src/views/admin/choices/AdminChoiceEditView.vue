<template>
  <div class="admin-choice-edit">
    <h1>{{ isEditing ? `Választás Szerkesztése (ID: ${choiceId})` : 'Új Választás Létrehozása' }}</h1>

    <div v-if="pageLoading" class="status-text">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-box">{{ store.getError }}</div>

    <form @submit.prevent="handleSubmit" v-else class="choice-form">
      <div class="form-group">
        <label for="sourceNodeId">Forrás Node</label>
        <select id="sourceNodeId" v-model.number="choiceData.sourceNodeId" required>
          <option :value="0" disabled>Válassz egy node-ot...</option>
          <option v-for="node in adminNodesStore.allNodes" :key="node.id" :value="node.id">
            ID: {{ node.id }} – {{ truncateText(node.text, 40) }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="targetNodeId">Cél Node</label>
        <select id="targetNodeId" v-model.number="choiceData.targetNodeId" required>
          <option :value="0" disabled>Válassz egy node-ot...</option>
          <option v-for="node in adminNodesStore.allNodes" :key="node.id" :value="node.id">
            ID: {{ node.id }} – {{ truncateText(node.text, 40) }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="text">Szöveg</label>
        <textarea id="text" v-model="choiceData.text" rows="3" required></textarea>
      </div>

      <div class="form-group">
        <label for="requiredItemId">Szükséges Tárgy</label>
        <select id="requiredItemId" v-model.number="choiceData.requiredItemId">
          <option :value="null">Nincs</option>
          <option v-for="item in adminItemsStore.allItems" :key="item.id" :value="item.id">
            ID: {{ item.id }} – {{ item.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="itemCostId">Tárgy Költség</label>
        <select id="itemCostId" v-model.number="choiceData.itemCostId">
          <option :value="null">Nincs</option>
          <option v-for="item in adminItemsStore.allItems" :key="item.id" :value="item.id">
            ID: {{ item.id }} – {{ item.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="requiredStatCheck">Statisztikai Feltétel (pl. "skill >= 10")</label>
        <input type="text" id="requiredStatCheck" v-model="choiceData.requiredStatCheck" />
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary"
          :disabled="store.isLoading || adminNodesStore.isLoading || adminItemsStore.isLoading">
          {{ store.isLoading ? 'Mentés...' : isEditing ? 'Módosítások Mentése' : 'Létrehozás' }}
        </button>
        <router-link :to="{ name: 'admin-choices-list' }" class="btn btn-secondary">Mégse</router-link>
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

const handleSubmit = async () => {
  successMessage.value = null;
  store.error = null; // Hiba törlése
  let result: AdminChoiceData | null = null;

  // Validáció (egyszerű példa, class-validator jobb lenne a DTO-ban)
  if (!choiceData.value.sourceNodeId || !choiceData.value.targetNodeId || !choiceData.value.text) {
      store.error = "A Forrás Node ID, Cél Node ID és Szöveg kitöltése kötelező!";
      return;
  }

  if (isEditing.value && choiceId.value !== null) {
    result = await store.updateChoice(choiceId.value, choiceData.value as AdminUpdateChoicePayload);
    if (result) successMessage.value = `Választás (ID: ${result.id}) sikeresen frissítve!`;
  } else {
    result = await store.createChoice(choiceData.value as AdminCreateChoicePayload);
    if (result) successMessage.value = `Választás sikeresen létrehozva (ID: ${result.id})!`;
  }

  if (result) {
    setTimeout(() => router.push({ name: 'admin-choices-list' }), 1500);
  }
}

// Segédfüggvény a szöveg rövidítésére (ha kellene itt is)
const truncateText = (text: string, length: number): string => {
    return text && text.length > length ? text.substring(0, length) + '...' : text || '';
};
</script>

<style scoped>
.admin-choice-edit {
  padding: 2rem;
  max-width: 700px;
  margin: 80px auto;
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

.success-message {
  color: #37ff8b;
  margin-top: 1rem;
}

.choice-form {
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

input,
textarea,
select {
  padding: 0.6rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--input-text);
  border-radius: 0.5rem;
  transition: border 0.2s ease;
  color:rgb(68, 45, 90);
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--input-focus-border);
  outline: none;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.btn {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
  border: none;
  text-decoration: none;
  text-align: center;
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
