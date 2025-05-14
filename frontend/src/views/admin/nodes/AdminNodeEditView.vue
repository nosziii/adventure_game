<template>
  <div class="admin-node-edit">
    <h1>{{ isEditing ? `Node Szerkesztése (ID: ${nodeId})` : 'Új Story Node Létrehozása' }}</h1>

    <div v-if="pageLoading">Adatok töltése...</div> <div v-else-if="store.getError || adminItemsStore.getError || adminEnemiesStore.getError" class="error-message">
      Hiba történt:
      <span v-if="store.getError">{{ store.getError }} </span>
      <span v-if="adminItemsStore.getError">{{ adminItemsStore.getError }} </span>
      <span v-if="adminEnemiesStore.getError">{{ adminEnemiesStore.getError }} </span>
    </div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
        <label for="text">Szöveg:</label>
        <textarea id="text" v-model="nodeData.text" rows="5" required></textarea>
      </div>

      <div class="form-group">
        <label for="image">Kép URL (opcionális):</label>
        <input type="url" id="image" v-model="nodeData.image" placeholder="http://... vagy /images/..."/>
      </div>

      <div class="form-group checkbox-group">
        <input type="checkbox" id="is_end" v-model="nodeData.is_end" />
        <label for="is_end">Ez egy befejező csomópont?</label>
      </div>

      <div class="form-group">
        <label for="health_effect">Életerő Hatás (opcionális, pl. -10 vagy 20):</label>
        <input type="number" id="health_effect" v-model.number="nodeData.health_effect" />
      </div>

      <div class="form-group">
        <label for="item_reward_id">Tárgy Jutalom (opcionális):</label>
        <select id="item_reward_id" v-model.number="nodeData.item_reward_id">
          <option :value="null">Nincs jutalom</option>
          <option v-for="item in adminItemsStore.allItems" :key="item.id" :value="item.id">
            ID: {{ item.id }} - {{ item.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="enemy_id">Ellenfél (opcionális):</label>
        <select id="enemy_id" v-model.number="nodeData.enemy_id">
          <option :value="null">Nincs ellenfél</option>
          <option v-for="enemy in adminEnemiesStore.allEnemies" :key="enemy.id" :value="enemy.id">
            ID: {{ enemy.id }} - {{ enemy.name }}
          </option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="store.isLoading || pageLoading">
          {{ store.isLoading ? 'Mentés...' : (isEditing ? 'Módosítások Mentése' : 'Létrehozás') }}
        </button>
        <router-link :to="{ name: 'admin-nodes-list' }" class="cancel-button">Mégse</router-link>
      </div>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'; // computed és watch hozzáadva
import { useRouter, useRoute } from 'vue-router';
import { useAdminNodesStore } from '../../../stores/adminNodes';
import type { AdminCreateNodePayload, AdminUpdateNodePayload, AdminNodeData } from '../../../types/admin.types';
import { useAdminItemsStore } from '../../../stores/adminItems';   // <-- Item store import
import { useAdminEnemiesStore } from '../../../stores/adminEnemies'; // <-- Enemy store import

const store = useAdminNodesStore();
const adminItemsStore = useAdminItemsStore();     // Item store példány
const adminEnemiesStore = useAdminEnemiesStore(); // Enemy store példány
const router = useRouter();
const route = useRoute();

const nodeId = ref<number | null>(null);
const isEditing = computed(() => nodeId.value !== null);
const pageLoading = ref(false); // Oldal betöltésének jelzése (listákhoz)

const getInitialNodeData = (): AdminCreateNodePayload => ({
  text: '',
  image: null,
  is_end: false,
  health_effect: null,
  item_reward_id: null,
  enemy_id: null,
});

const nodeData = ref<AdminCreateNodePayload | AdminUpdateNodePayload>(getInitialNodeData());
const successMessage = ref<string | null>(null);

onMounted(async () => {
  pageLoading.value = true;
  store.error = null; // Clear previous errors for node store
  adminItemsStore.error = null; // Clear previous errors for items store
  adminEnemiesStore.error = null; // Clear previous errors for enemies store

  const fetchListsPromise = Promise.all([
    adminItemsStore.fetchItems(),
    adminEnemiesStore.fetchEnemies()
  ]);

  const idParam = route.params.id;
  if (idParam) {
    const idToFetch = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(idToFetch)) {
      nodeId.value = idToFetch;
      await store.fetchNode(nodeId.value); // Ez beállítja a store.currentNode-t
    } else {
      store.error = "Érvénytelen Node ID."; nodeId.value = null;
      nodeData.value = getInitialNodeData();
    }
  } else {
    store.currentNode = null;
    nodeData.value = getInitialNodeData();
  }

  try {
    await fetchListsPromise;
  } catch (listError) {
    console.error("Failed to fetch lists for dropdowns", listError);
    // A store-ok error mezői már tartalmazzák a specifikus hibákat
  }
  pageLoading.value = false;
});

watch(() => store.getCurrentNode, (currentNode) => {
    if (isEditing.value && currentNode) {
        nodeData.value = {
            text: currentNode.text,
            image: currentNode.image ?? null,
            is_end: currentNode.is_end,
            health_effect: currentNode.health_effect ?? null,
            item_reward_id: currentNode.item_reward_id ?? null,
            enemy_id: currentNode.enemy_id ?? null,
        };
    } else if (!isEditing.value) {
        nodeData.value = getInitialNodeData();
    }
}, { immediate: true, deep: true });

const handleSubmit = async () => {
  successMessage.value = null;
  store.error = null;
  let result: AdminNodeData | null = null;

  if (!nodeData.value.text) {
      store.error = "A Szöveg kitöltése kötelező!";
      return;
  }

  if (isEditing.value && nodeId.value !== null) {
    result = await store.updateNode(nodeId.value, nodeData.value as AdminUpdateNodePayload);
    if (result) successMessage.value = `Node (ID: ${result.id}) sikeresen frissítve!`;
  } else {
    result = await store.createNode(nodeData.value as AdminCreateNodePayload);
    if (result) successMessage.value = `Node sikeresen létrehozva (ID: ${result.id})!`;
  }

  if (result) {
    setTimeout(() => router.push({ name: 'admin-nodes-list' }), 1500);
  }
};
</script>

<style scoped>
.admin-node-edit { padding: 20px; max-width: 600px; margin: auto; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input[type="text"],
.form-group input[type="url"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.form-group textarea { min-height: 100px; }
.checkbox-group { display: flex; align-items: center; }
.checkbox-group input { margin-right: 8px; width: auto; }
.form-actions { margin-top: 20px; }
.form-actions button { padding: 10px 15px; margin-right: 10px; }
.cancel-button { padding: 10px 15px; text-decoration: none; background-color: #6c757d; color:white; border-radius: 4px;}
.error { color: red; margin-top: 10px; }
.success { color: green; margin-top: 10px; }
select {
  width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background-color: white;
}
.admin-node-edit { padding: 20px; max-width: 600px; margin: auto; }
</style>