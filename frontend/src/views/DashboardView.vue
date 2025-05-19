<template>
  <div class="dashboard-view-container">
    <section class="hero">
      <h1>A TE KALANDJÁTÉKOD<br /><span>EGY ÚJ VILÁG VÁR!</span></h1>
      <p class="game-description">
        Lépj be egy varázslatos, rejtélyekkel és veszélyekkel teli világba! Hozz döntéseket,
        küzdj meg ellenfelekkel, gyűjts ősi ereklyéket és alakítsd saját sorsodat.
        Minden választás számít!
      </p>
      </section>

    <section class="gallery" id="stories-section">
      <h2 class="section-title">Választható Kalandok</h2>
      <div v-if="storyStore.isLoading" class="loading-message">Sztorik töltése...</div>
      <div v-else-if="storyStore.getError" class="error-message">
        Hiba a sztorik betöltésekor: {{ storyStore.getError }}
      </div>
      <div v-else-if="storyStore.stories.length > 0" class="stories-grid">
        <div
          v-for="story in storyStore.stories"
          :key="story.id"
          class="card"
          @click="handleStartStory(story.id)"
          role="button"
          tabindex="0"
          :data-tooltip="story.description || story.title"
        >
          <div class="card-image-placeholder"> 
             <span>📜</span> 
          </div>
          <h3>{{ story.title }}</h3>
          <div class="details">
            {{ story.description ? truncateText(story.description, 60) : 'Indítsd el a kalandot!' }}
          </div>
          <button class="play-button">Kaland Indítása</button>
        </div>
      </div>
      <div v-else class="info-message">
        Jelenleg nincsenek elérhető sztorik. Nézz vissza később!
      </div>
    </section>

    <section class="info-grid-section" id="features-section">
        <h2 class="section-title">Mit Kínál a Játék?</h2>
        <div class="info-grid">
            <div class="info-box">
                <h4>Lebilincselő Történetek</h4>
                <p>Merülj el több, egyedi történetben, ahol döntéseid alakítják a végkifejletet.</p>
            </div>
            <div class="info-box">
                <h4>Karakterfejlődés</h4>
                <p>Fejleszd hősödet, gyűjts tapasztalati pontokat, lépj szintet és válj erősebbé.</p>
            </div>
            <div class="info-box">
                <h4>Tárgyak és Felszerelés</h4>
                <p>Keress és használj varázslatos tárgyakat, fegyvereket és páncélokat.</p>
            </div>
            <div class="info-box">
                <h4>Taktikus Harc</h4>
                <p>Küzdj meg ellenfelekkel körökre osztott harcban, használd képességeidet és tárgyaidat.</p>
            </div>
            <div class="info-box">
                <h4>Admin Felület</h4>
                <p>Hozz létre és szerkessz saját kalandokat a könnyen használható adminisztrációs eszközökkel.</p>
            </div>
            <div class="info-box">
                <h4>Folyamatosan Bővülő Világ</h4>
                <p>Új történetek és funkciók érkeznek, hogy sose fogyj ki a kalandokból!</p>
            </div>
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


    <footer class="dashboard-footer">
      <button v-if="authStore.isAuthenticated && authStore.isAdmin" @click="goToAdmin" class="footer-button">
        Admin Felület
      </button>
      <button @click="showHelp" class="footer-button">Súgó (TODO)</button>
      <button @click="showContact" class="footer-button">Kapcsolat (TODO)</button>
    </footer>

  </div>
</template>

<script setup lang="ts">
// A script setup rész nagyjából ugyanaz maradhat, mint a #138-as válaszban
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useStoryStore } from '../stores/story';
import ImageGalleryTeaser from '../components/ImageGalleryTeaser.vue';
import CharacterSlider from '../components/CharacterSlider.vue'; 
// import { useGameStore } from '@/stores/game'; // Ha a start game logikához kell majd

const router = useRouter();
const authStore = useAuthStore();
const storyStore = useStoryStore();
// const gameStore = useGameStore();

onMounted(() => {
  storyStore.fetchAvailableStories();
});

const truncateText = (text: string, length: number): string => {
    return text && text.length > length ? text.substring(0, length) + '...' : text || '';
};

const handleStartStory = async (storyId: number) => {
  console.log(`Starting story with ID: ${storyId}`);
  // TODO: Backend hívás a karakter current_node_id-jának beállítására a story.starting_node_id alapján
  // Pl. await gameStore.selectStoryAndStart(storyId);
  alert(`Sztori indítása (ID: ${storyId}) - A karakter kezdőpozíciójának beállítása a backend oldalon még szükséges!`);
  // Ha a backend beállította, akkor navigálhatunk:
  // router.push({ name: 'game' });
};

