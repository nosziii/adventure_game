<template>
  <div class="admin-node-edit">
    <h1>Új Story Node Létrehozása</h1>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="text">Szöveg:</label>
        <textarea id="text" v-model="nodeData.text" rows="5" required></textarea>
      </div>

      <div class="form-group">
        <label for="image">Kép URL (opcionális):</label>
        <input type="url" id="image" v-model="nodeData.image" />
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
          {{ store.isLoading ? 'Mentés...' : 'Mentés' }}
        </button>
        <router-link :to="{ name: 'admin-nodes-list' }" class="cancel-button">Mégse</router-link>
      </div>
      <p v-if="store.getError" class="error">{{ store.getError }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminNodesStore } from '../../../stores/adminNodes'; // Vagy relatív útvonal
import type { AdminCreateNodePayload, AdminNodeData } from '../../../types/admin.types'; // Vagy relatív útvonal

const store = useAdminNodesStore();
const router = useRouter();
const route = useRoute(); // A route paraméterek eléréséhez (később a szerkesztéshez)

// Az űrlap adatai (kezdetben CreateNodeDto alapján)
const nodeData = reactive<AdminCreateNodePayload>({
  text: '',
  image: null,
  is_end: false,
  health_effect: null,
  item_reward_id: null,
  enemy_id: null,
});

const successMessage = ref<string | null>(null);

// TODO: Később, a szerkesztéshez:
// const nodeId = ref<number | null>(null);
// onMounted(async () => {
//   if (route.params.id) {
//     nodeId.value = Number(route.params.id);
//     // Hívd meg a store.fetchNode(nodeId.value) akciót,
//     // és töltsd fel a nodeData-t a kapott értékekkel.
//   }
// });

const handleSubmit = async () => {
  successMessage.value = null; // Előző üzenet törlése
  // Létrehozás logikája
  // TODO: Később itt kell majd az updateNode-ot is hívni, ha nodeId.value létezik
  const newNode = await store.createNode(nodeData);
  if (newNode) {
    successMessage.value = `Node sikeresen létrehozva (ID: ${newNode.id})!`;
    // Opcionális: Visszairányítás a lista oldalra kis késleltetéssel
    setTimeout(() => {
        router.push({ name: 'admin-nodes-list' });
    }, 1500);
    // Vagy rögtön: router.push({ name: 'admin-nodes-list' });
  }
  // A store.error már kezeli a hibaüzenetet
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