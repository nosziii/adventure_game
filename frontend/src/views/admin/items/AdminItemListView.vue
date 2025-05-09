<template>
  <div class="admin-item-list">
    <h1>Tárgyak Kezelése</h1>
    <div v-if="store.isLoading">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error">Hiba: {{ store.getError }}</div>
    <div v-else>
      <button @click="goToCreateItem" class="create-button">Új Tárgy Létrehozása</button>
      <table>
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
            <td>{{ item.usable ? 'Igen' : 'Nem' }}</td>
            <td>
              <button @click="goToEditItem(item.id)" class="edit-button">Szerkesztés</button>
              <button @click="handleDeleteItem(item.id, item.name)" class="delete-button">Törlés (TODO)</button>
            </td>
          </tr>
          <tr v-if="store.allItems.length === 0">
            <td colspan="6">Nincsenek még tárgyak.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminItemsStore } from '../../../stores/adminItems'; // Vagy relatív útvonal

const store = useAdminItemsStore();
const router = useRouter();

onMounted(() => {
  store.fetchItems();
});

const goToCreateItem = () => {
  router.push({ name: 'admin-items-new' });
};

const goToEditItem = (id: number) => {
   router.push({ name: 'admin-items-edit', params: { id: id.toString() } });
};

const handleDeleteItem = async (id: number, itemName: string) => {
  // Megerősítés kérése a felhasználótól
  if (confirm(`Biztosan törölni akarod a következő tárgyat?\n\nID: ${id}\nNév: "${itemName}"`)) {
    console.log(`User confirmed deletion for item ID: ${id}`);
    await store.deleteItem(id);
  } else {
    console.log(`User cancelled deletion for item ID: ${id}`);
  }
};
</script>

<style scoped>
/* Hasonló stílusok, mint az AdminNodeListView/AdminChoiceListView */
.admin-item-list { padding: 20px; }
.create-button { margin-bottom: 15px; padding: 8px 12px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
th { background-color: #f2f2f2; }
.edit-button, .delete-button { padding: 4px 8px; font-size: 0.9em; margin-right: 5px; cursor: pointer; }
.delete-button { background-color: #dc3545; color: white; border-color: #dc3545; }
.error { color: red; }
</style>