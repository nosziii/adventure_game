<template>
  <div class="admin-archetype-list">
    <header class="list-header">
      <h1>Karakter Archetípusok Kezelése</h1>
      <button @click="goToCreateArchetype" class="btn btn-primary">+ Új Archetípus</button>
    </header>

    <div v-if="store.isLoading" class="status-text">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-box">Hiba: {{ store.getError }}</div>

    <div v-else>
      <div v-if="store.allArchetypes.length === 0" class="empty-state">
        Nincsenek még karakter archetípusok.
      </div>

      <div v-else class="table-wrapper">
        <table class="archetype-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Név</th>
              <th>Leírás</th>
              <th>Kezdő Képességek</th>
              <th>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="archetype in store.allArchetypes" :key="archetype.id">
              <td>{{ archetype.id }}</td>
              <td>{{ archetype.name }}</td>
              <td>{{ archetype.description ? archetype.description.substring(0,50) + '...' : '-' }}</td>
              <td>{{ archetype.startingAbilityIds ? archetype.startingAbilityIds.join(', ') : '-' }}</td>
              <td>
                <button @click="goToEditArchetype(archetype.id)" class="btn btn-secondary">✏️ Szerkesztés</button>
                <button @click="handleDeleteArchetype(archetype.id, archetype.name)" class="btn btn-danger">🗑️ Törlés</button>
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
import { useAdminArchetypesStore } from '../../../stores/adminArchetypes';

const store = useAdminArchetypesStore();
const router = useRouter();

onMounted(() => {
  store.fetchArchetypes();
});

const goToCreateArchetype = () => {
  router.push({ name: 'admin-archetypes-new' });
};

const goToEditArchetype = (id: number) => {
   router.push({ name: 'admin-archetypes-edit', params: { id: id.toString() } });
};

const handleDeleteArchetype = async (id: number, archetypeName: string) => {
  // Megerősítés kérése a felhasználótól
  if (confirm(`Biztosan törölni akarod a következő karakter archetípust?\n\nID: ${id}\nNév: "${archetypeName}"`)) {
    console.log(`User confirmed deletion for archetype ID: ${id}`);
    await store.deleteArchetype(id);
    // A store.error már kezeli a hibaüzeneteket, ha a törlés nem sikerül
    // Ha a store akció sikeres, a lista automatikusan frissül, mert a state.archetypes változik
  } else {
    console.log(`User cancelled deletion for archetype ID: ${id}`);
  }
};
</script>
<style scoped>
.admin-archetype-list {
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

.archetype-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  color: var(--text-primary);
}

.archetype-table th,
.archetype-table td {
  border: 1px solid var(--panel-border);
  padding: 0.75rem;
  text-align: left;
}

.archetype-table th {
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
