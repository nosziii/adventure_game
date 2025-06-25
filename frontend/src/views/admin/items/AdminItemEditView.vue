<template>
  <div class="admin-item-edit">
    <h1>{{ isEditing ? `Tárgy Szerkesztése (ID: ${itemId})` : 'Új Tárgy Létrehozása' }}</h1>

    <div v-if="isEditing && store.isLoadingCurrent" class="status-text">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-box">{{ store.getError }}</div>

    <form @submit.prevent="handleSubmit" v-else class="item-form">
      <div class="form-group">
        <label for="name">Név</label>
        <input type="text" id="name" v-model="itemData.name" required />
      </div>

      <div class="form-group">
        <label for="description">Leírás (opcionális)</label>
        <textarea id="description" v-model="itemData.description" rows="3" />
      </div>

      <div class="form-group">
        <label for="type">Típus</label>
        <input type="text" id="type" v-model="itemData.type" required placeholder="pl. weapon, potion, key, armor" />
      </div>

      <div class="form-group">
        <label for="effect">Effekt (opcionális)</label>
        <input type="text" id="effect" v-model="itemData.effect" />
      </div>

      <div class="form-group checkbox">
        <input type="checkbox" id="usable" v-model="itemData.usable" />
        <label for="usable">Használható (inventoryból aktívan)?</label>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="store.isLoading">
          {{ store.isLoading ? 'Mentés...' : isEditing ? 'Módosítások Mentése' : 'Létrehozás' }}
        </button>
        <router-link :to="{ name: 'admin-items-list' }" class="btn btn-secondary">Mégse</router-link>
      </div>

      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
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
.admin-item-edit {
  padding: 2rem;
  max-width: 700px;
  margin:80px auto;
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

.item-form {
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
textarea {
  padding: 0.6rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--input-text);
  border-radius: 0.5rem;
  transition: border 0.2s ease;
}

input:focus,
textarea:focus {
  border-color: var(--input-focus-border);
  outline: none;
}

.checkbox {
  flex-direction: row;
  align-items: center;
}

.checkbox input {
  margin-right: 0.5rem;
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
