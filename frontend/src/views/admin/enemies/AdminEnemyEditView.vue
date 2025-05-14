<template>
  <div class="admin-enemy-edit">
    <h1>{{ isEditing ? `Ellenség Szerkesztése (ID: ${enemyId})` : 'Új Ellenség Létrehozása' }}</h1>

    <div v-if="pageLoading">Adatok töltése...</div> <div v-else-if="store.getError || adminItemsStore.getError" class="error-message">
        Hiba történt:
        <span v-if="store.getError">{{ store.getError }}</span>
        <span v-if="adminItemsStore.getError">{{ adminItemsStore.getError }}</span>
    </div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
          <label for="name">Név:</label>
          <input type="text" id="name" v-model="enemyData.name" required />
      </div>
      <div class="form-group">
          <label for="xpReward">XP Jutalom:</label>
          <input type="number" id="xpReward" v-model.number="enemyData.xpReward" required min="0" />
      </div>

      <div class="form-group">
        <label for="itemDropId">Item Drop (opcionális):</label>
        <select id="itemDropId" v-model.number="enemyData.itemDropId">
          <option :value="null">Nincs drop</option>
          <option v-for="item in adminItemsStore.allItems" :key="item.id" :value="item.id">
            ID: {{ item.id }} - {{ item.name }}
          </option>
        </select>
      </div>

      <hr />
      <h2>Speciális Támadás (Opcionális)</h2>
      <div class="form-group">
        <label for="specialAttackName">Speciális Támadás Neve:</label>
        <input type="text" id="specialAttackName" v-model="enemyData.specialAttackName" />
      </div>
      <div class="form-actions">
        <button type="submit" :disabled="store.isLoading || pageLoading">
          {{ store.isLoading ? 'Mentés...' : (isEditing ? 'Módosítások Mentése' : 'Létrehozás') }}
        </button>
        <router-link :to="{ name: 'admin-enemies-list' }" class="cancel-button">Mégse</router-link>
      </div>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminEnemiesStore } from '../../../stores/adminEnemies'; // Vagy relatív útvonal
import type { AdminCreateEnemyPayload, AdminUpdateEnemyPayload, AdminEnemyData } from '../../../types/admin.types';
import { useAdminItemsStore } from '../../../stores/adminItems';   // <-- Item store import

const store = useAdminEnemiesStore();
const adminItemsStore = useAdminItemsStore(); // Item store példány
const router = useRouter();
const route = useRoute();

const enemyId = ref<number | null>(null);
const isEditing = computed(() => enemyId.value !== null);
const pageLoading = ref(false);

const getInitialEnemyData = (): AdminCreateEnemyPayload => ({
  name: '', health: 10, skill: 5, attackDescription: null, defeatText: null,
  itemDropId: null, xpReward: 0, specialAttackName: null,
  specialAttackDamageMultiplier: null, specialAttackChargeTurns: null,
  specialAttackTelegraphText: null, specialAttackExecuteText: null,
});

const enemyData = ref<AdminCreateEnemyPayload | AdminUpdateEnemyPayload>(getInitialEnemyData());
const successMessage = ref<string | null>(null);

onMounted(async () => {
  pageLoading.value = true;
  store.error = null;
  adminItemsStore.error = null;

  const fetchItemsPromise = adminItemsStore.fetchItems(); // Item lista lekérése a dropdownhoz

  const idParam = route.params.id;
  if (idParam) {
    const idToFetch = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(idToFetch)) {
      enemyId.value = idToFetch;
      await store.fetchEnemy(enemyId.value); // Ez beállítja a store.currentEnemy-t
    } else {
      store.error = "Érvénytelen Ellenség ID."; enemyId.value = null;
      enemyData.value = getInitialEnemyData();
    }
  } else {
    store.currentEnemy = null;
    enemyData.value = getInitialEnemyData();
  }

  try {
    await fetchItemsPromise;
  } catch (listError) {
    console.error("Failed to fetch items list for dropdown", listError);
  }
  pageLoading.value = false;
});

watch(() => store.getCurrentEnemy, (currentEnemy) => {
    if (isEditing.value && currentEnemy) {
        enemyData.value = {
            name: currentEnemy.name,
            health: currentEnemy.health,
            skill: currentEnemy.skill,
            attackDescription: currentEnemy.attackDescription ?? null,
            defeatText: currentEnemy.defeatText ?? null,
            itemDropId: currentEnemy.itemDropId ?? null,
            xpReward: currentEnemy.xpReward,
            specialAttackName: currentEnemy.specialAttackName ?? null,
            specialAttackDamageMultiplier: currentEnemy.specialAttackDamageMultiplier ?? null,
            specialAttackChargeTurns: currentEnemy.specialAttackChargeTurns ?? null,
            specialAttackTelegraphText: currentEnemy.specialAttackTelegraphText ?? null,
            specialAttackExecuteText: currentEnemy.specialAttackExecuteText ?? null,
        };
    } else if (!isEditing.value){
         enemyData.value = getInitialEnemyData();
    }
}, { immediate: true, deep: true });


const handleSubmit = async () => {
  successMessage.value = null;
  store.error = null;
  let result: AdminEnemyData | null = null;

  if (!enemyData.value.name || enemyData.value.health === null || enemyData.value.skill === null || enemyData.value.xpReward === null) {
      store.error = "A Név, Életerő, Ügyesség és XP Jutalom kitöltése kötelező!";
      return;
  }

  if (isEditing.value && enemyId.value !== null) {
    result = await store.updateEnemy(enemyId.value, enemyData.value as AdminUpdateEnemyPayload);
    if (result) successMessage.value = `Ellenség (ID: ${result.id}) sikeresen frissítve!`;
  } else {
    result = await store.createEnemy(enemyData.value as AdminCreateEnemyPayload);
    if (result) successMessage.value = `Ellenség sikeresen létrehozva (ID: ${result.id})!`;
  }

  if (result) {
    setTimeout(() => router.push({ name: 'admin-enemies-list' }), 1500);
  }
};
</script>

<style scoped>
/* Hasonló stílusok, mint az AdminNodeEditView */
.admin-enemy-edit { padding: 20px; max-width: 600px; margin: auto; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
}
.form-group textarea { min-height: 60px; }
.form-actions { margin-top: 20px; }
.form-actions button { padding: 10px 15px; margin-right: 10px; }
.cancel-button { padding: 10px 15px; text-decoration: none; background-color: #6c757d; color:white; border-radius: 4px;}
.error-message { color: red; margin-top: 10px; }
.success-message { color: green; margin-top: 10px; }
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}
hr { margin: 20px 0; }
select {
  width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background-color: white;
}
.admin-enemy-edit { padding: 20px; max-width: 600px; margin: auto; }
</style>