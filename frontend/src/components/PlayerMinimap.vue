<template>
  <div class="player-minimap-overlay" v-if="gameStore.isMinimapVisible" @click.self="closeMinimap">
    <div class="minimap-content">
      <h3>Bejárt Útvonalad</h3>
      <button @click="closeMinimap" class="close-button">Bezár</button>

      <div v-if="gameStore.isLoadingMinimap" class="loading-text">Térkép töltése...</div>
      <div v-else-if="gameStore.getError" class="error-message">Hiba: {{ gameStore.getError }}</div>
      <div v-else-if="!positionedNodes || positionedNodes.length === 0" class="info-message">
        Nincs megjeleníthető útvonal.
      </div>

      <svg v-else :width="svgWidth" :height="svgHeight" class="minimap-svg">
        <g class="edges">
          <line
            v-for="(edge, index) in drawableEdges"
            :key="`edge-${index}`"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
            stroke="#777"
            stroke-width="1.5"
            marker-end="url(#arrowhead)"
          />
          <text
            v-for="(edge, index) in drawableEdges"
            :key="`edge-text-${index}`"
            :x="(edge.x1 + edge.x2) / 2"
            :y="(edge.y1 + edge.y2) / 2"
            text-anchor="middle"
            font-size="8px"
            fill="#555"
            dy="-2"
          >
            {{ edge.choiceTextSnippet }}
          </text>
        </g>
        <g class="nodes">
          <g v-for="node in positionedNodes" :key="node.id" :transform="`translate(${node.x},${node.y})`" @click="onNodeClick(node)" class="node-group">
            <circle cx="0" cy="0" :r="nodeRadius" :fill="getNodeColor(node.id)" stroke="#333" stroke-width="1.5" />
            <text
                text-anchor="middle"
                dy=".3em"
                font-size="10px"
                fill="#000"
            >
              {{ node.id }}
            </text>
            <title>{{ node.id }}: {{ node.textSnippet }}</title> </g>
        </g>
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#777" />
            </marker>
        </defs>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/game'; // Igazítsd az útvonalat, ha kell
import type { PlayerMapNode, PlayerMapEdge } from '../types/game.types'; // Igazítsd az útvonalat

// Típus a pozicionált node-okhoz
interface PositionedPlayerMapNode extends PlayerMapNode {
  x: number;
  y: number;
  depth: number;
}

// Típus a rajzolható élekhez
interface DrawableMapEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  choiceTextSnippet?: string | null;
}

const gameStore = useGameStore();

const nodeRadius = 18;
const columnWidth = 120; // Vízszintes távolság a szintek között
const rowHeight = 70;   // Függőleges távolság az azonos szintű node-ok között
const padding = 40;     // Térköz a vászon szélén

// Node pozíciók kiszámítása (fa-szerű elrendezés)
const positionedNodes = computed((): PositionedPlayerMapNode[] => {
  const nodes = gameStore.getMapNodes;
  const edges = gameStore.getMapEdges;
  if (!nodes.length) return [];

  const positions = new Map<number, PositionedPlayerMapNode>();
  const childrenMap = new Map<number | null, number[]>(); // Parent ID (null for root) -> children IDs
  const nodeDepths = new Map<number, number>(); // Node ID -> depth

  // Gyerekek és mélységek kiszámítása
  edges.forEach(edge => {
    if (!childrenMap.has(edge.from)) {
      childrenMap.set(edge.from, []);
    }
    childrenMap.get(edge.from)!.push(edge.to);
  });

  const queue: { nodeId: number; depth: number }[] = [];

  // Kezdő node(ok) meghatározása (amikre nem mutat él, vagy null a from)
  const nodeIdsWithIncomingEdges = new Set(edges.map(e => e.to));
  const rootNodes = nodes.filter(n => !nodeIdsWithIncomingEdges.has(n.id) || edges.some(e => e.to === n.id && e.from === null) );

  if (rootNodes.length === 0 && nodes.length > 0) { // Ha kör van vagy csak egy node van
    const firstNode = nodes.reduce((min, node) => node.id < min.id ? node : min, nodes[0]);
    if(firstNode) queue.push({ nodeId: firstNode.id, depth: 0 });
  } else {
    rootNodes.forEach(n => queue.push({ nodeId: n.id, depth: 0 }));
  }
  
  const visitedForDepthCalc: Set<number> = new Set();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visitedForDepthCalc.has(current.nodeId)) continue;
    visitedForDepthCalc.add(current.nodeId);

    nodeDepths.set(current.nodeId, current.depth);
    const nodeChildren = childrenMap.get(current.nodeId) || [];
    nodeChildren.forEach(childId => {
      if (!visitedForDepthCalc.has(childId)) {
        queue.push({ nodeId: childId, depth: current.depth + 1 });
      }
    });
  }
  
  // Pozíciók kiosztása mélység és sorrend alapján
  const nodesByDepth: PositionedPlayerMapNode[][] = [];
  nodes.forEach(node => {
      const depth = nodeDepths.get(node.id) ?? 0; // Ha valamiért nincs mélység, legyen 0
      if(!nodesByDepth[depth]) nodesByDepth[depth] = [];
      // A textSnippet már a PlayerMapNode része
      nodesByDepth[depth].push({ ...node, x: 0, y: 0, depth: depth });
  });

  nodesByDepth.forEach((nodesAtDepth, depth) => {
    const countAtDepth = nodesAtDepth.length;
    nodesAtDepth.forEach((node, indexInDepth) => {
      node.x = padding + depth * columnWidth;
      // Y pozíció elosztása az azonos szinten lévő elemek között
      // Egyszerűsített: egyenletesen osztjuk el a rendelkezésre álló magasságban
      // A teljes magasságot a maxNodesAtDepth * rowHeight adja meg, ezt arányosítjuk
      const totalVirtualHeight = Math.max(1, countAtDepth) * rowHeight; // Elkerüljük a 0-val osztást
      node.y = padding + (indexInDepth * rowHeight) + (rowHeight / 2) - (totalVirtualHeight / (countAtDepth * 2)) * (countAtDepth-1) ;
      // Ez még finomításra szorulhat, egy egyszerűbb:
      node.y = padding + (indexInDepth + 0.5) * rowHeight;
      // Vagy próbáljuk meg középre igazítani a csoportot
      const yOffset = (countAtDepth -1) * rowHeight / 2;
      node.y = padding + (indexInDepth * rowHeight) - yOffset + 200; // +200 egy teszt offset


      positions.set(node.id, node);
    });
  });
  return Array.from(positions.values()).sort((a,b)=> a.id - b.id);
});


