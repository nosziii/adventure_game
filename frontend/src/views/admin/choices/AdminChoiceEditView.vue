<template>
  <div class="admin-choice-edit">
    <h1>{{ isEditing ? `Választás Szerkesztése (ID: ${choiceId})` : 'Új Választás Létrehozása' }}</h1>

    <div v-if="isEditing && store.isLoadingCurrent">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-message">{{ store.getError }}</div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
        <label for="sourceNodeId">Forrás Node ID:</label>
        <input type="number" id="sourceNodeId" v-model.number="choiceData.sourceNodeId" required min="1" />
        </div>

      <div class="form-group">
        <label for="targetNodeId">Cél Node ID:</label>
        <input type="number" id="targetNodeId" v-model.number="choiceData.targetNodeId" required min="1" />
        </div>

      <div class="form-group">
        <label for="text">Szöveg:</label>
        <textarea id="text" v-model="choiceData.text" rows="3" required></textarea>
      </div>

      <div class="form-group">
        <label for="requiredItemId">Szükséges Tárgy ID (opcionális):</label>
        <input type="number" id="requiredItemId" v-model.number="choiceData.requiredItemId" min="1" />
         </div>

      <div class="form-group">
        <label for="itemCostId">Tárgy Költség ID (opcionális):</label>
        <input type="number" id="itemCostId" v-model.number="choiceData.itemCostId" min="1" />
         </div>

      <div class="form-group">
        <label for="requiredStatCheck">Statisztika Feltétel (opcionális, pl. "skill >= 10"):</label>
        <input type="text" id="requiredStatCheck" v-model="choiceData.requiredStatCheck" />
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="store.isLoading">
          {{ store.isLoading ? 'Mentés...' : (isEditing ? 'Módosítások Mentése' : 'Létrehozás') }}
        </button>
        <router-link :to="{ name: 'admin-choices-list' }" class="cancel-button">Mégse</router-link>
      </div>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminChoicesStore } from '../../../stores/adminChoices'; // Vagy relatív útvonal
import type { AdminCreateChoicePayload, AdminUpdateChoicePayload, AdminChoiceData } from '../../../types/admin.types';

const store = useAdminChoicesStore();
const router = useRouter();
const route = useRoute();

const choiceId = ref<number | null>(null);
const isEditing = computed(() => choiceId.value !== null);

// Az űrlap adatai
const choiceData = ref<AdminCreateChoicePayload | AdminUpdateChoicePayload>({
  sourceNodeId: 0, // Vagy egy valid alapértelmezett, vagy null és validáció
  targetNodeId: 0,
  text: '',
  requiredItemId: null,
  itemCostId: null,
  requiredStatCheck: null,
});

const successMessage = ref<string | null>(null);

onMounted(async () => {
  const idParam = route.params.id;
  if (idParam) {
    choiceId.value = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(choiceId.value)) {
      console.log(`Editing choice with ID: ${choiceId.value}`);
      const success = await store.fetchChoice(choiceId.value);
      // A watchEffect lentebb kezeli az űrlap feltöltését
      if(!success) choiceId.value = null; // Hiba esetén visszaállítjuk create módra
    } else {
        console.error("Invalid choice ID in route parameter:", route.params.id);
        store.error = "Érvénytelen Választás ID.";
        choiceId.value = null;
    }
  } else {
      console.log('Creating new choice.');
      store.currentChoice = null; // Előző szerkesztett törlése
      // Alapértelmezett értékek új choice-hoz
      choiceData.value = { sourceNodeId: 0, targetNodeId: 0, text: '', requiredItemId: null, itemCostId: null, requiredStatCheck: null };
  }
});

// Figyeljük a store currentChoice változását, és betöltjük az űrlapba
watch(() => store.getCurrentChoice, (currentChoice) => {
    if (isEditing.value && currentChoice) {
        console.log('Populating form with fetched choice data:', currentChoice);
        choiceData.value = { // Ne felejtsük el, hogy a DTO camelCase, a DB snake_case lehet
            sourceNodeId: currentChoice.sourceNodeId,
            targetNodeId: currentChoice.targetNodeId,
            text: currentChoice.text,
            requiredItemId: currentChoice.requiredItemId ?? null,
            itemCostId: currentChoice.itemCostId ?? null,
            requiredStatCheck: currentChoice.requiredStatCheck ?? null,
        };
    } else if (!isEditing.value) { // Create módban ürítsük, ha pl. szerkesztésből jövünk ide
         choiceData.value = { sourceNodeId: 0, targetNodeId: 0, text: '', requiredItemId: null, itemCostId: null, requiredStatCheck: null };
    }
}, { immediate: true }); // immediate: true, hogy betöltéskor is lefusson, ha már van currentChoice


const handleSubmit = async () => {
  successMessage.value = null;
  store.error = null; // Hiba törlése
  let result: AdminChoiceData | null = null;

  // Validáció (egyszerű példa, class-validator jobb lenne a DTO-ban)
  if (!choiceData.value.sourceNodeId || !choiceData.value.targetNodeId || !choiceData.value.text) {
      store.error = "A Forrás Node ID, Cél Node ID és Szöveg kitöltése kötelező!";
      return;
  }

  if (isEditing.value && choiceId.value !== null) {
    result = await store.updateChoice(choiceId.value, choiceData.value as AdminUpdateChoicePayload);
    if (result) successMessage.value = `Választás (ID: ${result.id}) sikeresen frissítve!`;
  } else {
    result = await store.createChoice(choiceData.value as AdminCreateChoicePayload);
    if (result) successMessage.value = `Választás sikeresen létrehozva (ID: ${result.id})!`;
  }

  if (result) {
    setTimeout(() => router.push({ name: 'admin-choices-list' }), 1500);
  }
};
</script>

<style scoped>
/* Hasonló stílusok, mint az AdminNodeEditView */
.admin-choice-edit { padding: 20px; max-width: 600px; margin: auto; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
}
.form-group textarea { min-height: 80px; }
.form-actions { margin-top: 20px; }
.form-actions button { padding: 10px 15px; margin-right: 10px; }
.cancel-button { padding: 10px 15px; text-decoration: none; background-color: #6c757d; color:white; border-radius: 4px;}
.error-message { color: red; margin-top: 10px; }
.success-message { color: green; margin-top: 10px; }
</style>