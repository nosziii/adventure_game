<template>
  <div class="admin-ability-edit">
    <h1>{{ isEditing ? `Képesség Szerkesztése (ID: ${abilityId})` : 'Új Képesség Létrehozása' }}</h1>

    <div v-if="pageLoading" class="loading-message">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-message">
        Hiba: {{ store.getError }}
    </div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
        <label for="name">Név:</label>
        <input type="text" id="name" v-model="abilityData.name" required />
      </div>

      <div class="form-group">
        <label for="description">Leírás:</label>
        <textarea id="description" v-model="abilityData.description" rows="3" required></textarea>
      </div>

      <div class="form-group">
        <label for="type">Típus:</label>
        <select id="type" v-model="abilityData.type" required>
          <option disabled :value="undefined">Válassz típust...</option>
          <option v-for="typeOption in store.getAbilityTypesArray" :key="typeOption.value" :value="typeOption.value">
            {{ typeOption.label }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="effectString">Effekt String (pl. "skill+2;damage+5" vagy "heal+30"):</label>
        <input type="text" id="effectString" v-model="abilityData.effectString" placeholder="statNév[+|-]érték;másikStat[+|-]érték"/>
      </div>
      
      <div class="form-grid">
        <div class="form-group">
          <label for="talentPointCost">Költség (Tehetségpont):</label>
          <input type="number" id="talentPointCost" v-model.number="abilityData.talentPointCost" required min="0" />
        </div>

        <div class="form-group">
          <label for="levelRequirement">Szint Követelmény:</label>
          <input type="number" id="levelRequirement" v-model.number="abilityData.levelRequirement" required min="1" />
        </div>
      </div>

      <div class="form-group">
        <label for="prerequisites">Előfeltételek (JSON tömb más Ability ID-kból, pl. [1,5] vagy üresen hagyva):</label>
        <input type="text" id="prerequisites" v-model="prerequisitesString" placeholder="[1, 5] vagy hagyd üresen" />
        <small>Add meg a szükséges képesség ID-kat JSON tömb formátumban, pl. `[1, 5]`.</small>
      </div>


      <div class="form-actions">
        <button type="submit" :disabled="store.isLoading || pageLoading">
          {{ store.isLoading ? 'Mentés...' : (isEditing ? 'Módosítások Mentése' : 'Létrehozás') }}
        </button>
        <router-link :to="{ name: 'admin-abilities-list' }" class="cancel-button">Mégse</router-link>
      </div>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      <p v-if="localError" class="error-message">{{ localError }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminAbilitiesStore } from '../../../stores/adminAbilities';
import type { AdminCreateAbilityPayload, AdminUpdateAbilityPayload, AdminAbilityData } from '../../../types/admin.types';
import { AbilityType } from '../../../types/admin.types';

const store = useAdminAbilitiesStore();
const router = useRouter();
const route = useRoute();

const abilityId = ref<number | null>(null);
const isEditing = computed(() => abilityId.value !== null);
const pageLoading = ref(false);
const successMessage = ref<string | null>(null);
const localError = ref<string|null>(null); // Helyi hibaüzenet pl. JSON parse-hoz

const getInitialAbilityData = (): AdminCreateAbilityPayload => ({
  name: '',
  description: '',
  type: AbilityType.PASSIVE_STAT, // Alapértelmezett típus
  effectString: null,
  talentPointCost: 1,
  levelRequirement: 1,
  prerequisites: null,
});

const abilityData = ref<AdminCreateAbilityPayload | AdminUpdateAbilityPayload>(getInitialAbilityData());
// A prerequisites mezőt külön stringként kezeljük a formban, majd konvertáljuk
const prerequisitesString = ref<string>('');


onMounted(async () => {
  pageLoading.value = true;
  store.error = null; // Korábbi store hiba törlése

  const idParam = route.params.id;
  if (idParam) {
    const idToFetch = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(idToFetch)) {
      abilityId.value = idToFetch;
      const fetched = await store.fetchAbility(abilityId.value);
      if (!fetched) abilityId.value = null; // Hiba esetén vissza create módba
    } else {
      store.error = "Érvénytelen Képesség ID."; abilityId.value = null;
    }
  } else {
    store.currentAbility = null; // Új képesség létrehozásakor
  }
  // Az űrlap feltöltése a watch-ra bízva
  pageLoading.value = false;
});

watch(() => store.getCurrentAbility, (currentAbility) => {
    localError.value = null; // Hiba törlése, ha a store adat változik
    if (isEditing.value && currentAbility) {
        abilityData.value = {
            name: currentAbility.name,
            description: currentAbility.description,
            type: currentAbility.type,
            effectString: currentAbility.effectString ?? null,
            talentPointCost: currentAbility.talentPointCost,
            levelRequirement: currentAbility.levelRequirement,
            prerequisites: currentAbility.prerequisites, // Ez már a helyes formátumban van a store-ból (any)
        };
        // A prerequisites-t stringgé alakítjuk a text inputhoz
        prerequisitesString.value = currentAbility.prerequisites ? JSON.stringify(currentAbility.prerequisites) : '';
    } else if (!isEditing.value) {
        abilityData.value = getInitialAbilityData();
        prerequisitesString.value = '';
    }
}, { immediate: true, deep: true });


const handleSubmit = async () => {
  successMessage.value = null;
  store.error = null;
  localError.value = null;
  let result: AdminAbilityData | null = null;

  if (!abilityData.value.name || !abilityData.value.description || !abilityData.value.type) {
      store.error = "A Név, Leírás és Típus kitöltése kötelező!";
      return;
  }

  let prerequisitesValue: any = null;
  if (prerequisitesString.value.trim() !== '') {
      try {
          prerequisitesValue = JSON.parse(prerequisitesString.value);
          // Opcionális validáció: if (!Array.isArray(prerequisitesValue) || !prerequisitesValue.every(id => Number.isInteger(id))) throw new Error...
      } catch (e) {
          localError.value = "Az Előfeltételek mező érvénytelen JSON formátumú (pl. [1,5] vagy hagyd üresen).";
          return;
      }
  }
  
  const payload = { ...abilityData.value, prerequisites: prerequisitesValue };

  if (isEditing.value && abilityId.value !== null) {
    result = await store.updateAbility(abilityId.value, payload as AdminUpdateAbilityPayload);
    if (result) successMessage.value = `Képesség (ID: ${result.id}) sikeresen frissítve!`;
  } else {
    result = await store.createAbility(payload as AdminCreateAbilityPayload);
    if (result) successMessage.value = `Képesség sikeresen létrehozva (ID: ${result.id})!`;
  }

  if (result) {
    setTimeout(() => router.push({ name: 'admin-abilities-list' }), 1500);
  }
};
</script>

<style scoped>
/* Hasonló stílusok, mint a többi Admin EditView */
.admin-ability-edit { padding: 20px; max-width: 700px; margin: auto; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
select, input[type="text"], input[type="number"], textarea {
  width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; margin-top: 4px;
}
textarea { min-height: 80px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-actions { margin-top: 20px; }
/* ... (gombok, üzenetek stílusa) ... */
.error-message { color: red; }
.success-message { color: green; }
small { font-size: 0.8em; color: #777; display: block; margin-top: 4px;}
</style>