// Élek koordinátáinak meghatározása
const drawableEdges = computed((): DrawableMapEdge[] => {
  if (!positionedNodes.value.length) return [];
  // Készítünk egy Map-et a node ID-kból és a pozicionált node objektumokból a gyorsabb kereséshez
  const posMap = new Map(positionedNodes.value.map(n => [n.id, n]));

  const edges: DrawableMapEdge[] = []; // Explicit típusú tömb

  gameStore.getMapEdges.forEach(edge => {
    const toNode = posMap.get(edge.to); // Ez PositionedPlayerMapNode | undefined
    let fromNodePosition: { x: number; y: number } | undefined = undefined; // Legyen undefined a default

    if (edge.from !== null) {
      const foundFromNode = posMap.get(edge.from); // Ez is PositionedPlayerMapNode | undefined
      if (foundFromNode) {
        fromNodePosition = { x: foundFromNode.x, y: foundFromNode.y };
      }
      // Ha fromNode nem null, de nem találtuk a posMap-ben, akkor az az él hibás, nem rajzoljuk ki
    } else {
      // Kezdő él (from === null), rajzoljuk a vászon bal szélétől
      if (toNode) { // Csak ha a cél node létezik és pozicionálva van
        fromNodePosition = { x: padding / 2, y: toNode.y }; // Bal szél, cél node Y szintjén
      }
    }

    // Csak akkor adjuk hozzá az élt, ha a fromNodePosition (ha kell) ÉS a toNode is megvan
    if (toNode && (edge.from === null || fromNodePosition)) {
      edges.push({
        x1: fromNodePosition!.x, // A ! jelzi a TS-nek, hogy tudjuk, itt már nem undefined
        y1: fromNodePosition!.y,
        x2: toNode.x,
        y2: toNode.y,
        choiceTextSnippet: edge.choiceTextSnippet
      });
    } else if (!toNode) {
        console.warn(`Edge references non-existent toNode: ${edge.to}`, edge);
    } else if (edge.from !== null && !fromNodePosition){
        console.warn(`Edge references non-existent fromNode: ${edge.from}`, edge);
    }
  });
  return edges;
});

// SVG vászon méreteinek dinamikus kiszámítása
const svgWidth = computed(() => {
  if (!positionedNodes.value || positionedNodes.value.length === 0) return 400;
  const maxX = Math.max(0, ...positionedNodes.value.map(n => n.x)); // Biztosítjuk, hogy ne legyen -Infinity
  return maxX + padding + nodeRadius;
});

const svgHeight = computed(() => { // JAVÍTOTT
  if (!positionedNodes.value || positionedNodes.value.length === 0) return 300;

  const yCoordinates = positionedNodes.value.map(n => n.y);
  if (yCoordinates.length === 0) return 300; // Ha valamiért üres a yCoordinates

  const minY = Math.min(...yCoordinates);
  const maxY = Math.max(...yCoordinates);
  return Math.max(300, maxY - minY + (padding * 2) + (nodeRadius * 2));
});

const getNodeColor = (nodeId: number): string => {
    const gameCurrentNodeId = gameStore.currentNode?.id;
    if (gameCurrentNodeId && gameCurrentNodeId === nodeId) {
        return 'gold'; // Aktuális node kiemelése
    }
    return '#ADD8E6'; // Alap kék
};

const closeMinimap = () => { gameStore.toggleMinimap(); };

const onNodeClick = (node: PositionedPlayerMapNode) => {
    console.log('Node clicked:', node);
    // Ide jöhetne logika, pl. info megjelenítése a node-ról
};

</script>

<style scoped>
.player-minimap-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
}
.minimap-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  height: 90vh; /* Magasság beállítása a viewporthoz képest */
  max-height: 700px;
  overflow: auto; /* Legyen görgethető, ha nagyobb a tartalom */
  position: relative;
  display: flex;
  flex-direction: column; /* Hogy az SVG kitöltse a helyet */
}
.minimap-content h3 {
  margin-top: 0;
  text-align: center;
}
.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  background: #f1f1f1;
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}
.minimap-svg {
  border: 1px solid #eee;
  background-color: #fdfdfd;
  display: block;
  margin: auto;
  flex-grow: 1; /* SVG kitölti a minimap-content maradék helyét */
  width: 100%; /* SVG szélessége alkalmazkodik */
}
.node-group {
    cursor: pointer;
}
.loading-text, .error-message, .info-message { text-align: center; padding: 20px; }
.error-message { color: red; }
.info-message { color: #555; }
</style>