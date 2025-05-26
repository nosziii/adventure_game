<template>
  <div class="admin-archetype-edit">
    <h1>{{ isEditing ? `Archetípus Szerkesztése (ID: ${archetypeId})` : 'Új Archetípus Létrehozása' }}</h1>

    <div v-if="pageLoading" class="loading-message">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-message">
        Hiba: {{ store.getError }}
    </div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
        <label for="name">Név:</label>
        <input type="text" id="name" v-model="archetypeData.name" required />
      </div>

      <div class="form-group">
        <label for="description">Leírás:</label>
        <textarea id="description" v-model="archetypeData.description" rows="3" required></textarea>
      </div>

      <div class="form-group">
        <label for="iconPath">Ikon Elérési Útja (pl. /images/archetypes/warrior.png):</label>
        <input type="text" id="iconPath" v-model="archetypeData.iconPath" />
      </div>

      <h3 class="sub-header">Alap Statisztika Bónuszok</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="baseHealthBonus">Életerő Bónusz:</label>
          <input type="number" id="baseHealthBonus" v-model.number="archetypeData.baseHealthBonus" min="0" />
        </div>
        <div class="form-group">
          <label for="baseSkillBonus">Skill Bónusz:</label>
          <input type="number" id="baseSkillBonus" v-model.number="archetypeData.baseSkillBonus" min="0" />
        </div>
        <div class="form-group">
          <label for="baseLuckBonus">Luck Bónusz:</label>
          <input type="number" id="baseLuckBonus" v-model.number="archetypeData.baseLuckBonus" min="0" />
        </div>
        <div class="form-group">
          <label for="baseStaminaBonus">Stamina Bónusz:</label>
          <input type="number" id="baseStaminaBonus" v-model.number="archetypeData.baseStaminaBonus" min="0" />
        </div>
        <div class="form-group">
          <label for="baseDefenseBonus">Defense Bónusz:</label>
          <input type="number" id="baseDefenseBonus" v-model.number="archetypeData.baseDefenseBonus" min="0" />
        </div>
      </div>

      <div class="form-group">
        <label for="startingAbilityIds">Kezdő Képesség ID-k (vesszővel elválasztva, pl. 1,5,12):</label>
        <input type="text" id="startingAbilityIds" v-model="startingAbilityIdsString" placeholder="pl. 1, 5, 12" />
        <small>Hagyd üresen, ha nincsenek kezdő képességek.</small>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="store.isLoading || pageLoading">
          {{ store.isLoading ? 'Mentés...' : (isEditing ? 'Módosítások Mentése' : 'Létrehozás') }}
        </button>
        <router-link :to="{ name: 'admin-archetypes-list' }" class="cancel-button">Mégse</router-link>
      </div>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      <p v-if="localError" class="error-message">{{ localError }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminArchetypesStore } from '../../../stores/adminArchetypes';
import type { AdminCreateArchetypePayload, AdminUpdateArchetypePayload, AdminArchetypeData } from '../../../types/admin.types';
// TODO: Később importálhatnánk az adminAbilitiesStore-t egy multi-selecthez a startingAbilityIds-hez

const store = useAdminArchetypesStore();
const router = useRouter();
const route = useRoute();

const archetypeId = ref<number | null>(null);
const isEditing = computed(() => archetypeId.value !== null);
const pageLoading = ref(false);
const successMessage = ref<string | null>(null);
const localError = ref<string|null>(null);

const getInitialArchetypeData = (): AdminCreateArchetypePayload => ({
  name: '',
  description: '',
  iconPath: null,
  baseHealthBonus: 0,
  baseSkillBonus: 0,
  baseLuckBonus: 0,
  baseStaminaBonus: 0,
  baseDefenseBonus: 0,
  startingAbilityIds: [], // Kezdetben üres tömb
});

const archetypeData = ref<AdminCreateArchetypePayload | AdminUpdateArchetypePayload>(getInitialArchetypeData());
// A startingAbilityIds-t külön stringként kezeljük az űrlapon
const startingAbilityIdsString = ref<string>('');

