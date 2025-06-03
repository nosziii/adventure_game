<template>
  <div class="admin-node-edit">
    <h1>{{ isEditing ? `Node Szerkesztése (ID: ${nodeId})` : 'Új Story Node Létrehozása' }}</h1>

    <div v-if="pageLoading" class="status-text">Adatok töltése...</div>

    <div
      v-else-if="store.getError || adminItemsStore.getError || adminEnemiesStore.getError"
      class="error-box"
    >
      <p><strong>Hiba történt:</strong></p>
      <p v-if="store.getError">{{ store.getError }}</p>
      <p v-if="adminItemsStore.getError">{{ adminItemsStore.getError }}</p>
      <p v-if="adminEnemiesStore.getError">{{ adminEnemiesStore.getError }}</p>
    </div>

    <form @submit.prevent="handleSubmit" v-else class="node-form">
      <div class="form-group">
        <label for="text">Szöveg:</label>
        <textarea id="text" v-model="nodeData.text" rows="5" required />
      </div>

      <div class="form-group">
        <label for="image">Kép URL (opcionális):</label>
        <input type="url" id="image" v-model="nodeData.image" placeholder="http://... vagy /images/..." />
      </div>

      <div class="form-group checkbox">
        <input type="checkbox" id="is_end" v-model="nodeData.is_end" />
        <label for="is_end">Ez egy befejező csomópont?</label>
      </div>

      <div class="form-group">
        <label for="health_effect">Életerő Hatás (opcionális):</label>
        <input type="number" id="health_effect" v-model.number="nodeData.health_effect" />
      </div>

      <div class="form-group">
        <label for="item_reward_id">Tárgy Jutalom:</label>
        <select id="item_reward_id" v-model.number="nodeData.item_reward_id">
          <option :value="null">Nincs jutalom</option>
          <option v-for="item in adminItemsStore.allItems" :key="item.id" :value="item.id">
            ID: {{ item.id }} – {{ item.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="enemy_id">Ellenfél:</label>
        <select id="enemy_id" v-model.number="nodeData.enemy_id">
          <option :value="null">Nincs ellenfél</option>
          <option v-for="enemy in adminEnemiesStore.allEnemies" :key="enemy.id" :value="enemy.id">
            ID: {{ enemy.id }} – {{ enemy.name }}
          </option>
        </select>
      </div>
      <div v-if="nodeData.enemy_id">
        <hr />
        <h3 class="sub-header">Harc Kimenetele (Csak ha van ellenfél)</h3>
        <div class="form-group">
          <label for="victoryNodeId">Győzelem Esetén Következő Node ID (opcionális):</label>
          <select id="victoryNodeId" v-model="nodeData.victoryNodeId">
            <option :value="null">Nincs (vagy globális default)</option>
            <option v-for="node in adminNodesStore.allNodes" :key="node.id" :value="node.id">
              ID: {{ node.id }} - {{ truncateText(node.text, 50) }}
            </option>
          </select>
          <small>Ha nincs megadva, a globális győzelmi node-ra lép (ha van ilyen beállítva).</small>
        </div>

        <div class="form-group">
          <label for="defeatNodeId">Vereség Esetén Következő Node ID (opcionális):</label>
          <select id="defeatNodeId" v-model="nodeData.defeatNodeId">
            <option :value="null">Nincs (vagy globális default)</option>
            <option v-for="node in adminNodesStore.allNodes" :key="node.id" :value="node.id">
              ID: {{ node.id }} - {{ truncateText(node.text, 50) }}
            </option>
          </select>
          <small>Ha nincs megadva, a globális vereségi node-ra lép (ha van ilyen beállítva).</small>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="store.isLoading || pageLoading">
          {{ store.isLoading ? 'Mentés...' : isEditing ? 'Módosítások Mentése' : 'Létrehozás' }}
        </button>
        <router-link :to="{ name: 'admin-nodes-list' }" class="btn btn-secondary">Mégse</router-link>
      </div>

      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'; // computed és watch hozzáadva
import { useRouter, useRoute } from 'vue-router';
import { useAdminNodesStore } from '../../../stores/adminNodes';
import type { AdminCreateNodePayload, AdminUpdateNodePayload, AdminNodeData } from '../../../types/admin.types';
import { useAdminItemsStore } from '../../../stores/adminItems';   // <-- Item store import
import { useAdminEnemiesStore } from '../../../stores/adminEnemies'; // <-- Enemy store import

const store = useAdminNodesStore();
const adminItemsStore = useAdminItemsStore();     // Item store példány
const adminEnemiesStore = useAdminEnemiesStore(); // Enemy store példány
const router = useRouter();
const route = useRoute();
const adminNodesStore = useAdminNodesStore();

const nodeId = ref<number | null>(null);
const isEditing = computed(() => nodeId.value !== null);
const pageLoading = ref(false); // Oldal betöltésének jelzése (listákhoz)
const nodesStore = useAdminNodesStore();

const getInitialNodeData = (): AdminCreateNodePayload => ({
  text: '',
  image: null,
  is_end: false,
  health_effect: null,
  item_reward_id: null,
  enemy_id: null,
  victoryNodeId: null,
  defeatNodeId: null, 
});

const nodeData = ref<AdminCreateNodePayload | AdminUpdateNodePayload>(getInitialNodeData());
const successMessage = ref<string | null>(null);

onMounted(async () => {
  pageLoading.value = true;
  nodesStore.error = null;      // A node-specifikus store error mezőjét nullázzuk
  adminItemsStore.error = null;
  adminEnemiesStore.error = null;
  // NINCS AdminNodeData.error, mert az AdminNodeData egy TÍPUS

  const fetchPromises = [
    adminItemsStore.fetchItems(),
    adminEnemiesStore.fetchEnemies(),
    nodesStore.fetchNodes()    // A nodesStore.fetchNodes() metódusát hívjuk
  ];

  const idParam = route.params.id;
  if (idParam) {
    const idToFetch = Array.isArray(idParam) ? parseInt(idParam[0], 10) : parseInt(idParam, 10);
    if (!isNaN(idToFetch)) {
      nodeId.value = idToFetch;
      // A nodesStore.fetchNode() metódusát hívjuk, nem a 'store'-ét, ha a 'nodesStore'-t használjuk
      fetchPromises.push(nodesStore.fetchNode(nodeId.value) as Promise<any>); 
    } else {
      nodesStore.error = "Érvénytelen Node ID."; 
      nodeId.value = null;
    }
  } else {
    nodesStore.currentNode = null; // A nodesStore currentNode-ját nullázzuk
  }
  
  try {
    await Promise.all(fetchPromises);
  } catch (error) {
    console.error("Failed to fetch data for node edit page", error);
    // Az egyes store-ok error mezője már beállítódik a saját fetch* akcióikban
  }
  pageLoading.value = false;
});

watch(() => store.getCurrentNode, (currentNode) => {
    if (isEditing.value && currentNode) {
        nodeData.value = {
            text: currentNode.text,
            image: currentNode.image ?? null,
            is_end: currentNode.is_end,
            health_effect: currentNode.health_effect ?? null,
            item_reward_id: currentNode.item_reward_id ?? null,
            enemy_id: currentNode.enemy_id ?? null,
            victoryNodeId: currentNode.victoryNodeId ?? null,
            defeatNodeId: currentNode.defeatNodeId ?? null, 
        };
    } else if (!isEditing.value) {
        nodeData.value = getInitialNodeData();
    }
}, { immediate: true, deep: true });

const handleSubmit = async () => {
  successMessage.value = null;
  nodesStore.error = null;
  let result: AdminNodeData | null = null;

  if (!nodeData.value.text) {
      store.error = "A Szöveg kitöltése kötelező!";
      return;
  }

  if (isEditing.value && nodeId.value !== null) {
    result = await store.updateNode(nodeId.value, nodeData.value as AdminUpdateNodePayload);
    if (result) successMessage.value = `Node (ID: ${result.id}) sikeresen frissítve!`;
  } else {
    result = await store.createNode(nodeData.value as AdminCreateNodePayload);
    if (result) successMessage.value = `Node sikeresen létrehozva (ID: ${result.id})!`;
  }

  if (result) {
    setTimeout(() => router.push({ name: 'admin-nodes-list' }), 1500);
  }
};

const truncateText = (text: string | null, length: number): string => {
    if (!text) return '-'; // Kezeljük a null esetet is
    return text.length > length ? text.substring(0, length) + '...' : text;
};
</script>

<style scoped>
.admin-node-edit {
  padding: 2rem;
  margin: 80px auto;
  max-width: 700px;
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

.node-form {
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
textarea,
select {
  padding: 0.6rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--input-text);
  border-radius: 0.5rem;
  transition: border 0.2s ease;
  color:rgb(68, 45, 90);
}

input:focus,
textarea:focus,
select:focus {
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