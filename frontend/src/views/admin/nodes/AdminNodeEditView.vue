<template>
  <div class="admin-node-edit">
    <h1>{{ isEditing ? `Node Szerkesztése (ID: ${nodeId})` : 'Új Story Node Létrehozása' }}</h1>

    <div v-if="isEditing && store.isLoadingCurrent">Node adatainak töltése...</div>
    <div v-else-if="store.getError" class="error">{{ store.getError }}</div>

    <form @submit.prevent="handleSubmit" v-else>

      <div class="form-group">
        <label for="text">Szöveg:</label>
        <textarea id="text" v-model="nodeData.text" rows="5" required></textarea>
      </div>

      <div class="form-group">
        <label for="image">Kép URL (opcionális):</label>
        <input type="url" id="image" v-model="nodeData.image" placeholder="http://... vagy /images/..." />
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
        <label for="item_reward_id">Tárgy Jutalom ID (opcionális):</label>
        <input type="number" id="item_reward_id" v-model.number="nodeData.item_reward_id" min="1" />
      </div>

      <div class="form-group">
        <label for="enemy_id">Ellenfél ID (opcionális):</label>
        <input type="number" id="enemy_id" v-model.number="nodeData.enemy_id" min="1" />
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="store.isLoading">
          {{ store.isLoading ? 'Mentés...' : (isEditing ? 'Módosítások Mentése' : 'Létrehozás') }}
        </button>
        <router-link :to="{ name: 'admin-nodes-list' }" class="cancel-button">Mégse</router-link>
      </div>

      <p v-if="successMessage" class="success">{{ successMessage }}</p>
      <p v-if="store.getError" class="error">{{ store.getError }}</p> </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'; // computed és watch hozzáadva
import { useRouter, useRoute } from 'vue-router';
import { useAdminNodesStore } from '../../../stores/adminNodes';
import type { AdminCreateNodePayload, AdminUpdateNodePayload, AdminNodeData } from '../../../types/admin.types';

const store = useAdminNodesStore();
const router = useRouter();
const route = useRoute();

// Megmondja, hogy szerkesztési módban vagyunk-e (van :id paraméter az URL-ben)
const nodeId = ref<number | null>(null);
const isEditing = computed(() => nodeId.value !== null);

// Az űrlap adatai (kezdetben CreateNodeDto alapján, de Update is lehet)
// Használjunk ref-et, hogy könnyebb legyen felülírni szerkesztéskor
const nodeData = ref<AdminCreateNodePayload | AdminUpdateNodePayload>({
  text: '',
  image: null,
  is_end: false,
  health_effect: null,
  item_reward_id: null,
  enemy_id: null,
});

const successMessage = ref<string | null>(null);

// Adatok lekérése szerkesztési módban, amikor a komponens betöltődik
onMounted(async () => {
  const idParam = route.params.id;
  if (idParam) {
    nodeId.value = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(nodeId.value)) {
      console.log(`Editing node with ID: ${nodeId.value}`);
      // Lekérjük a node adatait a store-on keresztül
      await store.fetchNode(nodeId.value);
      // A watchEffect lentebb kezeli az űrlap feltöltését
    } else {
        console.error("Invalid node ID in route parameter:", route.params.id);
        store.error = "Érvénytelen Node ID.";
        nodeId.value = null; // Visszaállítjuk, mintha create lenne
    }
  } else {
      console.log('Creating new node.');
      // Létrehozási mód: ürítjük a store currentNode-ját és az űrlapot (biztonság kedvéért)
      store.currentNode = null;
      nodeData.value = { text: '', image: null, is_end: false, health_effect: null, item_reward_id: null, enemy_id: null };
  }
});

// Figyeljük a store currentNode változását, és ha van adat (szerkesztéskor), betöltjük az űrlapba
watch(() => store.getCurrentNode, (currentNode) => {
    if (isEditing.value && currentNode) {
        console.log('Populating form with fetched node data:', currentNode);
        // Biztosítjuk, hogy a null értékek megmaradjanak null-nak
        nodeData.value = {
            text: currentNode.text,
            image: currentNode.image ?? null,
            is_end: currentNode.is_end,
            health_effect: currentNode.health_effect ?? null,
            item_reward_id: currentNode.item_reward_id ?? null,
            enemy_id: currentNode.enemy_id ?? null,
        };
    }
}/* , { immediate: true } // Az immediate itt felesleges lehet az onMounted miatt */);


const handleSubmit = async () => {
  successMessage.value = null;
  let result: AdminNodeData | null = null;

  if (isEditing.value && nodeId.value !== null) {
    // --- UPDATE ---
    console.log(`Submitting update for node ID: ${nodeId.value}`);
    result = await store.updateNode(nodeId.value, nodeData.value as AdminUpdateNodePayload);
    if (result) {
      successMessage.value = `Node (ID: ${result.id}) sikeresen frissítve!`;
    }
  } else {
    // --- CREATE ---
    console.log('Submitting create new node');
    result = await store.createNode(nodeData.value as AdminCreateNodePayload);
     if (result) {
        successMessage.value = `Node sikeresen létrehozva (ID: ${result.id})!`;
     }
  }

  if (result) { // Ha a create vagy update sikeres volt
    setTimeout(() => {
        router.push({ name: 'admin-nodes-list' });
    }, 1500);
  }
  // A store.error kezeli a hibaüzenetet a template-ben
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
</style>