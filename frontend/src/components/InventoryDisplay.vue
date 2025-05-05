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
          :disabled="!canUseItem(item.itemId) || gameStore.isLoading" :title="canUseItem(item.itemId) ? 'Használat' : 'Most nem használható'" >
          Használat
        </button>
      </li>
    </ul>
    <p v-else>A leltárad üres.</p>
  </div>
</template>

<script setup lang="ts">
import type { InventoryItem } from '../types/game.types'
import { useGameStore } from '../stores/game' // Store kellhet a canUseItem logikához
import { defineProps } from 'vue'

interface Props {
  inventory: InventoryItem[] | null
}
const props = defineProps<Props>()

const gameStore = useGameStore();

// Tárgy használatát kezelő metódus
const useItem = async (itemId: number) => {
  if (!canUseItem(itemId)) return
  console.log(`[InventoryDisplay] Use item button clicked for item ID: ${itemId} (Out of combat)`)
  await gameStore.useItemOutOfCombat(itemId)
};

// Eldönti, hogy egy tárgy használható-e MOST
const canUseItem = (itemId: number): boolean => {
  const item = props.inventory?.find(i => i.itemId === itemId);
  if (!item?.usable) return false; // Csak usable tárgyak

  // Harcon KÍVÜL használjuk?
  if (!gameStore.isInCombat) {
    // Gyógyitalt csak akkor, ha nem max HP-n vagyunk?
    const stats = gameStore.getCharacterStats;
    if (item.effect?.startsWith('heal+') && stats && stats.health >= 100) { // Feltételezzük a 100 max HP-t
      return false;
    }
    // Más feltétel harcon kívüli használatra?
    return true; // Ha usable és nem gyógyít max HP-n
  } else {
     // Harcban van? Akkor itt most NEM használható ezzel a gombbal
     // (A harci logikát külön kezelhetjük, vagy ezt a komponenst okosíthatjuk)
     // Legyen egyelőre false harcban:
     return false;
  }
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