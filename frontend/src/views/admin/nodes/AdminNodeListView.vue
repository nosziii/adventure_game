<template>
  <div class="admin-node-list">
    <h1>Story Node-ok Kezelése</h1>
    <div v-if="store.isLoading">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error">Hiba: {{ store.getError }}</div>
    <div v-else>
      <button @click="goToCreate" class="create-button">Új Node Létrehozása</button>
      <table>
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
            <td>{{ node.is_end ? 'Igen' : 'Nem' }}</td>
            <td>{{ node.enemy_id ?? '-' }}</td>
            <td>{{ node.item_reward_id ?? '-' }}</td>
            <td>
              <button @click="goToEdit(node.id)" class="edit-button">Szerkesztés</button>
              <button @click="handleDeleteNode(node.id, node.text)" class="delete-button">Törlés</button>
            </td>
          </tr>
          <tr v-if="store.allNodes.length === 0">
            <td colspan="6">Nincsenek még story node-ok.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminNodesStore } from '../../../stores/adminNodes'; // Vagy relatív útvonal

const store = useAdminNodesStore();
const router = useRouter();

onMounted(() => {
  // Adatok lekérése a store-on keresztül
  store.fetchNodes();
});

// Segédfüggvény a szöveg rövidítésére
const truncateText = (text: string, length: number): string => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const goToCreate = () => {
  router.push({ name: 'admin-nodes-new' })
};

const goToEdit = (id: number) => {
  router.push({ name: 'admin-nodes-edit', params: { id } })
};

const handleDeleteNode = async (id: number, nodeText: string) => {
  // Megerősítés kérése a felhasználótól
  if (confirm(`Biztosan törölni akarod a következő node-ot?\n\nID: ${id}\nSzöveg: "${truncateText(nodeText, 100)}" `)) {
    console.log(`User confirmed deletion for node ID: ${id}`);
    await store.deleteNode(id);
    // A store.error már kezeli a hibaüzeneteket, ha a törlés nem sikerül
    // Ha a store akció sikeres, a lista automatikusan frissül, mert a state.nodes változik
  } else {
    console.log(`User cancelled deletion for node ID: ${id}`);
  }
};
</script>

<style scoped>
.admin-node-list { padding: 20px; }
.create-button { margin-bottom: 15px; padding: 8px 12px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
th { background-color: #f2f2f2; }
.edit-button, .delete-button { padding: 4px 8px; font-size: 0.9em; margin-right: 5px; cursor: pointer; }
.delete-button { background-color: #dc3545; color: white; border-color: #dc3545; }
.error { color: red; }
</style>