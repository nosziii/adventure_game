<template>
  <div class="dashboard-view-container">

    <section class="hero" id="hero-section">
      <h1>A TE KALANDJÁTÉKOD<br /><span>EGY ÚJ VILÁG VÁR!</span></h1>
      <p class="game-description">
        Lépj be egy varázslatos, rejtélyekkel és veszélyekkel teli világba! Hozz döntéseket,
        küzdj meg ellenfelekkel, gyűjts ősi ereklyéket és alakítsd saját sorsodat.
        Minden választás számít!
      </p>
    </section>

    <section v-if="storyStore.stories.length > 0" class="stories-grid" id="stories-section">
    <h2 class="section-title">Választható Kalandok</h2>

    <p v-if="resetStatusMessage" :class="isResetError ? 'error-message' : 'success-message'" class="reset-status">
      {{ resetStatusMessage }}
    </p>

    <div class="story-card-grid">
      <div
        v-for="story in storyStore.stories"
        :key="story.id"
        class="story-card"
        :class="{ 'active-story-card': story.isActive }"
        tabindex="0"
      >
        <div class="story-card-image">
          <img :src="getStoryImagePath(story.id)" :alt="story.title" @error="onImageError" />
        </div>
        
        <div class="story-card-content">
          <h3 :id="`story-title-${story.id}`">
            {{ story.title }}
            <span v-if="story.isActive" class="active-marker">(Aktív)</span>
          </h3>
          <p class="story-description">
            {{ story.description ? truncateText(story.description, 80) : 'Nincs részletes leírás.' }}
          </p>
        </div>

        <div class="story-actions">
          <button 
            @click="handleStartOrContinueStory(story.id, story.currentNodeIdInStory)" 
            class="action-button primary"
            :disabled="gameStore.isLoading"
          >
            {{ story.currentNodeIdInStory !== null ? 'Kaland Folytatása' : 'Új Kaland Indítása' }}
          </button>
          <button
            v-if="story.currentNodeIdInStory !== null"
            @click="handleResetStory(story.id, story.title)"
            class="action-button danger"
            :disabled="gameStore.isLoading"
          >
            Újrakezdés
          </button>
        </div>
      </div>
    </div>
  </section>
    <ArchetypeSelectionModal 
        v-if="showArchetypeSelectionModal && storyIdForArchetypeSelection !== null"
        :story-id="storyIdForArchetypeSelection"
        @archetype-selected="handleArchetypeSelectedAndStart"
        @close-modal="showArchetypeSelectionModal = false"
    />

    <section class="image-gallery-teaser-section" id="gallery-teaser-section">
      <h2 class="section-title">Pillantás a Világokba</h2>
      <ImageGalleryTeaser />
    </section>

    <section class="character-slider-section" id="character-slider-section">
      <h2 class="section-title">Ismerd meg a Hősöket</h2>
      <CharacterSlider />
    </section>

    <section class="info-grid-section" id="features-section">
        <h2 class="section-title">Mit Kínál a Játék?</h2>
        <div class="info-grid">
            <div class="info-box"><h4>Lebilincselő Történetek</h4><p>...</p></div>
            <div class="info-box"><h4>Karakterfejlődés</h4><p>...</p></div>
            <div class="info-box"><h4>Tárgyak és Felszerelés</h4><p>...</p></div>
            <div class="info-box"><h4>Taktikus Harc</h4><p>...</p></div>
            <div class="info-box"><h4>Admin Felület</h4><p>...</p></div>
            <div class="info-box"><h4>Folyamatosan Bővülő Világ</h4><p>...</p></div>
        </div>
    </section>

    <footer class="dashboard-footer" id="contact-section">
      <button v-if="authStore.isAuthenticated && authStore.isAdmin" @click="goToAdmin" class="footer-button">
        Admin Felület
      </button>
      <button @click="showHelp" class="footer-button">Súgó (TODO)</button>
      <button @click="showContact" class="footer-button">Kapcsolat (TODO)</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useStoryStore } from '../stores/story';
import { useGameStore } from '../stores/game';
import ArchetypeSelectionModal from '../components/modals/ArchetypeSelectionModal.vue';

// Komponens importok
import ImageGalleryTeaser from '../components/ImageGalleryTeaser.vue';
import CharacterSlider from '../components/CharacterSlider.vue';

const router = useRouter();
const authStore = useAuthStore();
const storyStore = useStoryStore();
const gameStore = useGameStore();

const showArchetypeSelectionModal = ref(false);
const storyIdForArchetypeSelection = ref<number | null>(null);
const resetStatusMessage = ref<string | null>(null); // <--- EZT ADD HOZZÁ
const isResetError = ref(false);

onMounted(() => {
  storyStore.fetchAvailableStories();
});

