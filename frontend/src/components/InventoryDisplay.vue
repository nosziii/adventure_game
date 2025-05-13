<template>
  <div class="inventory-display">
    <h3>Leltár</h3>
    <ul v-if="props.inventory && props.inventory.length > 0">
      <li v-for="item in props.inventory" :key="item.itemId" :title="item.description ?? ''">
        <span>
          {{ item.name }} ({{ item.quantity }})
          <strong v-if="isEquipped(item.itemId)" class="equipped-marker"> [Felszerelve]</strong>
        </span>
        <span class="item-actions">
          <button
            v-if="item.usable"
            @click="handleUseItem(item.itemId)"
            class="use-button"
            :disabled="!canUseItem(item.itemId) || gameStore.isLoading || gameStore.isEquipping"
            :title="determineUseButtonTitle(item.itemId)"
          >
            Használat
          </button>
          <button
            v-if="isEquippable(item.type)"
            @click="isEquipped(item.itemId) ? handleUnequip(item.type) : handleEquip(item.itemId)"
            class="equip-button"
            :disabled="gameStore.isLoading || gameStore.isEquipping"
            :class="{ 'equipped': isEquipped(item.itemId) }"
          >
            {{ isEquipped(item.itemId) ? 'Levétel' : 'Felszerelés' }}
          </button>
        </span>
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

const gameStore = useGameStore()

// --- Metódusok a gombokhoz ---
const handleUseItem = async (itemId: number) => {
  if (!canUseItem(itemId)) return; // Extra ellenőrzés

  if (gameStore.isInCombat) {
    console.log(`[InventoryDisplay] Use item (ID: ${itemId}) in COMBAT`);
    await gameStore.useItemInCombat(itemId); // Harci tárgyhasználat
  } else {
    console.log(`[InventoryDisplay] Use item (ID: ${itemId}) OUT OF COMBAT`);
    await gameStore.useItemOutOfCombat(itemId); // Harcon kívüli tárgyhasználat
  }
};

const handleEquip = async (itemId: number) => {
    await gameStore.equipItem(itemId);
};

const handleUnequip = async (itemType: string) => {
    // Biztosítjuk, hogy csak 'weapon' vagy 'armor' lehessen
    if (itemType === 'weapon' || itemType === 'armor') {
        await gameStore.unequipItem(itemType);
    } else {
        console.error('Invalid item type for unequip:', itemType);
    }
}
const isEquippable = (itemType: string): boolean => {
    return itemType === 'weapon' || itemType === 'armor'; // Bővíthető
};

const isEquipped = (itemId: number): boolean => {
    return gameStore.getEquippedWeaponId === itemId || gameStore.getEquippedArmorId === itemId;
}


// Tárgy használatát kezelő metódus
const canUseItem = (itemId: number): boolean => {
  const item = props.inventory?.find(i => i.itemId === itemId);
  if (!item?.usable) return false; // Csak 'usable' tárgyak

  const stats = gameStore.getCharacterStats;

  // Gyógyital speciális feltételei (max HP ellenőrzés)
  if (item.effect?.startsWith('heal+')) {
    if (stats && stats.health >= 100) { // TODO: Használj valós max HP-t a stats-ból, ha lesz
      return false; // Nem használható, ha max HP-n van
    }
  }
  // TODO: Más tárgytípusok használati feltételei ide jöhetnek
  // Pl. kulcsot csak bizonyos node-on lehet használni (ezt a backend validálja inkább)

  // Ha idáig eljutott, és usable, akkor általánosan használható
  // A gomb title majd pontosít, hogy harcban vagy azon kívül
  return true;
};

const determineUseButtonTitle = (itemId: number): string => {
    if (!canUseItem(itemId)) return 'Most nem használható';
    if (gameStore.isInCombat) return 'Használat harcban';
    return 'Használat';
};

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

 li { /* Flexbox a jobb elrendezéshez */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}
.item-actions button { /* Gombok egymás mellett */
  margin-left: 8px;
}
.equip-button {
  padding: 2px 6px;
  font-size: 0.8em;
  cursor: pointer;
  border: 1px solid #ccc;
  background-color: #eee;
}
.equip-button.equipped { /* Stílus a felszerelt tárgy levétel gombjához */
    background-color: #adb5bd;
    color: white;
}
.equip-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}
.equipped-marker {
    color: green;
    font-weight: bold;
    margin-left: 5px;
    font-size: 0.8em;
}
</style>