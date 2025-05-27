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
import type { ArchetypeForSelection } from '../../types/auth.types';

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
  padding-right: 0.5rem;
}

.archetype-card-modal {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--panel-border);
  padding: 1rem;
  border-radius: 0.75rem;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.archetype-card-modal:hover {
  transform: scale(1.02);
  border-color: var(--accent-primary);
}

.archetype-card-modal.selected {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}

.archetype-icon-modal img {
  width: 70px;
  height: 70px;
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

.selection-footer-modal {
  margin-top: 2rem;
  text-align: center;
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

.confirm-button:hover {
  background: var(--button-hover-bg);
}

.loading-message,
.error-message,
.info-message {
  text-align: center;
  margin-top: 1rem;
  color: var(--text-secondary);
}
</style>