const goToAdmin = () => { router.push({ name: 'admin-dashboard' }); };
const showHelp = () => alert('Súgó funkció fejlesztés alatt!');
const showContact = () => alert('Kapcsolat funkció fejlesztés alatt!');
// A handleLogout az AppHeader.vue-ban van, itt nem kell, ha a header globális
</script>

<style scoped>
/* Itt jönnek a CSS szabályok a HTML template alapján */

.dashboard-view-container { /* Ez a legkülső konténer, a body stílusát veszi át */
  width: 100%;
  min-height: 100vh;
  padding: 0; /* A paddinget a belső szekciók kapják */
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Hero Szekció Stílusai */
.hero {
  width: 100%;
  text-align: center;
  padding: 6rem 2rem 4rem 2rem; /* Nagyobb padding fent */
  /* A háttér a body-n vagy a .dashboard-view-container-en van */
  /* Vagy ide is tehetsz egyedi hero hátteret: */
  /* background: radial-gradient(circle at 50% 30%, rgba(30, 30, 70, 0.8), transparent 70%), url('/images/hero-bg.jpg') no-repeat center center/cover; */
  color: var(--text); /* A CSS változókat használjuk */
}
.hero h1 {
  font-family: 'Cinzel Decorative', cursive; /* Vagy amit választottál */
  font-size: clamp(2.5rem, 6vw, 4rem); /* Reszponzív betűméret */
  margin-bottom: 1rem;
  line-height: 1.2;
  text-shadow: 0 0 10px rgba(255, 92, 0, 0.3), 0 0 20px rgba(255, 92, 0, 0.2); /* Finom narancs fény */
}
.hero h1 span {
  color: var(--accent);
}
.hero .game-description { /* Külön stílus a hero-n belüli leírásnak */
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  max-width: 700px;
  margin: 1.5rem auto 0 auto;
  color: #d0d0e0; /* Világosabb */
  line-height: 1.8;
}
.image-gallery-teaser-section, .character-slider-section {
    width: 100%;
    padding: 2rem 0; /* Vertikális padding a szekcióknak */
}

/* Általános Szekció Cím */
.section-title {
    font-family: 'Cinzel Decorative', cursive;
    font-size: clamp(1.8rem, 4vw, 2.5rem);
    color: var(--accent);
    text-align: center;
    margin-top: 3rem;
    margin-bottom: 2rem;
    text-shadow: 0 0 8px rgba(0,0,0,0.5);
}

/* Sztori Galéria és Kártyák Stílusai */
.gallery {
  width: 100%;
  max-width: 1200px; /* Lehet szélesebb a kártyáknak */
  padding: 2rem 2rem 3rem 2rem;
}
.stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Kártyák mérete */
  gap: 2rem;
}
.card {
  background: var(--card-bg);
  padding: 1.5rem; /* Több padding */
  border-radius: 10px;
  text-align: left; /* Szöveg balra igazítva a kártyán belül */
  border: 1px solid rgba(255, 92, 0, 0.3); /* Finom narancs keret */
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  position: relative;
  display: flex;
  flex-direction: column; /* Tartalom függőlegesen */
}
.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2), 0 0 25px rgba(255, 92, 0, 0.3);
}
.card-image-placeholder {
    font-size: 3em;
    text-align: center;
    padding: 20px 0;
    color: var(--accent);
    /* Ide tehetnél egy alapértelmezett képet vagy ikont */
}
.card h3 { /* Sztori címe */
  margin-top: 0.5rem;
  font-family: 'Cinzel', serif; /* Címekhez illő font */
  font-size: 1.5rem;
  color: #f0f0f0; /* Fehéres */
  margin-bottom: 0.5rem;
}
.card .details { /* Sztori leírása */
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #a0a0b0; /* Halványabb */
  flex-grow: 1; /* Kitölti a helyet, hogy a gomb alulra kerüljön */
  margin-bottom: 1rem;
}
.card .play-button {
  margin-top: auto; /* Gombot az aljára tolja */
  background: var(--accent);
  border: none;
  color: var(--button-text);
  padding: 0.75rem 1.5rem; /* Nagyobb gomb */
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
  font-weight: bold;
  text-transform: uppercase;
}
.card .play-button:hover {
  background: #e04e00; /* Sötétebb narancs */
}

/* Info Grid Szekció Stílusai */
.info-grid-section {
    width: 100%;
    padding: 3rem 2rem;
    background: rgba(0,0,0,0.2); /* Enyhén sötétebb háttérsáv */
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
.info-box:hover {
  transform: translateY(-5px);
}
.info-box h4 {
  color: var(--accent);
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-family: 'Cinzel', serif;
}
.info-box p {
  color: #b0b0b0;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* Lábléc Stílusai */
.dashboard-footer {
  width: 100%;
  background: var(--header-bg); /* Egyezzen a headerrel */
  text-align: center;
  padding: 2rem 0;
  margin-top: 3rem; /* Térköz az utolsó szekció után */
  border-top: 1px solid rgba(255,255,255,0.1);
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