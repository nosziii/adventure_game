<template>
  <div class="admin-ability-list">
    <header class="list-header">
      <h1>Képességek Kezelése</h1>
      <button @click="goToCreateAbility" class="btn btn-primary">+ Új Képesség</button>
    </header>

    <div v-if="store.isLoading" class="status-text">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-box">Hiba: {{ store.getError }}</div>

    <div v-else>
      <div v-if="store.allAbilities.length === 0" class="empty-state">
        Nincsenek még képességek.
      </div>

      <div v-else class="table-wrapper">
        <table class="ability-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Név</th>
              <th>Típus</th>
              <th>Költség (TP)</th>
              <th>Szint Köv.</th>
              <th>Enged. Archetype ID-k</th> 
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
              <td>{{ ability.allowedArchetypeIds ? ability.allowedArchetypeIds.join(', ') : '-' }}</td> 
           
              <td>
                <button @click="goToEditAbility(ability.id)" class="btn btn-secondary">✏️ Szerkesztés</button>
                <button @click="handleDeleteAbility(ability.id, ability.name)" class="btn btn-danger">🗑️ Törlés</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
.admin-ability-list {
  padding: 2rem;
  margin-top: 80px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 1rem;
  box-shadow: 0 0 20px rgba(179, 136, 255, 0.1);
  backdrop-filter: blur(6px);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.list-header h1 {
  font-family: 'Cinzel Decorative', cursive;
  font-size: 1.8rem;
  color: var(--accent-primary);
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

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}

.table-wrapper {
  overflow-x: auto;
}

.ability-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  color: var(--text-primary);
}

.ability-table th,
.ability-table td {
  border: 1px solid var(--panel-border);
  padding: 0.75rem;
  text-align: left;
}

.ability-table th {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease;
  border: none;
  margin-right: 0.4rem;
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

.btn-danger {
  background: #862d45;
  color: white;
}

.btn-danger:hover {
  background: #aa3c5a;
}
</style>