onMounted(async () => {
  pageLoading.value = true;
  store.error = null;
  // TODO: Ha a startingAbilityIds-hez multi-selectet akarunk, itt kellene lekérni az adminAbilitiesStore.fetchAbilities()-t

  const idParam = route.params.id;
  if (idParam) {
    const idToFetch = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(idToFetch)) {
      archetypeId.value = idToFetch;
      const fetched = await store.fetchArchetype(archetypeId.value);
      if (!fetched) archetypeId.value = null;
    } else {
      store.error = "Érvénytelen Archetípus ID."; archetypeId.value = null;
    }
  } else {
    store.currentArchetype = null;
  }
  // Az űrlap feltöltése a watch-ra bízva
  pageLoading.value = false;
});

watch(() => store.getCurrentArchetype, (currentArchetype) => {
    localError.value = null;
    if (isEditing.value && currentArchetype) {
        archetypeData.value = { ...currentArchetype }; // Másoljuk az adatokat
        // A startingAbilityIds (number[]) stringgé alakítása a text inputhoz
        startingAbilityIdsString.value = currentArchetype.startingAbilityIds ? currentArchetype.startingAbilityIds.join(', ') : '';
    } else if (!isEditing.value) {
        archetypeData.value = getInitialArchetypeData();
        startingAbilityIdsString.value = '';
    }
}, { immediate: true, deep: true });


const handleSubmit = async () => {
  successMessage.value = null;
  store.error = null;
  localError.value = null;
  let result: AdminArchetypeData | null = null;

  if (!archetypeData.value.name || !archetypeData.value.description) {
      store.error = "A Név és Leírás kitöltése kötelező!";
      return;
  }

  // startingAbilityIdsString átalakítása number[]-re
  let parsedAbilityIds: number[] | null = null;
  if (startingAbilityIdsString.value.trim() !== '') {
      parsedAbilityIds = startingAbilityIdsString.value
          .split(',')
          .map(idStr => parseInt(idStr.trim(), 10))
          .filter(idNum => !isNaN(idNum) && idNum > 0);
      if (parsedAbilityIds.length === 0 && startingAbilityIdsString.value.trim() !== '') { // Ha volt input, de nem lett belőle valid ID
          localError.value = "A Kezdő Képesség ID-k érvénytelen formátumúak (számok legyenek, vesszővel elválasztva).";
          return;
      }
  }
  
  const payload = { 
      ...archetypeData.value, 
      startingAbilityIds: parsedAbilityIds // A feldolgozott tömböt vagy null-t küldjük
  };
  // Biztosítjuk, hogy a numerikus bónuszok tényleg számok legyenek, vagy null, ha nem adtunk meg
  payload.baseHealthBonus = Number(payload.baseHealthBonus) || 0;
  payload.baseSkillBonus = Number(payload.baseSkillBonus) || 0;
  payload.baseLuckBonus = Number(payload.baseLuckBonus) || 0;
  payload.baseStaminaBonus = Number(payload.baseStaminaBonus) || 0;
  payload.baseDefenseBonus = Number(payload.baseDefenseBonus) || 0;


  if (isEditing.value && archetypeId.value !== null) {
    result = await store.updateArchetype(archetypeId.value, payload as AdminUpdateArchetypePayload);
    if (result) successMessage.value = `Archetípus (ID: ${result.id}) sikeresen frissítve!`;
  } else {
    result = await store.createArchetype(payload as AdminCreateArchetypePayload);
    if (result) successMessage.value = `Archetípus sikeresen létrehozva (ID: ${result.id})!`;
  }

  if (result) {
    setTimeout(() => router.push({ name: 'admin-archetypes-list' }), 1500);
  }
};
</script>

<style scoped>
.admin-archetype-edit {
  padding: 2rem;
  max-width: 800px;
  margin: 80px auto;
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

h3.sub-header {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: var(--accent-secondary);
  border-bottom: 1px solid var(--panel-border);
  padding-bottom: 0.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 0.4rem;
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
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--input-focus-border);
  outline: none;
}

textarea {
  min-height: 100px;
}

small {
  color: var(--placeholder-text);
  margin-top: 0.3rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 1.5rem;
}

button {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
  border: none;
  background: var(--button-bg);
  color: var(--button-text);
  margin-right: 0.8rem;
}

button:hover {
  background: var(--button-hover-bg);
}

.cancel-button {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--accent-secondary);
  color: var(--accent-secondary);
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background: var(--accent-secondary);
  color: white;
}

.loading-message {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.error-message {
  background-color: rgba(160, 32, 32, 0.2);
  color: #ffcfcf;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #cc5555;
  margin-bottom: 1rem;
}

.success-message {
  color: #37ff8b;
  margin-top: 1rem;
}
</style>
