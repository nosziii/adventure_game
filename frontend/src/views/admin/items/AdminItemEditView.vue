<template>
  <div class="admin-item-edit">
    <h1>{{ isEditing ? `Tárgy Szerkesztése (ID: ${itemId})` : 'Új Tárgy Létrehozása' }}</h1>

    <div v-if="isEditing && store.isLoadingCurrent">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-message">{{ store.getError }}</div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
        <label for="name">Név:</label>
        <input type="text" id="name" v-model="itemData.name" required />
      </div>

      <div class="form-group">
        <label for="description">Leírás (opcionális):</label>
        <textarea id="description" v-model="itemData.description" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label for="type">Típus:</label>
        <input type="text" id="type" v-model="itemData.type" required placeholder="pl. weapon, potion, key, armor" />
      </div>

      <div class="form-group">
        <label for="effect">Effekt (opcionális, pl. "skill+2;damage+5" vagy "heal+30"):</label>
        <input type="text" id="effect" v-model="itemData.effect" />
      </div>

      <div class="form-group checkbox-group">
        <input type="checkbox" id="usable" v-model="itemData.usable" />
        <label for="usable">Használható (inventoryból aktívan)?</label>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="store.isLoading">
          {{ store.isLoading ? 'Mentés...' : (isEditing ? 'Módosítások Mentése' : 'Létrehozás') }}
        </button>
        <router-link :to="{ name: 'admin-items-list' }" class="cancel-button">Mégse</router-link>
      </div>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminItemsStore } from '../../../stores/adminItems'; // Vagy relatív útvonal
import type { AdminCreateItemPayload, AdminUpdateItemPayload, AdminItemData } from '../../../types/admin.types';

const store = useAdminItemsStore();
const router = useRouter();
const route = useRoute();

const itemId = ref<number | null>(null);
const isEditing = computed(() => itemId.value !== null);

// Az űrlap adatai
const itemData = ref<AdminCreateItemPayload | AdminUpdateItemPayload>({
  name: '',
  description: null,
  type: '', // Legyen alapértelmezetten string
  effect: null,
  usable: false,
});

const successMessage = ref<string | null>(null);

onMounted(async () => {
  const idParam = route.params.id;
  if (idParam) {
    const idToFetch = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(idToFetch)) {
      itemId.value = idToFetch;
      await store.fetchItem(itemId.value);
      // A watchEffect kezeli az űrlap feltöltését
    } else {
      store.error = "Érvénytelen Tárgy ID.";
      itemId.value = null;
    }
  } else {
    store.currentItem = null; // Ürítjük, ha create mód van
    itemData.value = { name: '', description: null, type: '', effect: null, usable: false };
  }
});

// Figyeljük a store currentItem változását
watch(() => store.getCurrentItem, (currentItem) => {
    if (isEditing.value && currentItem) {
        itemData.value = {
            name: currentItem.name,
            description: currentItem.description ?? null,
            type: currentItem.type,
            effect: currentItem.effect ?? null,
            usable: currentItem.usable,
        };
    } else if (!isEditing.value) { // Create módban ürítsük, ha pl. szerkesztésből jövünk ide
        itemData.value = { name: '', description: null, type: '', effect: null, usable: false };
    }
}, { immediate: true });


const handleSubmit = async () => {
  successMessage.value = null;
  store.error = null;
  let result: AdminItemData | null = null;

  if (!itemData.value.name || !itemData.value.type) {
      store.error = "A Név és Típus kitöltése kötelező!";
      return;
  }

  if (isEditing.value && itemId.value !== null) {
    result = await store.updateItem(itemId.value, itemData.value as AdminUpdateItemPayload);
    if (result) successMessage.value = `Tárgy (ID: ${result.id}) sikeresen frissítve!`;
  } else {
    result = await store.createItem(itemData.value as AdminCreateItemPayload);
    if (result) successMessage.value = `Tárgy sikeresen létrehozva (ID: ${result.id})!`;
  }

  if (result) {
    setTimeout(() => router.push({ name: 'admin-items-list' }), 1500);
  }
};
</script>

<style scoped>
/* Hasonló stílusok, mint az AdminNodeEditView */
.admin-item-edit { padding: 20px; max-width: 600px; margin: auto; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
}
.form-group textarea { min-height: 80px; }
.checkbox-group { display: flex; align-items: center; }
.checkbox-group input { margin-right: 8px; width: auto; }
.form-actions { margin-top: 20px; }
.form-actions button { padding: 10px 15px; margin-right: 10px; }
.cancel-button { padding: 10px 15px; text-decoration: none; background-color: #6c757d; color:white; border-radius: 4px;}
.error-message { color: red; margin-top: 10px; }
.success-message { color: green; margin-top: 10px; }
</style>