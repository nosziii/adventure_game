<template>
  <div class="player-minimap-overlay" v-if="gameStore.isMinimapVisible" @click.self="closeMinimap">
    <div class="minimap-content">
      <h3>Bejárt útvonalad</h3>
      <button @click="closeMinimap" class="close-button">&times;</button>

      <div v-if="gameStore.isLoadingMinimap" class="loading-text">Térkép töltése...</div>
      <div v-else-if="gameStore.getError" class="error-message">Hiba: {{ gameStore.getError }}</div>
      <div v-else-if="!positionedNodes.length" class="info-message">
        Nincs megjeleníthető útvonal.
      </div>

      <div class="svg-container" ref="svgContainer">
        <div class="zoom-controls">
          <button @click="zoomIn">+</button>
          <button @click="resetZoom">RESET</button>
          <button @click="zoomOut">-</button>
        </div>
        <svg
          ref="svgElement"
          class="minimap-svg"
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#777" />
            </marker>
          </defs>

          <g class="edges">
            <line
              v-for="(edge, index) in drawableEdges"
              :key="`edge-${index}`"
              :x1="edge.x1" :y1="edge.y1"
              :x2="edge.x2" :y2="edge.y2"
              stroke="#777" stroke-width="1.5"
              marker-end="url(#arrowhead)"
            />
            <foreignObject
              v-for="(edge, index) in drawableEdges"
              :key="`edge-text-${index}`"
              :x="((edge.x1 + edge.x2) / 2) - 70"
              :y="((edge.y1 + edge.y2) / 2) - 30"
              width="140"
              height="40"
            >
              <div xmlns="http://www.w3.org/1999/xhtml"
                   style="font-size: 12px; text-align: center; color: #333; word-wrap: break-word;">
                {{ edge.choiceTextSnippet }}
              </div>
            </foreignObject>
          </g>

          <g class="nodes">
            <g
              v-for="node in positionedNodes"
              :key="node.id"
              :transform="`translate(${node.x},${node.y})`"
              class="node-group"
              @click="onNodeClick(node)"
            >
              <circle
                cx="0" cy="0" :r="nodeRadius"
                :fill="getNodeColor(node.id)"
                stroke="#333" stroke-width="1.5"
              />
              <text
                text-anchor="middle" dy=".3em"
                font-size="10px" fill="#000"
              >{{ node.id }}</text>
              <title>{{ node.textSnippet }}</title>
            </g>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import { useGameStore } from '../stores/game'
import type { PlayerMapNode } from '../types/game.types'
import svgPanZoom from 'svg-pan-zoom'

interface PositionedPlayerMapNode extends PlayerMapNode {
  x: number;
  y: number;
  depth: number;
}

interface DrawableMapEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  choiceTextSnippet?: string | null;
}

const gameStore = useGameStore()
const nodeRadius = 18
const columnWidth = 220
const rowHeight = 130
const padding = 40

const svgElement = ref<SVGSVGElement | null>(null)
const svgContainer = ref<HTMLDivElement | null>(null)
const panZoomInstance = ref<ReturnType<typeof svgPanZoom> | null>(null)

onMounted(() => {
  nextTick(() => {
    if (svgElement.value && positionedNodes.value.length > 0) {
      const instance = svgPanZoom(svgElement.value, {
        zoomEnabled: true,
        controlIconsEnabled: false,
        fit: true,
        center: true,
        minZoom: 0.5,
        maxZoom: 5,
        contain: true,
      })

      requestAnimationFrame(() => {
        instance.resize()
        instance.fit()
        instance.center()
      })

      panZoomInstance.value = instance
    }
  })
})

const zoomIn = () => {
  panZoomInstance.value?.zoomIn()
}

const zoomOut = () => {
  panZoomInstance.value?.zoomOut()
}

const resetZoom = () => {
  panZoomInstance.value?.reset()
  panZoomInstance.value?.center()
  panZoomInstance.value?.fit()
}

