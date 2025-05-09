<template>
  <div class="admin-choice-list">
    <h1>Választási Lehetőségek Kezelése</h1>
    <div v-if="store.isLoading">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error">Hiba: {{ store.getError }}</div>
    <div v-else>
      <button @click="goToCreateChoice" class="create-button">Új Választás Létrehozása</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Forrás Node ID</th>
            <th>Cél Node ID</th>
            <th>Szöveg (Részlet)</th>
            <th>Feltételek</th>
            <th>Műveletek</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="choice in store.allChoices" :key="choice.id">
            <td>{{ choice.id }}</td>
            <td>{{ choice.sourceNodeId }}</td>
            <td>{{ choice.targetNodeId }}</td>
            <td>{{ truncateText(choice.text, 40) }}</td>
            <td>
                <small v-if="choice.requiredItemId">Szükséges item: {{choice.requiredItemId}}</small><br>
                <small v-if="choice.itemCostId">Költség item: {{choice.itemCostId}}</small><br>
                <small v-if="choice.requiredStatCheck">Stat: {{choice.requiredStatCheck}}</small>
            </td>
            <td>
              <button @click="goToEditChoice(choice.id)" class="edit-button">Szerkesztés</button>
              <button @click="deleteChoice(choice.id)" class="delete-button">Törlés (TODO)</button>
            </td>
          </tr>
          <tr v-if="store.allChoices.length === 0">
            <td colspan="6">Nincsenek még választási lehetőségek.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'; // ref hozzáadva a szűrőhöz
import { useRouter } from 'vue-router';
import { useAdminChoicesStore } from '../../../stores/adminChoices'; // Vagy relatív útvonal

const store = useAdminChoicesStore();
const router = useRouter();

// const sourceNodeFilter = ref<number | null>(null); // Szűrőhöz később

onMounted(() => {
  // Kezdetben az összes választást lekérjük
  store.fetchChoices();
  // Vagy ha URL paraméterből jön a szűrő:
  // if (route.query.sourceNodeId) {
  //   sourceNodeFilter.value = Number(route.query.sourceNodeId);
  //   store.fetchChoices(sourceNodeFilter.value);
  // } else {
  //   store.fetchChoices();
  // }
});

// const applyFilter = () => {
//   store.fetchChoices(sourceNodeFilter.value ?? undefined);
// };
// const clearFilter = () => {
//   sourceNodeFilter.value = null;
//   store.fetchChoices();
// };

const truncateText = (text: string, length: number): string => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const goToCreateChoice = () => {
  router.push({ name: 'admin-choices-new' });
};

const goToEditChoice = (id: number) => {
   router.push({ name: 'admin-choices-edit', params: { id: id.toString() } });
};

const deleteChoice = (id: number) => {
    if (confirm(`Biztosan törölni akarod a(z) ${id} ID-jú választást?`)) {
       console.log(`Deleting choice ${id}... (TODO: Implement store action)`);
       // store.deleteChoice(id);
       alert(`Choice ${id} törlése még nincs implementálva.`);
    }
};
</script>

<style scoped>
/* Hasonló stílusok, mint az AdminNodeListView-nál */
.admin-choice-list { padding: 20px; }
.create-button { margin-bottom: 15px; padding: 8px 12px; }
/* .filter-bar { margin-bottom: 15px; } */
/* .filter-bar input { margin-right: 5px; } */
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
th { background-color: #f2f2f2; }
td small { display: block; font-size: 0.8em; color: #555; }
.edit-button, .delete-button { padding: 4px 8px; font-size: 0.9em; margin-right: 5px; cursor: pointer; }
.delete-button { background-color: #dc3545; color: white; border-color: #dc3545; }
.error { color: red; }
</style>