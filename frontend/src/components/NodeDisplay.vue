<template>
    <div class="node-display" v-if="node">
      <h2>Aktuális helyszín (Node {{ node.id }})</h2>
      <img
        v-if="node.image"
        :src="node.image"
        alt="Helyszín illusztráció"
        class="node-image"
      />
      <p class="node-text">{{ node.text }}</p>
    </div>
  </template>
  
  <script setup lang="ts">
  import type { StoryNodeData } from '../types/game.types'; // Vagy relatív útvonal
  
  interface Props {
    node: StoryNodeData | null;
  }
  defineProps<Props>();
  </script>
  
  <style scoped>
  /* Átemelheted a stílusokat a GameView-ból */
  .node-image {
    max-width: 100%;
    height: auto;
    margin-bottom: 15px;
    border: 1px solid #eee;
  }
  .node-text {
    line-height: 1.6;
    margin-bottom: 25px;
    white-space: pre-wrap;
  }
  h2 {
    margin-top: 0;
  }
  </style>