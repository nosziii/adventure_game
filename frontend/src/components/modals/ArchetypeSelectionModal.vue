// src/components/modals/ArchetypeSelectionModal.vue
<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content archetype-selection-modal">
      <button @click="closeModal" class="close-button-modal">X</button>
      <h2 class="modal-title">Válassz Karaktertípust a Kalandhoz!</h2>
      <p class="modal-intro">A választásod befolyásolja kezdő értékeidet és képességeidet ebben a sztoriban.</p>

      <div v-if="authStore.isLoadingArchetypes" class="loading-message">Archetípusok betöltése...</div>
      <div v-else-if="authStore.getArchetypeSelectionError" class="error-message">
        Hiba: {{ authStore.getArchetypeSelectionError }}
      </div>
      <div v-else-if="archetypesToDisplay.length === 0" class="info-message">
        Nincsenek választható karaktertípusok.
      </div>

      <div v-else class="archetypes-grid-modal">
  <div
    v-for="archetype in archetypesToDisplay"
    :key="archetype.id"
    class="archetype-card-modal"
    :class="{ selected: selectedArchetypeId === archetype.id }"
    @click="selectArchetype(archetype.id)"
  >
    <div class="archetype-icon-modal">
      <img :src="archetype.iconPath || '/images/archetypes/default_icon.png'" :alt="archetype.name" @error="onImageError" />
    </div>

    <h3>{{ archetype.name }}</h3>

    <p class="archetype-description-modal">{{ truncateText(archetype.description, 80) }}</p>

    <div class="archetype-stats-modal">
      <h4>Kezdő Bónuszok:</h4>
      <ul>
        <li v-if="archetype.baseHealthBonus > 0">Életerő: <strong>+{{ archetype.baseHealthBonus }}</strong></li>
        <li v-if="archetype.baseStaminaBonus > 0">Állóképesség: <strong>+{{ archetype.baseStaminaBonus }}</strong></li>
        <li v-if="archetype.baseSkillBonus > 0">Ügyesség: <strong>+{{ archetype.baseSkillBonus }}</strong></li>
        <li v-if="archetype.baseDefenseBonus > 0">Védekezés: <strong>+{{ archetype.baseDefenseBonus }}</strong></li>
        <li v-if="archetype.baseLuckBonus > 0">Szerencse: <strong>+{{ archetype.baseLuckBonus }}</strong></li>
      </ul>
      
      <div v-if="archetype.startingAbilities && archetype.startingAbilities.length > 0" class="starting-abilities">
        <h5>Kezdő Képesség:</h5>
        <ul>
          <li v-for="ability in archetype.startingAbilities" :key="ability.id">
            {{ ability.name }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>

      <div class="selection-footer-modal" v-if="archetypesToDisplay.length > 0">
        <button 
            @click="confirmAndStart" 
            :disabled="!selectedArchetypeId || authStore.isLoadingUser" 
            class="confirm-button themed-button"
        >
          {{ authStore.isLoadingUser ? 'Indítás...' : 'Kiválaszt és Kalandra Fel!' }}
        </button>
        <p v-if="localSelectionError" class="error-message">{{ localSelectionError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';

const props = defineProps<{
  storyId: number;
}>();

const emit = defineEmits(['close-modal', 'archetype-selected']);

const authStore = useAuthStore();
const selectedArchetypeId = ref<number | null>(null);
const localSelectionError = ref<string | null>(null);

const archetypesToDisplay = computed(() => authStore.getAvailableArchetypes);

onMounted(() => {
  if (authStore.getAvailableArchetypes.length === 0) {
    authStore.fetchSelectableArchetypes();
  }
});

const selectArchetype = (archetypeId: number) => {
  selectedArchetypeId.value = archetypeId;
  localSelectionError.value = null;
};

const confirmAndStart = () => {
  if (selectedArchetypeId.value === null) {
    localSelectionError.value = "Kérlek, válassz egy karaktertípust!";
    return;
  }
  emit('archetype-selected', { storyId: props.storyId, archetypeId: selectedArchetypeId.value });
};

const closeModal = () => {
  emit('close-modal');
};
const truncateText = (text: string, length: number): string => {
    return text && text.length > length ? text.substring(0, length) + '...' : text || '';
};

// Hiba esetén a placeholder képhez
const onImageError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement;
  // Ha a default_icon betöltése is hibát dob, ne csinálj semmit tovább, hogy elkerüld a ciklust
  if (imgElement.src.includes('default_icon.png')) {
    console.error('Fallback image default_icon.png also failed to load.');
    // Opcionálisan elrejtheted a képet, vagy egy placeholder CSS-t alkalmazhatsz
    // imgElement.style.display = 'none';
    return;
  }
  // Első hiba esetén próbálkozz a default képpel
  console.warn(`Image failed to load: ${imgElement.src}. Attempting fallback.`);
  imgElement.src = '/images/story_icons/default_icon.png';
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(2px);
  transition: opacity 0.3s ease;
}

.modal-content.archetype-selection-modal {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 1rem;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.6);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
  position: relative;
  transform: scale(0.95);
  transition: transform 0.3s ease;
}

.modal-overlay.show .modal-content.archetype-selection-modal {
    transform: scale(1);
}

.close-button-modal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--button-bg);
  color: var(--button-text);
  border: none;
  padding: 0.4rem 0.8rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}

