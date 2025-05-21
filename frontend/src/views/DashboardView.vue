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

    <section class="stories-section-wrapper" id="stories-section">
      <h2 class="section-title">Választható Kalandok</h2>
      <div v-if="storyStore.isLoading" class="loading-message">Sztorik töltése...</div>
      <div v-else-if="storyStore.getError" class="error-message">
        Hiba a sztorik betöltésekor: {{ storyStore.getError }}
      </div>
      <div v-else-if="storyStore.stories.length > 0" class="stories-grid">
        <div
          v-for="story in storyStore.stories"
          :key="story.id"
          class="story-card"
          :class="{ 'active-story-card': story.isActive }"
          tabindex="0"
          :aria-labelledby="`story-title-${story.id}`"
        >
          <div class="story-card-icon">
            <img :src="`/images/story_icons/story_icon_${story.id % 3 + 1}.png`" :alt="story.title" @error="onImageError" />
          </div>
          <div class="story-card-content">
            <h3 :id="`story-title-${story.id}`">
              {{ story.title }}
              <span v-if="story.isActive" class="active-marker">(Aktív)</span>
            </h3>
            <p class="story-description">
              {{ story.description ? truncateText(story.description, 70) : 'Nincs részletes leírás.' }}
            </p>
            <p v-if="story.lastPlayedAt && story.currentNodeIdInStory" class="last-played-info">
              <small>Utoljára játszva: {{ new Date(story.lastPlayedAt).toLocaleString() }}</small>
            </p>
          </div>
          <div class="story-actions">
            <button @click="handleStartOrContinueStory(story.id)" class="action-button primary">
              {{ story.currentNodeIdInStory !== null ? 'Kaland Folytatása' : 'Kaland Indítása' }}
            </button>
            <button
              v-if="story.currentNodeIdInStory !== null"
              @click="handleResetStory(story.id, story.title)"
              class="action-button danger"
            >
              Újrakezdés
            </button>
          </div>
        </div>
      </div>
      <div v-else class="info-message">
        Jelenleg nincsenek elérhető sztorik.
      </div>
    </section>

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
import { onMounted, computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useStoryStore } from '../stores/story';
import { useGameStore } from '../stores/game';

// Komponens importok
import ImageGalleryTeaser from '../components/ImageGalleryTeaser.vue';
import CharacterSlider from '../components/CharacterSlider.vue';

const router = useRouter();
const route = useRoute(); // Aktuális útvonal info
const authStore = useAuthStore();
const storyStore = useStoryStore();
const gameStore = useGameStore();

const successMessage = ref<string | null>(null); // Ha lenne itt üzenet

onMounted(() => {
  storyStore.fetchAvailableStories();
});

const truncateText = (text: string, length: number): string => {
    return text && text.length > length ? text.substring(0, length) + '...' : text || '';
};

const handleStartOrContinueStory = async (storyId: number) => {
  console.log(`[DashboardView] Starting or Continuing story with ID: ${storyId}`);
  const success = await gameStore.selectAndStartStory(storyId);
  if (success) {
    router.push({ name: 'game' });
  }
  // Hiba esetén a gameStore.error-t a template-ben lehetne kijelezni, ha van globális hibakezelő
};

const handleResetStory = async (storyId: number, storyTitle: string) => {
    if (confirm(`Biztosan újra akarod kezdeni a "${storyTitle}" kalandot? Minden eddigi haladásod ebben a sztoriban elveszik!`)) {
        console.log(`[DashboardView] User confirmed reset for story ID: ${storyId}`);
        
        const success = await gameStore.resetStoryProgress(storyId); // Hívjuk a gameStore akcióját
        
        if (success) {
            alert(`A "${storyTitle}" kaland sikeresen újrakezdve!`); // Vagy egy szebb notification
        } else {
            if (gameStore.getError) {
                alert(`Hiba történt az újrakezdés során: ${gameStore.getError}`);
            }
        }
    } else {
        console.log(`[DashboardView] User cancelled reset for story ID: ${storyId}`);
    }
};

const goToAdmin = () => { router.push({ name: 'admin-dashboard' }); };
const showHelp = () => alert('Súgó funkció fejlesztés alatt!');
const showContact = () => alert('Kapcsolat funkció fejlesztés alatt!');

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
/* Itt vannak a DashboardView specifikus stílusai a #139-es válasz alapján,
   kiegészítve/módosítva, hogy illeszkedjen a fejléc és az új szekciók
   elképzeléseihez. */

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

