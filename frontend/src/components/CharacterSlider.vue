<template>
  <div class="character-slider-wrapper">
    <div v-if="characters.length > 0" class="character-slider">
      <div class="slider-card">
        <transition :name="transitionName" mode="out-in">
          <div :key="currentCharacter.id" class="slide-content">
            <div class="character-image-container">
              <img :src="currentCharacter.image" :alt="currentCharacter.name" class="character-image" />
            </div>
            <div class="character-info">
              <h3>{{ currentCharacter.name }}</h3>
              <p class="character-title">{{ currentCharacter.titleOrClass }}</p>
              <p class="character-description">{{ currentCharacter.description }}</p>
              <blockquote v-if="currentCharacter.quote" class="character-quote">
                "{{ currentCharacter.quote }}"
              </blockquote>
            </div>
          </div>
        </transition>
      </div>

      <div v-if="characters.length > 1" class="slider-navigation">
        <button @click="prevCharacter" class="nav-button prev" aria-label="Előző karakter">&#x276E;</button>
        <div class="slide-indicators">
          <span
            v-for="(char, index) in characters"
            :key="char.id"
            class="indicator-dot"
            :class="{ active: index === currentIndex }"
            @click="goToCharacter(index)"
            role="button"
            :aria-label="`Ugrás ${char.name} karakterhez`"
          ></span>
        </div>
        <button @click="nextCharacter" class="nav-button next" aria-label="Következő karakter">&#x276F;</button>
      </div>
    </div>
    <p v-else class="info-message">Nincsenek bemutatható karakterek.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface CharacterShowcase {
  id: number;
  name: string;
  image: string;
  description: string;
  titleOrClass?: string;
  quote?: string;
}

const characters = ref<CharacterShowcase[]>([
  {
    id: 1,
    name: 'Eldrin Fényhozó',
    titleOrClass: 'Az Erdő Szelleme',
    image: '/images/characters/eldrin_placeholder.jpg',
    description: 'Évezredek óta őrzi a Varázserdő határait, nyila csalhatatlan, és suttog a fákkal. Csak a legtisztább szívűeknek fedi fel magát.',
    quote: 'A természet türelmes, de haragja elsöprő.'
  },
  {
    id: 2,
    name: 'Lyra Holdfény',
    titleOrClass: 'A Csillagok Jósnője',
    image: '/images/characters/lyra_placeholder.jpg', 
    description: 'Az éjszakai égbolt titkait kutatja, jövőt és múltat lát a csillagok állásában. Varázslatai a kozmosz erejéből táplálkoznak.',
    quote: 'A sors fonala néha kuszának tűnik, de minden szálnak megvan a helye.'
  },
  {
    id: 3,
    name: 'Grom Vaskéz',
    titleOrClass: 'A Törzsek Bajnoka',
    image: '/images/characters/grom_placeholder.jpg',
    description: 'A hegyek fia, ki erejével és kitartásával vívta ki népe tiszteletét. Csatabárdja legendás, és szíve bátor.',
    quote: 'Az erő nem minden, de nélküle mit sem érsz a csatában!'
  }
]);

const currentIndex = ref(0);
const transitionName = ref('slide-next');

const currentCharacter = computed(() => characters.value[currentIndex.value]);

const nextCharacter = () => {
  transitionName.value = 'slide-next';
  currentIndex.value = (currentIndex.value + 1) % characters.value.length;
};

const prevCharacter = () => {
  transitionName.value = 'slide-prev';
  currentIndex.value = (currentIndex.value - 1 + characters.value.length) % characters.value.length;
};

const goToCharacter = (index: number) => {
  if (index > currentIndex.value) {
    transitionName.value = 'slide-next';
  } else if (index < currentIndex.value) {
    transitionName.value = 'slide-prev';
  }
  currentIndex.value = index;
};
</script>