.close-button-modal:hover {
  background: var(--button-hover-bg);
}

.modal-title {
  font-family: 'Cinzel Decorative', cursive;
  font-size: 1.6rem;
  color: var(--accent-primary);
  margin-bottom: 1rem;
  text-align: center;
}

.modal-intro {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.archetypes-grid-modal {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
  padding: 1rem;
}

.archetype-card-modal {
  background: rgba(18, 11, 25, 0.6); 
  border: 1px solid var(--panel-border);
  padding: 1.5rem; 
  border-radius: 0.75rem;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  display: flex; 
  flex-direction: column;
  justify-content: center; /* Függőlegesen középre igazít */
  align-items: center;     /* Vízszintesen középre igazít */
}

.archetype-card-modal:hover {
  transform: translateY(-5px) scale(1.02); /* Lebegő hatás */
  border-color: var(--accent-primary);
  box-shadow: 0 0 15px rgba(128, 70, 255, 0.3);
}

.archetype-card-modal.selected {
  border-color: var(--accent-primary-light, #c5a8ff); /* Világosabb keret */
  /* A régi outline helyett egy belső ragyogás */
  box-shadow: 0 0 20px rgba(128, 70, 255, 0.7), inset 0 0 15px rgba(18, 11, 25, 0.5);
  transform: translateY(-5px) scale(1.05); /* Kicsit jobban kiemeli */
}

.archetype-icon-modal img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 1rem;
  background: #222;
  border: 1px solid var(--panel-border);
}

.archetype-description-modal {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

/* ÚJ: Statisztikák szekció stílusa */
.archetype-stats-modal {
    margin-top: auto; /* Letolja a kártya aljára */
    padding-top: 1rem;
    font-size: 0.8rem;
    text-align: left;
    color: var(--text-secondary);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.archetype-stats-modal h4 {
    font-family: 'Cinzel', serif; /* Tematikusabb font */
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    color: var(--accent-primary);
}
.archetype-stats-modal ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}
.archetype-stats-modal li {
    margin-bottom: 0.25rem;
}
.archetype-stats-modal li strong {
    color: var(--text-primary);
    float: right; /* Értékek jobbra igazítása */
}

.selection-footer-modal {
  margin-top: 2rem;
  text-align: center;
}

.confirm-button:not(:disabled) {
  opacity: 1;
  background: linear-gradient(145deg, var(--accent-primary), #5a2c9e); /* Látványosabb háttér */
  box-shadow: 0 0 15px rgba(128, 70, 255, 0.4);
}

.confirm-button {
  padding: 10px 16px;
  font-size: 1rem;
  font-weight: bold;
  background: var(--button-bg);
  color: var(--button-text);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-button:not(:disabled):hover {
  background: linear-gradient(145deg, #a584e3, var(--accent-primary));
  box-shadow: 0 0 25px rgba(128, 70, 255, 0.7);
  transform: scale(1.05);
}

.confirm-button:hover {
  background: var(--button-hover-bg);
}
.confirm-button:disabled {
  cursor: not-allowed;
}

.loading-message,
.error-message,
.info-message {
  text-align: center;
  margin-top: 1rem;
  color: var(--text-secondary);
}
</style>
