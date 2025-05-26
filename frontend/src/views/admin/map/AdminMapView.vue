<template>
  <div class="admin-map-view">
    <h1>Történet Térkép (Admin)</h1>
    <div v-if="store.isLoading">Térkép töltése...</div>
    <div v-else-if="store.getError" class="error-message">
      Hiba a térkép betöltésekor: {{ store.getError }}
    </div>
    <div v-else-if="!graphInputData" class="info-message">
        Nincs megjeleníthető adat a gráfhoz. Próbáld újra később.
    </div>
    <div ref="graphContainer" class="graph-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed, nextTick } from 'vue'; // nextTick hozzáadva
import { useAdminMapStore } from '../../../stores/adminMap';
import { Network, type Options, type Data } from "vis-network"; // Importáld a típusokat is

const store = useAdminMapStore();
const graphContainer = ref<HTMLElement | null>(null);
let networkInstance: Network | null = null;

// Számlálók a hívások nyomon követésére
let initializeGraphCallCount = 0; // Számláló
let watchGraphDataCallCount = 0; // Számláló

// Ez a computed property csak akkor változik, ha a node-ok vagy élek száma változik,
// vagy ha maguk a state tömbök cserélődnek le.
const graphInputData = computed((): Data | null => {
  if (store.visNodes.length > 0 || store.visEdges.length > 0) { // Vagy csak store.visNodes.length > 0, ha a node-ok a mérvadóak
    return {
      nodes: [...store.visNodes], // Másolatot adunk át
      edges: [...store.visEdges]  // Másolatot adunk át
    };
  }
  return null;
});

const initializeGraph = () => {
   initializeGraphCallCount++;
  console.log(`INITIALIZE_GRAPH called. Count: ${initializeGraphCallCount}. Container:`, !!graphContainer.value, 'GraphData:', !!graphInputData.value );
  // Csak akkor inicializálj, ha van konténer és van adat
  if (graphContainer.value && graphInputData.value) {
    console.log('Initializing Vis.js network with data:', graphInputData.value);
    const options: Options = { // Adjunk típust az options-nak
      layout: { hierarchical: { enabled: false, direction: 'LR', sortMethod: 'directed' } },
      edges: { arrows: 'to', smooth: { enabled: true, type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 } },
      nodes: { shape: 'box', margin: { top: 10, right: 10, bottom: 10, left: 10 }, widthConstraint: { maximum: 200 } },
      physics: {
        enabled: true,
        barnesHut: { gravitationalConstant: -30000, centralGravity: 0.1, springLength: 150, springConstant: 0.05, damping: 0.09, avoidOverlap: 0.1 },
        solver: 'barnesHut',
        stabilization: { iterations: 150 }
      },
      interaction: { dragNodes: true, dragView: true, zoomView: true, tooltipDelay: 200 },
      groups: {
        normalNode: { color: { background: '#97C2FC', border: '#2B7CE9'}, shape: 'ellipse' },
        combatNode: { color: { background: '#F08080', border: '#D23A1D'}, shape: 'box' },
        endNode: { color: { background: '#C2FABC', border: '#2B9729'}, shape: 'diamond' },
        orphanNode: { color: { background: '#FFA07A', border: '#FF4500', highlight: {background: '#FF6347', border: '#FF0000'}}, shape: 'triangleDown', font: {color: '#FF0000'} }, // Pl. narancs/piros
        deadEndNode: { color: { background: '#FFD700', border: '#FFA500', highlight: {background: '#FFC400', border: '#FF8C00'}}, shape: 'star', font: {color: '#8B4513'} }, // Pl. sárga/narancs
        orphanDeadEndNode: { color: { background: '#FF69B4', border: '#C71585'}, shape: 'hexagon', font: {color: '#FFFFFF'} } // Pl. pink
      }
    };

    if (networkInstance) {
      networkInstance.destroy();
      console.log('Previous network instance destroyed.');
    }
    networkInstance = new Network(graphContainer.value, graphInputData.value, options);
    networkInstance.on("stabilizationIterationsDone", () => {
      networkInstance?.setOptions({ physics: false });
      console.log('Physics disabled after stabilization.');
    });
  } else {
    console.log('Graph container or data not ready for Vis.js initialization. Container:', !!graphContainer.value, 'Data:', !!graphInputData.value );
  }
};

onMounted(async () => {
  await store.fetchStoryGraph();
  // Miután az adatok megérkeztek és a store frissült, a watch (vagy a nextTick) lekezeli
  // A watch immediate:true nélkül most az első adatváltozásra fog lefutni.
  // Vagy expliciten hívhatjuk itt is, miután az adatok megjöttek ÉS a DOM frissült
  // nextTick(() => {
  //    initializeGraph();
  // });
});

// Most a graphInputData (computed property) változását figyeljük.
// Ez csak akkor változik meg "igazán", ha a store.visNodes vagy store.visEdges tartalma változik.
// Az immediate: true-t kivettem, az onMounted utáni első adatbetöltés fogja triggerelni.
watch(graphInputData, (newData, oldData) => {
  watchGraphDataCallCount++;
  // Logoljuk, hogy az új és régi adat referencia szerint különbözik-e
  console.log(`WATCH on graphInputData triggered. Count: ${watchGraphDataCallCount}. NewData (ref check):`, newData === oldData, 'NewData available:', !!newData);
  if (newData && graphContainer.value) { // Biztosítjuk, hogy a konténer is létezik
    initializeGraph();
  } else if (!newData && networkInstance) { // Ha az adat eltűnik, töröljük a gráfot
      networkInstance.destroy();
      networkInstance = null;
  }
}, { deep: true }); // deep: true marad, hogy a tömbökön belüli változást is figyelje

onBeforeUnmount(() => {
  if (networkInstance) {
    networkInstance.destroy();
    networkInstance = null;
    console.log('Vis.js network instance destroyed.');
  }
});

</script>

<style scoped>
.admin-map-view {
  padding: 2rem;
  margin-top: 80px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
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
  margin-bottom: 1rem;
}

.graph-container {
  flex-grow: 1;
  border: 1px solid var(--panel-border);
  border-radius: 0.5rem;
  background: radial-gradient(circle at top left, var(--bg-glow-center), var(--bg-deep-dark));
  margin-top: 1.5rem;
  height: 800px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  position: relative;
}

.error-message,
.info-message {
  padding: 1.5rem;
  text-align: center;
  border-radius: 0.5rem;
  font-weight: bold;
  margin-top: 1rem;
  border: 1px solid;
}

.error-message {
  color: #ffcfcf;
  background-color: rgba(160, 32, 32, 0.15);
  border-color: #cc5555;
}

.info-message {
  color: var(--text-secondary);
  background-color: rgba(255, 255, 255, 0.05);
  border-color: var(--panel-border);
}
</style>
