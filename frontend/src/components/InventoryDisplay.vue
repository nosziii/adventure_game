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
  background-color: var(--panel-bg); /* Sötét, áttetsző panel háttér */
  border: 1px solid var(--panel-border); /* Témához illő keret */
  padding: 20px;
  margin-top: 25px; /* Térköz a felette lévő elemtől */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  color: var(--text-primary);
}

.inventory-display h3 {
  font-family: 'Cinzel Decorative', cursive; /* Díszesebb font */
  color: var(--accent-primary); /* Arany */
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--panel-border);
  text-align: center;
  font-size: 1.4em;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 10px 5px; /* Több vertikális padding */
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(var(--panel-border-rgb, 70, 62, 82), 0.3); /* Halványabb elválasztó, feltéve, hogy --panel-border-rgb létezik, vagy használj egy fix színt pl. #443e52 opacity-vel */
  /* Ha nincs --panel-border-rgb: border-bottom: 1px solid rgba(100, 100, 120, 0.2); */
}

li:last-child {
  border-bottom: none;
}

li span:first-child { /* Tárgy neve és mennyisége */
  flex-grow: 1;
  font-size: 0.95em;
}

.equipped-marker {
  color: #4CAF50; /* Élénk zöld a felszerelt jelzéshez */
  /* Vagy használhatod var(--accent-secondary) is */
  font-weight: bold;
  margin-left: 8px;
  font-size: 0.8em;
  text-transform: uppercase;
}

.item-actions button {
  margin-left: 10px;
  padding: 5px 10px;
  font-size: 0.8em;
  cursor: pointer;
  border-radius: 4px;
  font-family: 'EB Garamond', serif;
  font-weight: 500;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  border: 1px solid var(--accent-secondary);
  background-color: transparent;
  color: var(--accent-secondary);
}

.item-actions button:hover:not(:disabled) {
  background-color: var(--accent-secondary);
  color: var(--button-text); /* Sötét szöveg a kiemelő színen */
}

.item-actions button:disabled {
  border-color: #555;
  color: #777;
  background-color: rgba(0,0,0,0.1);
  cursor: not-allowed;
  opacity: 0.6;
}

.item-actions .equip-button.equipped { /* Levétel gomb stílusa */
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--button-text); /* Sötét szöveg */
}
.item-actions .equip-button.equipped:hover:not(:disabled) {
  background-color: var(--accent-secondary);
}

.inventory-display p { /* "A leltárad üres" üzenet */
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: 10px 0;
}
</style>