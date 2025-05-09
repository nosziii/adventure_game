<template>
  <div class="admin-enemy-edit">
    <h1>{{ isEditing ? `Ellenség Szerkesztése (ID: ${enemyId})` : 'Új Ellenség Létrehozása' }}</h1>

    <div v-if="isEditing && store.isLoadingCurrent">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-message">{{ store.getError }}</div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
        <label for="name">Név:</label>
        <input type="text" id="name" v-model="enemyData.name" required />
      </div>

      <div class="form-group">
        <label for="health">Életerő (HP):</label>
        <input type="number" id="health" v-model.number="enemyData.health" required min="1" />
      </div>

      <div class="form-group">
        <label for="skill">Ügyesség (Skill):</label>
        <input type="number" id="skill" v-model.number="enemyData.skill" required min="0" />
      </div>

      <div class="form-group">
        <label for="attackDescription">Támadás Leírása (opcionális):</label>
        <input type="text" id="attackDescription" v-model="enemyData.attackDescription" />
      </div>

      <div class="form-group">
        <label for="defeatText">Legyőzés Szövege (opcionális):</label>
        <textarea id="defeatText" v-model="enemyData.defeatText" rows="2"></textarea>
      </div>

      <div class="form-group">
        <label for="itemDropId">Item Drop ID (opcionális):</label>
        <input type="number" id="itemDropId" v-model.number="enemyData.itemDropId" min="1" />
        </div>

      <div class="form-group">
        <label for="xpReward">XP Jutalom:</label>
        <input type="number" id="xpReward" v-model.number="enemyData.xpReward" required min="0" />
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="store.isLoading">
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

const store = useAdminEnemiesStore();
const router = useRouter();
const route = useRoute();

const enemyId = ref<number | null>(null);
const isEditing = computed(() => enemyId.value !== null);

// Az űrlap adatai
const enemyData = ref<AdminCreateEnemyPayload | AdminUpdateEnemyPayload>({
  name: '',
  health: 10,
  skill: 5,
  attackDescription: null,
  defeatText: null,
  itemDropId: null,
  xpReward: 0,
});

const successMessage = ref<string | null>(null);

onMounted(async () => {
  const idParam = route.params.id;
  if (idParam) {
    const idToFetch = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(idToFetch)) {
      enemyId.value = idToFetch;
      await store.fetchEnemy(enemyId.value);
      // A watchEffect kezeli az űrlap feltöltését
    } else {
      store.error = "Érvénytelen Ellenség ID.";
      enemyId.value = null;
    }
  } else {
    store.currentEnemy = null; // Ürítjük, ha create mód van
    enemyData.value = { name: '', health: 10, skill: 5, attackDescription: null, defeatText: null, itemDropId: null, xpReward: 0 };
  }
});

// Figyeljük a store currentEnemy változását
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
        };
    } else if (!isEditing.value) {
        enemyData.value = { name: '', health: 10, skill: 5, attackDescription: null, defeatText: null, itemDropId: null, xpReward: 0 };
    }
}, { immediate: true });


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
</style>