const handleStartOrContinueStory = async (storyId: number, currentStoryNodeId: number | null) => {
  if (currentStoryNodeId !== null) { // Van már haladás, FOLYTATÁS
    console.log(`[DashboardView] Continuing story with ID: ${storyId}`);
    // A selectAndStartStory a backend oldalon már kezeli a meglévő progress aktiválását
    const success = await gameStore.selectAndStartStory(storyId);
    if (success) {
      router.push({ name: 'game' });
    }
  } else { // Nincs haladás, ÚJ JÁTÉK INDÍTÁSA -> archetípus választó kell
    console.log(`[DashboardView] Starting NEW story with ID: ${storyId}, opening archetype modal.`);
    storyIdForArchetypeSelection.value = storyId;
    showArchetypeSelectionModal.value = true;
  }
};

const handleArchetypeSelectedAndStart = async (payload: { storyId: number; archetypeId: number }) => {
    console.log(`[DashboardView] Archetype ${payload.archetypeId} selected for story ${payload.storyId}. Starting game...`);
    showArchetypeSelectionModal.value = false;
    // Új store akció kell, ami a POST /api/character/story/:storyId/begin {archetypeId} -t hívja
    const success = await gameStore.beginNewStoryWithArchetype(payload.storyId, payload.archetypeId);
    if (success) {
        router.push({ name: 'game' });
    }
    // Hiba esetén a gameStore.error-t a template kijelezheti
};

const handleResetStory = async (storyId: number, storyTitle: string) => {
    if (confirm(`Biztosan újra akarod kezdeni a "${storyTitle}" kalandot? Minden eddigi haladásod ebben a sztoriban elveszik!`)) {
        console.log(`[DashboardView] User confirmed reset for story ID: ${storyId}`);
        
        const success = await gameStore.resetStoryProgress(storyId);
        
        if (success) {
            isResetError.value = false;
            resetStatusMessage.value = `A "${storyTitle}" kaland sikeresen újrakezdve!`;
            // A sikeres újrakezdés után frissítsük a sztorik listáját, hogy a "Folytatás" gomb eltűnjön
            await storyStore.fetchAvailableStories(); 
        } else {
            isResetError.value = true;
            resetStatusMessage.value = `Hiba történt az újrakezdés során: ${gameStore.getError || 'Ismeretlen hiba.'}`;
        }

        // Üzenet eltüntetése pár másodperc után
        setTimeout(() => {
            resetStatusMessage.value = null;
        }, 5000);

    } else {
        console.log(`[DashboardView] User cancelled reset for story ID: ${storyId}`);
    }
};

const truncateText = (text: string | null, length: number): string => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
};

const onImageError = (event: Event) => {
    const imgElement = event.target as HTMLImageElement;
    // Megakadályozzuk a végtelen ciklust azzal, hogy eltávolítjuk az eseménykezelőt
    imgElement.onerror = null; 
    imgElement.src = '/images/stories/default_story.png';
};

// Új segédfüggvény a sztori képekhez
const getStoryImagePath = (storyId: number): string => {
    // Később ezt lehetne a story objektumból is venni, ha lenne 'imagePath' mezője
    if (storyId === 1) {
        return '/images/stories/kaland_kezdet.jpg'; // Az 1-es ID-jú sztorihoz ("Az Elveszett Kaland Kezdete")
    }
    if (storyId === 2) {
        return '/images/stories/arnyak_varosa.png'; // A 2-es ID-jú sztorihoz ("Az Árnyak Városa")
    }
    return '/images/stories/default_story.jpg'; // Alapértelmezett kép
};

const goToAdmin = () => { router.push({ name: 'admin-dashboard' }); };
const showHelp = () => alert('Súgó funkció fejlesztés alatt!');
const showContact = () => alert('Kapcsolat funkció fejlesztés alatt!');

</script>

