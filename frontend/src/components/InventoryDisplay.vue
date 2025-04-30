<template>
  <div class="inventory-display">
    <h3>Leltár</h3>
    <ul v-if="inventory && inventory.length > 0">
      <li v-for="item in inventory" :key="item.itemId" :title="item.description ?? ''">
        {{ item.name }} ({{ item.quantity }})
        <button
          v-if="item.usable"
          @click="useItem(item.itemId)"
          class="use-button"
          :disabled="!canUseItem(item.itemId)"
         >
          Használat (TODO)
        </button>
      </li>
    </ul>
    <p v-else>A leltárad üres.</p>
  </div>
</template>

<script setup lang="ts">
import type { InventoryItem } from '../types/game.types';
import { useGameStore } from '../stores/game'; // Store kellhet a canUseItem logikához

interface Props {
  inventory: InventoryItem[] | null
}
const props = defineProps<Props>()

const gameStore = useGameStore();

// Jövőbeli esemény kibocsátásához
// const emit = defineEmits<{ (e: 'use-item', id: number): void }>();

// TODO: Metódus a tárgy használatára (meghívja a store akciót)
const useItem = (itemId: number) => {
  console.log(`Use item clicked: ${itemId}`);
  alert(`Tárgy (${itemId}) használata még nincs implementálva!`);
  // emit('use-item', itemId); // Esemény kibocsátása, amit a GameView kezelhet
};

// TODO: Logika annak eldöntésére, hogy egy tárgy használható-e az aktuális helyzetben
// Pl. gyógyitalt csak akkor, ha nem max HP-n vagyunk, vagy csak harcban?
const canUseItem = (itemId: number): boolean => {
    // Példa: A gyógyital (ID=2) használható, ha nem max HP-n vagyunk
    // const stats = gameStore.getCharacterStats;
    // if (itemId === 2 && stats && stats.health < 100) { // Max HP-t is tárolni kéne
    //     return true;
    // }
    // Egyelőre csak a usable flag alapján (ha van)
    const item = props.inventory?.find(i => i.itemId === itemId);
    return !!item?.usable; // Csak akkor engedélyezzük, ha usable=true
}

</script>

<style scoped>
.inventory-display {
  border: 1px solid #ddd;
  padding: 15px;
  margin-top: 20px;
  background-color: #f9f9f9;
  border-radius: 5px;
}
.inventory-display h3 {
  margin-top: 0;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  padding: 5px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.use-button {
  padding: 2px 6px;
  font-size: 0.8em;
  cursor: pointer;
  margin-left: 10px;
}
 .use-button:disabled {
     cursor: not-allowed;
     opacity: 0.5;
 }
</style>