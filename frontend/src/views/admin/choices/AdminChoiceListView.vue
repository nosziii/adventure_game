<template>
  <div class="admin-choice-list">
    <header class="list-header">
      <h1>Választási Lehetőségek Kezelése</h1>
      <button @click="goToCreateChoice" class="btn btn-primary">+ Új Választás</button>
    </header>

    <div v-if="store.isLoading" class="status-text">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error-box">Hiba: {{ store.getError }}</div>

    <div v-else>
      <div v-if="store.allChoices.length === 0" class="empty-state">
        Nincsenek még választási lehetőségek.
      </div>
      <div v-else class="table-wrapper">
        <table class="choice-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Forrás Node</th>
              <th>Cél Node</th>
              <th>Szöveg</th>
              <th>Feltételek</th>
              <th>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="choice in store.allChoices" :key="choice.id">
              <td>{{ choice.id }}</td>
              <td>{{ choice.sourceNodeId }}</td>
              <td>{{ choice.targetNodeId }}</td>
              <td>{{ truncateText(choice.text, 40) }}</td>
              <td>
                <small v-if="choice.requiredItemId">🎒 Szükséges: {{ choice.requiredItemId }}</small>
                <small v-if="choice.itemCostId">💸 Költség: {{ choice.itemCostId }}</small>
                <small v-if="choice.requiredStatCheck">📊 Stat: {{ choice.requiredStatCheck }}</small>
              </td>
              <td>
                <button @click="goToEditChoice(choice.id)" class="btn btn-secondary">✏️ Szerkesztés</button>
                <button @click="deleteChoice(choice.id)" class="btn btn-danger">🗑️ Törlés</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { onMounted } from 'vue'; // ref hozzáadva a szűrőhöz
import { useRouter } from 'vue-router';
import { useAdminChoicesStore } from '../../../stores/adminChoices'; // Vagy relatív útvonal

const store = useAdminChoicesStore();
const router = useRouter();

// const sourceNodeFilter = ref<number | null>(null); // Szűrőhöz később

onMounted(() => {
  // Kezdetben az összes választást lekérjük
  store.fetchChoices();
  // Vagy ha URL paraméterből jön a szűrő:
  // if (route.query.sourceNodeId) {
  //   sourceNodeFilter.value = Number(route.query.sourceNodeId);
  //   store.fetchChoices(sourceNodeFilter.value);
  // } else {
  //   store.fetchChoices();
  // }
});

// const applyFilter = () => {
//   store.fetchChoices(sourceNodeFilter.value ?? undefined);
// };
// const clearFilter = () => {
//   sourceNodeFilter.value = null;
//   store.fetchChoices();
// };

const truncateText = (text: string, length: number): string => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const goToCreateChoice = () => {
  router.push({ name: 'admin-choices-new' });
};

const goToEditChoice = (id: number) => {
   router.push({ name: 'admin-choices-edit', params: { id: id.toString() } });
};

const deleteChoice = (id: number) => {
    if (confirm(`Biztosan törölni akarod a(z) ${id} ID-jú választást?`)) {
       console.log(`Deleting choice ${id}... (TODO: Implement store action)`);
       // store.deleteChoice(id);
       alert(`Choice ${id} törlése még nincs implementálva.`);
    }
};
</script>

<style scoped>
.admin-choice-list {
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

.choice-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  color: var(--text-primary);
}

.choice-table th,
.choice-table td {
  border: 1px solid var(--panel-border);
  padding: 0.75rem;
  text-align: left;
}

.choice-table th {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.choice-table td small {
  display: block;
  font-size: 0.8rem;
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
