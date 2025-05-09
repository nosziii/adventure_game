<template>
  <div class="admin-enemy-list">
    <h1>Ellenségek Kezelése</h1>
    <div v-if="store.isLoading">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error">Hiba: {{ store.getError }}</div>
    <div v-else>
      <button @click="goToCreateEnemy" class="create-button">Új Ellenség Létrehozása</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Név</th>
            <th>HP</th>
            <th>Skill</th>
            <th>XP Jutalom</th>
            <th>Item Drop ID</th>
            <th>Műveletek</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="enemy in store.allEnemies" :key="enemy.id">
            <td>{{ enemy.id }}</td>
            <td>{{ enemy.name }}</td>
            <td>{{ enemy.health }}</td>
            <td>{{ enemy.skill }}</td>
            <td>{{ enemy.xpReward }}</td>
            <td>{{ enemy.itemDropId || '-' }}</td>
            <td>
              <button @click="goToEditEnemy(enemy.id)" class="edit-button">Szerkesztés</button>
              <button @click="handleDeleteEnemy(enemy.id, enemy.name)" class="delete-button">Törlés (TODO)</button>
            </td>
          </tr>
          <tr v-if="store.allEnemies.length === 0">
            <td colspan="7">Nincsenek még ellenségek.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminEnemiesStore } from '../../../stores/adminEnemies'; // Vagy relatív útvonal

const store = useAdminEnemiesStore();
const router = useRouter();

onMounted(() => {
  store.fetchEnemies();
});

const goToCreateEnemy = () => {
  router.push({ name: 'admin-enemies-new' });
};

const goToEditEnemy = (id: number) => {
   router.push({ name: 'admin-enemies-edit', params: { id: id.toString() } });
};

const handleDeleteEnemy = async (id: number, enemyName: string) => {
  // Megerősítés kérése a felhasználótól
  if (confirm(`Biztosan törölni akarod a következő ellenséget?\n\nID: ${id}\nNév: "${enemyName}"`)) {
    console.log(`User confirmed deletion for enemy ID: ${id}`);
    await store.deleteEnemy(id);
    // A store.error már kezeli a hibaüzeneteket, ha a törlés nem sikerül
    // Ha a store akció sikeres, a lista automatikusan frissül, mert a state.enemies változik
  } else {
    console.log(`User cancelled deletion for enemy ID: ${id}`);
  }
};
</script>

<style scoped>
/* Hasonló stílusok, mint a többi admin listázó nézetnél */
.admin-enemy-list { padding: 20px; }
.create-button { margin-bottom: 15px; padding: 8px 12px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
th { background-color: #f2f2f2; }
.edit-button, .delete-button { padding: 4px 8px; font-size: 0.9em; margin-right: 5px; cursor: pointer; }
.delete-button { background-color: #dc3545; color: white; border-color: #dc3545; }
.error { color: red; }
</style>