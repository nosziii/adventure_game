<template>
  <div class="admin-enemy-edit">
    <h1>{{ isEditing ? `Ellenség Szerkesztése (ID: ${enemyId})` : 'Új Ellenség Létrehozása' }}</h1>

    <div v-if="pageLoading" class="status-text">Adatok töltése...</div>
    <div v-else-if="store.getError || adminItemsStore.getError" class="error-box">
      <p><strong>Hiba történt:</strong></p>
      <p v-if="store.getError">{{ store.getError }}</p>
      <p v-if="adminItemsStore.getError">{{ adminItemsStore.getError }}</p>
    </div>

    <form @submit.prevent="handleSubmit" v-else class="enemy-form">
      <div class="form-group">
        <label for="name">Név</label>
        <input type="text" id="name" v-model="enemyData.name" required />
      </div>

      <div class="form-group">
        <label for="xpReward">XP Jutalom</label>
        <input type="number" id="xpReward" v-model.number="enemyData.xpReward" required min="0" />
      </div>

      <div class="form-group">
        <label for="itemDropId">Item Drop (opcionális)</label>
        <select id="itemDropId" v-model.number="enemyData.itemDropId">
          <option :value="null">Nincs drop</option>
          <option v-for="item in adminItemsStore.allItems" :key="item.id" :value="item.id">
            ID: {{ item.id }} – {{ item.name }}
          </option>
        </select>
      </div>

      <hr />

      <h2>Speciális Támadás (opcionális)</h2>
      <div class="form-group">
        <label for="specialAttackName">Támadás Neve</label>
        <input type="text" id="specialAttackName" v-model="enemyData.specialAttackName" />
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="store.isLoading || pageLoading">
          {{ store.isLoading ? 'Mentés...' : isEditing ? 'Módosítások Mentése' : 'Létrehozás' }}
        </button>
        <router-link :to="{ name: 'admin-enemies-list' }" class="btn btn-secondary">Mégse</router-link>
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
.admin-enemy-edit {
  padding: 2rem;
  max-width: 700px;
  margin: auto;
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

hr {
  border: none;
  border-top: 1px solid var(--panel-border);
  margin: 2rem 0;
}

h2 {
  font-size: 1.2rem;
  color: var(--accent-secondary);
  margin-bottom: 1rem;
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

.enemy-form {
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
