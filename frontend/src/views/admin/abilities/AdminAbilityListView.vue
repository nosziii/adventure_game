<template>
  <div class="admin-ability-list">
    <h1>Képességek Kezelése</h1>
    <div v-if="store.isLoading">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error">Hiba: {{ store.getError }}</div>
    <div v-else>
      <button @click="goToCreateAbility" class="create-button">Új Képesség Létrehozása</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Név</th>
            <th>Típus</th>
            <th>Költség (TP)</th>
            <th>Szint Köv.</th>
            <th>Műveletek</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ability in store.allAbilities" :key="ability.id">
            <td>{{ ability.id }}</td>
            <td>{{ ability.name }}</td>
            <td>{{ ability.type }}</td>
            <td>{{ ability.talentPointCost }}</td>
            <td>{{ ability.levelRequirement }}</td>
            <td>
              <button @click="goToEditAbility(ability.id)" class="edit-button">Szerkesztés</button>
              <button @click="handleDeleteAbility(ability.id, ability.name)" class="delete-button">Törlés (TODO)</button>
            </td>
          </tr>
          <tr v-if="store.allAbilities.length === 0">
            <td colspan="6">Nincsenek még képességek.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminAbilitiesStore } from '../../../stores/adminAbilities';

const store = useAdminAbilitiesStore();
const router = useRouter();

onMounted(() => {
  store.fetchAbilities();
});

const goToCreateAbility = () => {
  router.push({ name: 'admin-abilities-new' });
};

const goToEditAbility = (id: number) => {
   router.push({ name: 'admin-abilities-edit', params: { id: id.toString() } });
};

const handleDeleteAbility = async (id: number, abilityName: string) => {
  // Megerősítés kérése a felhasználótól
  if (confirm(`Biztosan törölni akarod a következő képességet?\n\nID: ${id}\nNév: "${abilityName}"`)) {
    console.log(`User confirmed deletion for ability ID: ${id}`);
    await store.deleteAbility(id);
    // A store.error már kezeli a hibaüzeneteket, ha a törlés nem sikerül
    // Ha a store akció sikeres, a lista automatikusan frissül, mert a state.abilities változik
  } else {
    console.log(`User cancelled deletion for ability ID: ${id}`);
  }
};
</script>

<style scoped>
/* Hasonló stílusok, mint a többi admin listázó nézetnél */
.admin-ability-list { padding: 20px; }
/* ... (többi stílus) ... */
</style>