/* Fejléc Navigáció */
.dashboard-nav {
  width: 100%;
  max-width: 1200px; /* Lehet szélesebb a tartalomnak */
  padding: 1.5rem 2rem; /* Kicsit több padding */
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px; /* Kisebb margó a hero előtt */
  /* background-color: var(--header-bg); Ezt az AppHeader.vue-ból veheti, ha az globális */
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky; /* Sticky header */
  top: 0;
  background: var(--header-bg, rgba(5,5,15,0.85)); /* Háttér a sticky headernek, hogy ne legyen átlátszó */
  backdrop-filter: blur(5px); /* Finom blur a sticky header mögött */
  z-index: 900; /* Alacsonyabb, mint a minimap */
}

.game-title-main {
  font-size: clamp(1.5rem, 4vw, 2rem); /* Reszponzívabb */
  font-weight: 700;
  color: var(--accent-primary, #ffd700);
  letter-spacing: 0.5px;
  line-height: 1.1;
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
  cursor: pointer; /* Ha ez is a dashboardra visz */
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
.header-action-button.admin-btn { /* Admin gomb kiemelése */
    border-color: var(--accent-primary, #ffd700);
    color: var(--accent-primary, #ffd700);
}
.header-action-button.admin-btn:hover {
    background-color: var(--accent-primary, #ffd700);
    color: var(--button-text, #0d122b);
}


/* Hero Szekció */
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
.hero h1 span { color: var(--accent-primary); }
.hero .game-description {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  max-width: 750px;
  margin: 1.5rem auto 0 auto;
  color: var(--text-secondary);
  line-height: 1.8;
}

/* Általános Szekció Cím */
.section-title {
  font-family: 'Cinzel Decorative', cursive;
  font-size: clamp(2rem, 5vw, 2.8rem);
  color: var(--accent-secondary);
  text-align: center;
  margin-top: 3rem;
  margin-bottom: 2.5rem;
  text-shadow: 0 0 10px rgba(0,0,0,0.6);
}

/* Sztori Kártyák (a #148-as válaszodból finomítva) */
.stories-section-wrapper { width: 100%; padding: 0 20px; box-sizing: border-box; }
.stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 40px auto;
}
.story-card {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  padding: 20px 25px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 18px rgba(0,0,0,0.4);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.story-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 20px rgba(var(--accent-rgb, 255,215,0), 0.2);
}
.story-card.active-story-card {
  border-left: 5px solid var(--accent-primary);
}
.story-card-icon { font-size: 2.5em; text-align: center; color: var(--accent-secondary); padding: 10px 0; }
.story-card-icon img { display: block; width: 60px; height: 60px; margin: 0 auto 15px auto; border-radius: 4px; object-fit: cover;}
.story-content { flex-grow: 1; }
.story-content h3 {
  font-family: 'Cinzel', serif;
  color: var(--accent-primary);
  font-size: 1.5em; margin-top: 0; margin-bottom: 0.5rem;
}
.active-marker { font-size: 0.7em; color: var(--accent-secondary); font-style: italic; margin-left: 5px; }
.story-description { font-size: 0.95em; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem; min-height: 50px;}
.last-played-info { font-size: 0.8em; color: var(--text-secondary); opacity: 0.7; text-align: right;}
.story-actions { margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--panel-border); }

.action-button { /* Közös a kártya gomboknak */
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
.action-button.primary:hover { background-color: var(--accent-secondary); border-color: var(--accent-secondary); }
.action-button.danger {
  background-color: transparent;
  color: #ff8080;
  border-color: #ff8080;
}
.action-button.danger:hover { background-color: rgba(255, 128, 128, 0.1); color: #ff4d4d; border-color: #ff4d4d; }

/* Képes Galéria Szekció */
.image-gallery-teaser-section { width: 100%; padding: 2rem 20px; box-sizing: border-box; margin: 20px 0; }

/* Info Grid Szekció */
.info-grid-section { width: 100%; padding: 3rem 20px; background: rgba(0,0,0,0.15); box-sizing: border-box; }
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

/* Lábléc */
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
  border-radius: 25px; /* Kerekebb gombok */
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  margin: 0.5rem;
}
.footer-button:hover {
  background: var(--accent);
  color: #000; /* Sötét szöveg a narancs gombon */
}

/* Általános Töltés/Hiba Üzenetek */
.loading-message, .error-message, .info-message {
  text-align: center; padding: 30px; font-size: 1.2em; color: var(--text);
}
.error-message { color: #ff5c5c; /* Élénkebb piros */ }
.success-message { color: #5cb85c; text-align: center; margin-top: 15px; }


.character-slider-section { /* Stílus a szekciónak, ha kell */
    width: 100%;
    padding: 3rem 0;
    background: rgba(0,0,0,0.2); 
}
</style>