const positionedNodes = computed((): PositionedPlayerMapNode[] => {
  const nodes = gameStore.getMapNodes
  const edges = gameStore.getMapEdges
  const positions = new Map<number, PositionedPlayerMapNode>()
  const childrenMap = new Map<number | null, number[]>()
  const nodeDepths = new Map<number, number>()

  edges.forEach(edge => {
    if (!childrenMap.has(edge.from)) childrenMap.set(edge.from, [])
    childrenMap.get(edge.from)!.push(edge.to)
  })

  const incoming = new Set(edges.map(e => e.to))
  const roots = nodes.filter(n => !incoming.has(n.id) || edges.some(e => e.to === n.id && e.from === null))
  const queue = roots.map(r => ({ nodeId: r.id, depth: 0 }))
  const visited = new Set<number>()

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!
    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    nodeDepths.set(nodeId, depth)
    const children = childrenMap.get(nodeId) || []
    children.forEach(c => !visited.has(c) && queue.push({ nodeId: c, depth: depth + 1 }))
  }

  const depthMap: PositionedPlayerMapNode[][] = []
  nodes.forEach(node => {
    const depth = nodeDepths.get(node.id) ?? 0
    if (!depthMap[depth]) depthMap[depth] = []
    depthMap[depth].push({ ...node, x: 0, y: 0, depth })
  })

  depthMap.forEach((group, d) => {
    const offsetY = (group.length - 1) * rowHeight / 2
    group.forEach((node, i) => {
      node.x = padding + d * columnWidth
      node.y = padding + i * rowHeight - offsetY
      positions.set(node.id, node)
    })
  })

  return Array.from(positions.values())
})

const drawableEdges = computed((): DrawableMapEdge[] => {
  const map = new Map(positionedNodes.value.map(n => [n.id, n]))
  return gameStore.getMapEdges.flatMap(edge => {
    const to = map.get(edge.to)
    if (!to) return []
    const from = edge.from !== null ? map.get(edge.from) : { x: padding / 2, y: to.y }
    if (!from) return []
    return [{ x1: from.x, y1: from.y, x2: to.x, y2: to.y, choiceTextSnippet: edge.choiceTextSnippet }]
  })
})

const svgWidth = computed(() =>
  positionedNodes.value.length
    ? Math.max(...positionedNodes.value.map(n => n.x)) + padding + nodeRadius
    : 400
)

const svgHeight = computed(() =>
  positionedNodes.value.length
    ? Math.max(...positionedNodes.value.map(n => n.y)) + padding + nodeRadius
    : 300
)

const getNodeColor = (id: number) => (gameStore.currentNode?.id === id ? '#fdd835' : '#ADD8E6')
const closeMinimap = () => gameStore.toggleMinimap()
const onNodeClick = (node: PositionedPlayerMapNode) => console.log('Clicked:', node)
</script>

<style scoped>
.player-minimap-overlay {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(6px);
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.minimap-content {
  background: #f9f9fb;
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 900px;
  height: 90vh;
  max-height: 720px;
  overflow: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Segoe UI', sans-serif;
}
.minimap-content h3 {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
  color: #333;
}
.close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(to bottom, #eee, #ccc);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-weight: bold;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}
.close-button:hover {
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
  transform: scale(1.1);
}
.svg-container {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
}
.zoom-controls {
  position: absolute;
  right: 10px;
  top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 10;
}
.zoom-controls button {
  background-color: #eee;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 14px;
  cursor: pointer;
}
.zoom-controls button:hover {
  background-color: #ddd;
}
.minimap-svg {
  width: 100%;
  height: 100%;
  background-color: #fefefe;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.node-group:hover circle {
  stroke: #000;
  stroke-width: 2;
  fill: #fdd835;
  transition: 0.2s;
}
.loading-text,
.error-message,
.info-message {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}
.error-message {
  color: #c0392b;
}
</style>