<style scoped>
.character-slider-wrapper {
  width: 100%;
  max-width: 750px; /* Kicsit keskenyebb, mint a többi szekció */
  margin: 0 auto;
  padding: 30px 20px;
  background-color: rgba(var(--panel-bg-rgb, 20, 20, 45), 0.85); /* CSS változó, ha van panel-bg-rgb, vagy fix érték */
  /* Ha a --panel-bg 'rgba(20, 20, 45, 0.75)', akkor itt lehet sötétebb: rgba(10, 5, 20, 0.85) */
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  box-shadow: 0 6px 25px rgba(0,0,0,0.5);
  overflow: hidden; /* Fontos az animációkhoz */
}

.section-title { /* Ezt a DashboardView-ban definiáltuk, ha ott van a H2 */ }

.slider-card {
  /* Ez a konténer tartja a slide-content-et, ami animálódik */
  position: relative; /* Az abszolút pozicionált slide-content-hez */
  min-height: 420px; /* Adjunk neki magasságot, hogy ne ugráljon */
}

.slide-content {
  display: flex;
  flex-direction: row; /* Alapértelmezett, mobilon column lehet */
  align-items: flex-start; /* Kép és szöveg felülre igazítva */
  gap: 30px;
}

.character-image-container {
  flex: 0 0 280px; /* Kép konténer mérete */
  height: 380px;
  border-radius: 8px;
  overflow: hidden;
  background-color: rgba(0,0,0,0.3); /* Placeholder háttér a képnek */
  border: 1px solid rgba(var(--accent-rgb, 255, 215, 0), 0.2);
}

.character-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.character-info {
  flex: 1;
  color: var(--text-primary);
  padding-top: 10px;
}

.character-info h3 {
  font-family: 'Cinzel Decorative', cursive;
  font-size: clamp(1.8em, 4vw, 2.2em);
  color: var(--accent-primary);
  margin-top: 0;
  margin-bottom: 10px;
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
}
.character-title {
    font-family: 'Cinzel', serif;
    font-size: 1em;
    color: var(--accent-secondary);
    margin-bottom: 15px;
    font-style: italic;
}
.character-description {
  font-size: 0.95em;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 20px;
}
.character-quote {
    font-family: 'EB Garamond', italic;
    font-size: 1em;
    color: var(--accent-secondary);
    border-left: 3px solid var(--accent-primary);
    padding-left: 15px;
    margin-left: 0;
    opacity: 0.9;
}

.slider-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 25px;
  gap: 20px; /* Térköz a gombok és indikátorok között */
}

.nav-button {
  background-color: rgba(var(--accent-rgb, 255, 215, 0), 0.5);
  color: var(--text-primary);
  border: 1px solid var(--accent-primary);
  border-radius: 50%;
  width: 45px;
  height: 45px;
  font-size: 1.6em; /* Nagyobb nyilak */
  line-height: 1;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease, transform 0.2s ease;
}
.nav-button:hover {
  background-color: var(--accent-primary);
  color: var(--button-text);
  transform: scale(1.1);
}

.slide-indicators {
  display: flex;
  gap: 10px;
}
.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(var(--text-primary-rgb, 240, 230, 255), 0.3); /* CSS változók használata */
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.indicator-dot.active {
  background-color: var(--accent-primary);
}

/* Átmenet animációk */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
  position: absolute; /* Fontos, hogy ne ugorjon a layout */
  width: calc(100% - 30px); /* Mivel a .slider-card-nak van padding: 15px */
}

.slide-next-enter-from {
  opacity: 0;
  transform: translateX(100px);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-100px);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

.info-message { /* Ha nincs karakter */
    text-align: center;
    color: var(--text-secondary);
}


/* Mobilnézet */
@media (max-width: 768px) {
  .character-slider-wrapper {
    padding: 20px 10px;
  }
  .slide-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .character-image-container {
    flex-basis: auto;
    width: 70%;
    max-width: 220px; /* Kisebb kép mobilon */
    height: auto; /* Képarány tartása */
    aspect-ratio: 3/4; /* Képarány a képhez */
    margin-bottom: 20px;
  }
  .character-info h3 { font-size: 1.7em; }
  .character-title { font-size: 0.9em; }
  .character-description { font-size: 0.9em; }
  .character-quote { font-size: 0.95em; }
  .nav-button { width: 35px; height: 35px; font-size: 1.3em; }
  .indicator-dot { width: 8px; height: 8px; }
}
</style>