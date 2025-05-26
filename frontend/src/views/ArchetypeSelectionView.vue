<template>
  <div class="archetype-selection-page">
    <div class="container">
      <h1 class="page-title">Válaszd ki Karaktered Archetípusát</h1>
      <p class="page-intro">
        Minden archetípus egyedi játékstílust, kezdő bónuszokat és képességeket kínál.
        A választásod meghatározza kalandod kezdetét!
      </p>

      <div v-if="authStore.isLoadingArchetypes" class="loading-message">Archetípusok betöltése...</div>
      <div v-else-if="authStore.getArchetypeSelectionError" class="error-message main-error">
        Hiba: {{ authStore.getArchetypeSelectionError }}
      </div>
      <div v-else-if="authStore.getAvailableArchetypes.length === 0" class="info-message">
        Jelenleg nincsenek választható archetípusok. Próbáld meg később!
      </div>

      <div v-else class="archetypes-grid">
        <div
          v-for="archetype in authStore.getAvailableArchetypes"
          :key="archetype.id"
          class="archetype-card"
          :class="{ selected: selectedArchetypeId === archetype.id }"
          @click="selectArchetype(archetype.id)"
          role="button"
          tabindex="0"
          :aria-label="`Válaszd: ${archetype.name}`"
        >
          <div class="archetype-icon">
            <img :src="archetype.iconPath || '/images/archetypes/default_icon.png'" :alt="archetype.name" @error="onImageError" />
          </div>
          <div class="archetype-content">
            <h3>{{ archetype.name }}</h3>
            <p class="archetype-description">{{ archetype.description }}</p>
            <div class="archetype-details">
              <p><strong>Kezdő Bónuszok:</strong></p>
              <ul>
                <li v-if="archetype.baseHealthBonus">Életerő: +{{ archetype.baseHealthBonus }}</li>
                <li v-if="archetype.baseSkillBonus">Skill: +{{ archetype.baseSkillBonus }}</li>
                <li v-if="archetype.baseLuckBonus">Szerencse: +{{ archetype.baseLuckBonus }}</li>
                <li v-if="archetype.baseStaminaBonus">Állóképesség: +{{ archetype.baseStaminaBonus }}</li>
                <li v-if="archetype.baseDefenseBonus">Védelem: +{{ archetype.baseDefenseBonus }}</li>
              </ul>
              <div v-if="archetype.startingAbilities && archetype.startingAbilities.length > 0">
                <p><strong>Kezdő Képességek:</strong></p>
                <ul>
                  <li v-for="ability in archetype.startingAbilities" :key="ability.id" :title="ability.description">
                    {{ ability.name }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="selection-footer" v-if="authStore.getAvailableArchetypes.length > 0">
        <button 
            @click="confirmSelection" 
            :disabled="!selectedArchetypeId || authStore.isLoadingUser" 
            class="confirm-button themed-button"
        >
          {{ authStore.isLoadingUser ? 'Választás mentése...' : 'Karakter Kiválasztása és Tovább' }}
        </button>
        <p v-if="selectionError" class="error-message">{{ selectionError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
// PlayerArchetypeDto és SimpleAbilityInfo a types/game.types.ts-ből jön, az authStore használja őket

const router = useRouter();
const authStore = useAuthStore();
const selectedArchetypeId = ref<number | null>(null);
const selectionError = ref<string | null>(null); // Helyi hibaüzenet a választáshoz

onMounted(async () => { // Legyen az onMounted async, ha nextTick-et is await-elünk
  console.log("ArchetypeSelectionView: onMounted triggered.");

  // Próbáljuk meg nextTick-be tenni a store hívást
  await nextTick(); // Várjuk meg, amíg a Vue befejezi a jelenlegi DOM frissítési ciklust

  // Vagy egy minimális setTimeout
  // await new Promise(resolve => setTimeout(resolve, 0)); // 0ms setTimeout is a következő tickre teszi

  console.log("ArchetypeSelectionView: Attempting to call fetchSelectableArchetypes after nextTick/delay.");
  try {
    await authStore.fetchSelectableArchetypes();
    console.log("ArchetypeSelectionView: fetchSelectableArchetypes call finished.");
  } catch (e) {
    // Bár az akció kezeli a saját hibáit, itt is logolhatunk, ha maga a hívás dob kivételt
    console.error("ArchetypeSelectionView: Error calling fetchSelectableArchetypes:", e);
  }
});

const selectArchetype = (archetypeId: number) => {
  selectedArchetypeId.value = archetypeId;
  selectionError.value = null; // Hiba törlése választáskor
};

const confirmSelection = async () => {
  if (selectedArchetypeId.value === null) {
    selectionError.value = "Kérlek, válassz egy karaktertípust!";
    return;
  }
  selectionError.value = null; // Hiba törlése próbálkozás előtt
  const success = await authStore.selectAndSaveArchetype(selectedArchetypeId.value);
  if (success) {
    // Sikeres mentés után a user objektum frissült a store-ban.
    // A router guardnak ez alapján a dashboardra kellene irányítania.
    router.push({ name: 'dashboard' });
  } else {
      // Az authStore.archetypeSelectionError tartalmazza a hibát
      selectionError.value = authStore.getArchetypeSelectionError || "Ismeretlen hiba történt a választás mentésekor.";
  }
};

const onImageError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement;
  const fallbackSrc = '/images/archetypes/default_icon.png';

  // Ha már a fallback képet próbáltuk betölteni és az is hibát dobott, ne csináljunk semmit tovább.
  if (imgElement.src.endsWith(fallbackSrc)) {
    console.error('Fallback image also failed to load:', fallbackSrc);
    // Opcionálisan elrejtheted a képet, vagy egy placeholder CSS class-t adhatsz neki
    // imgElement.style.display = 'none';
    return;
  }

  // Első hiba esetén próbálkozz a default képpel
  console.warn(`Image failed to load (original src: ${imgElement.src}). Attempting fallback: ${fallbackSrc}`);
  imgElement.src = fallbackSrc;
};
</script>

<style scoped>
/* Stílusok a LoginView/DashboardView mintájára, de az archetípus választóhoz igazítva */
.archetype-selection-page {
  min-height: 100vh;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-gradient-start); /* Globális háttér */
  color: var(--text-primary);
  font-family: 'EB Garamond', serif;
}
.container {
    width: 100%;
    max-width: 1200px; /* Lehet szélesebb a kártyák miatt */
    text-align: center;
}
.page-title {
  font-family: 'Cinzel Decorative', cursive;
  font-size: clamp(2.5rem, 6vw, 3.5rem);
  color: var(--accent-primary);
  margin-bottom: 10px;
}
.page-intro {
  font-size: clamp(1rem, 2.5vw, 1.15rem);
  color: var(--text-secondary);
  max-width: 750px;
  margin: 0 auto 40px auto;
  line-height: 1.7;
}
.archetypes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* 1, 2 vagy 3 oszlop */
  gap: 30px;
  margin-bottom: 40px;
}
.archetype-card {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.archetype-card:hover, .archetype-card.selected {
  transform: translateY(-5px) scale(1.02);
  border-color: var(--accent-primary);
  box-shadow: 0 0 25px rgba(var(--accent-rgb, 255, 215, 0), 0.25);
}
.archetype-card.selected {
  outline: 3px solid var(--accent-primary);
}
.archetype-icon img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
  border: 3px solid var(--accent-secondary);
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
}
.archetype-content h3 {
  font-family: 'Cinzel', serif;
  color: var(--accent-secondary);
  font-size: 1.6em;
  margin-top: 0;
  margin-bottom: 10px;
}
.archetype-description {
  font-size: 0.9em;
  color: var(--text-secondary);
  margin-bottom: 15px;
  min-height: 50px; /* Egyenlő magasságokért */
}
.archetype-details {
  font-size: 0.85em;
  text-align: left;
  width: 100%;
  margin-top: auto; /* Alulra tolja */
  padding-top: 10px;
  border-top: 1px solid var(--panel-border);
}
.archetype-details ul {
  padding-left: 0;
  list-style-position: inside; /* Behúzza a listajelzőket */
  margin: 5px 0;
}
.archetype-details li { margin-bottom: 3px; }
.archetype-details p > strong { color: var(--text-primary); }

.selection-footer { margin-top: 30px; }
.confirm-button {
  background: var(--button-bg);
  color: var(--button-text);
  /* ... (többi gomb stílus a Dashboardról) */
  padding: 12px 35px;
  font-size: 1.2em;
}
.confirm-button:hover:not(:disabled) { background: var(--button-hover-bg); }
.confirm-button:disabled { /* ... */ }

.loading-message, .error-message, .info-message { /* ... */ }
.error-message.main-error { /* A store errorhoz */ }
</style>