<style scoped>
.dashboard-view-container {
  width: 100%;
  min-height: 100vh;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(to bottom, var(--bg-gradient-start, #0a0e23), var(--bg-gradient-mid, #1c153f) 50%, var(--bg-gradient-end, #080a1a) 100%);
  color: var(--text-primary, #e0e0e0);
  font-family: 'EB Garamond', serif;
}

.dashboard-nav {
  width: 100%;
  max-width: 1200px;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  background: var(--header-bg, rgba(5,5,15,0.85));
  backdrop-filter: blur(5px);
  z-index: 900;
}

.game-title-main {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  color: var(--accent-primary, #ffd700);
  letter-spacing: 0.5px;
  line-height: 1.1;
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
  cursor: pointer;
}

.main-menu a {
  color: var(--text-secondary, #b0a8c0);
  text-decoration: none;
  margin-left: 25px;
  font-size: 0.95em;
  font-weight: 500;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.main-menu a:hover {
  color: var(--accent-primary, #ffd700);
  text-shadow: 0 0 8px var(--accent-primary, #ffd700);
}

.header-action-button {
  background: transparent;
  color: var(--text-secondary, #b0a8c0);
  border: 1px solid var(--panel-border, rgba(200, 162, 200, 0.25));
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  margin-left: 10px;
  font-weight: 500;
  font-family: 'EB Garamond', serif;
  transition: all 0.3s ease;
}

.header-action-button:hover {
  background-color: var(--accent-secondary, #ad87c1);
  color: var(--button-text, #f0e6ff);
  border-color: var(--accent-secondary, #ad87c1);
}

.header-action-button.admin-btn {
  border-color: var(--accent-primary, #ffd700);
  color: var(--accent-primary, #ffd700);
}

.header-action-button.admin-btn:hover {
  background-color: var(--accent-primary, #ffd700);
  color: var(--button-text, #0d122b);
}

.hero {
  width: 100%;
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-primary);
}

.hero h1 {
  font-family: 'Cinzel Decorative', cursive;
  font-size: clamp(2.8rem, 7vw, 4.5rem);
  margin-bottom: 1rem;
  line-height: 1.2;
  text-shadow: 0 0 15px rgba(var(--accent-rgb, 255, 215, 0), 0.4);
}

.hero h1 span {
  color: var(--accent-primary);
}

.hero .game-description {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  max-width: 750px;
  margin: 1.5rem auto 0 auto;
  color: var(--text-secondary);
  line-height: 1.8;
}

.section-title {
  font-family: 'Cinzel Decorative', cursive;
  font-size: 1.8rem;
  color: var(--accent-primary);
  text-align: center;
  margin-bottom: 1.5rem;
}

.stories-section-wrapper {
  padding: 2rem;
  border-radius: 1rem;
  background: var(--panel-bg);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.stories-grid { /* Ez most a rács konténere lett */
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 40px auto;
}

.story-card-grid { /* Maga a rács */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.story-card {
  background: var(--panel-bg, rgba(20, 20, 45, 0.75));
  border: 1px solid var(--panel-border, rgba(255, 215, 0, 0.2));
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Fontos, hogy a kép ne lógjon ki a border-radius miatt */
  transition: all 0.3s ease-out;
}

.story-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(var(--accent-rgb, 255, 215, 0), 0.15);
}

.story-card.active-story-card {
  border-color: var(--accent-primary, #ffd700);
}

.story-card-image {
  width: 100%;
  aspect-ratio: 16 / 9; /* Képarány tartása */
  background-color: #111; /* Háttér, amíg a kép töltődik */
}

.story-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-card-content {
  padding: 1rem 1.25rem;
  flex-grow: 1; /* Kitölti a rendelkezésre álló helyet */
  display: flex;
  flex-direction: column;
}

.story-card-content h3 {
  font-family: 'Cinzel', serif;
  color: var(--text-primary, #e0e0e0);
  font-size: 1.5em;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.active-marker {
  font-size: 0.7em;
  color: var(--accent-primary, #ffd700);
  font-style: italic;
  margin-left: 8px;
}

.story-description {
  font-size: 0.95em;
  color: var(--text-secondary, #b0a8c0);
  line-height: 1.5;
  margin-bottom: 1rem;
  flex-grow: 1; /* Kitölti a helyet, hogy az actions alulra kerüljön */
}
.last-played-info {
  font-size: 0.8em;
  color: var(--text-secondary, #b0a8c0);
  opacity: 0.7;
  text-align: right;
  margin-top: auto; /* Alulra tolja a leíráson belül */
}

.story-actions {
  padding: 1rem 1.25rem;
  padding-top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.action-button {
  padding: 0.6em 1.2em;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  font-size: 0.9em;
}

.action-button.primary {
  background-color: var(--accent-primary);
  color: var(--button-text);
  border-color: var(--accent-primary);
}

.action-button.primary:hover {
  background-color: var(--accent-secondary);
  border-color: var(--accent-secondary);
}

.action-button.danger {
  background-color: transparent;
  color: #ff8080;
  border-color: #ff8080;
}

.action-button.danger:hover {
  background-color: rgba(255, 128, 128, 0.1);
  color: #ff4d4d;
  border-color: #ff4d4d;
}

.image-gallery-teaser-section {
  width: 100%;
  padding: 2rem 20px;
  box-sizing: border-box;
  margin: 20px 0;
}

.info-grid-section {
  width: 100%;
  padding: 3rem 20px;
  background: rgba(0,0,0,0.15);
  box-sizing: border-box;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.info-box {
  background: var(--info-bg);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #333;
  transition: transform 0.3s ease;
}

.dashboard-footer {
  width: 100%;
  background: var(--header-bg);
  text-align: center;
  padding: 2rem 0;
  margin-top: 3rem;
  border-top: 1px solid rgba(var(--panel-border-rgb, 70,62,82), 0.5);
}

.footer-button {
  background: transparent;
  color: var(--text);
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--accent);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  margin: 0.5rem;
}

.footer-button:hover {
  background: var(--accent);
  color: #000;
}

.loading-message,
.error-message,
.info-message {
  text-align: center;
  padding: 30px;
  font-size: 1.2em;
  color: var(--text);
}

.error-message {
  color: #ff5c5c;
}

.success-message {
  color: #5cb85c;
  text-align: center;
  margin-top: 15px;
}

.character-slider-section {
  width: 100%;
  padding: 3rem 0;
  background: rgba(0,0,0,0.2);
}
</style>
