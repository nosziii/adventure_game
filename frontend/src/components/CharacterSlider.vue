<template>
  <div class="character-slider">
    <div v-if="characters.length > 0" class="slider-content-wrapper">
      <div class="character-card">
        <div class="character-image-container">
          <transition name="slide-fade" mode="out-in">
            <img :key="currentCharacter.id" :src="currentCharacter.image" :alt="currentCharacter.name" class="character-image" />
          </transition>
        </div>
        <div class="character-info">
          <transition name="slide-fade" mode="out-in">
            <div :key="currentCharacter.id">
              <h3>{{ currentCharacter.name }}</h3>
              <p>{{ currentCharacter.description }}</p>
              </div>
          </transition>
        </div>
      </div>
      <div v-if="characters.length > 1" class="slider-navigation">
        <button @click="prevCharacter" class="nav-button prev-button" aria-label="Előző karakter">&lt;</button>
        <div class="slide-indicators">
            <span
                v-for="(character, index) in characters"
                :key="character.id"
                class="indicator-dot"
                :class="{ active: index === currentIndex }"
                @click="goToCharacter(index)"
            ></span>
        </div>
        <button @click="nextCharacter" class="nav-button next-button" aria-label="Következő karakter">&gt;</button>
      </div>
    </div>
    <p v-else>Nincsenek bemutatható karakterek.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface CharacterShowcase {
  id: number;
  name: string;
  image: string; // Kép elérési útvonala
  description: string;
  // Opcionális: class, faction, special_quote
}

// Statikus karakter adatok (később jöhet backendről vagy store-ból)
const characters = ref<CharacterShowcase[]>([
  {
    id: 1,
    name: 'Eldrin, az Erdőjáró',
    image: '/images/characters/ranger_placeholder.jpg', // Cseréld le valós képre!
    description: 'Éles szemű és gyors kezű íjász, az erdők őrzője, aki a természet nyelvén suttog, és nyomokat olvas a szélben.'
  },
  {
    id: 2,
    name: 'Lyra, a Titkok Tudója',
    image: '/images/characters/mage_placeholder.jpg', // Cseréld le valós képre!
    description: 'Ősi tekercsek és csillagok ismerője, aki a mágia rejtett ösvényein jár, és bölcsessége fegyverként szolgál.'
  },
  {
    id: 3,
    name: 'Grom, a Rettenthetetlen',
    image: '/images/characters/warrior_placeholder.jpg', // Cseréld le valós képre!
    description: 'Hatalmas erejű bajnok, kinek csatabárdja előtt nincs megállás. A harcmező viharaként söpör végig.'
  }
]);

const currentIndex = ref(0);

const currentCharacter = computed(() => characters.value[currentIndex.value]);

const nextCharacter = () => {
  currentIndex.value = (currentIndex.value + 1) % characters.value.length;
};

const prevCharacter = () => {
  currentIndex.value = (currentIndex.value - 1 + characters.value.length) % characters.value.length;
};

const goToCharacter = (index: number) => {
    currentIndex.value = index;
};
</script>

<style scoped>
.character-slider {
  width: 100%;
  margin: 0 auto; /* Középre */
  padding: 20px;
}

.slider-content-wrapper {
    /* Később, ha komplexebb elrendezés kell a kártya és a nav között */
}

.character-card {
  display: flex;
  flex-direction: row; /* Alapértelmezett, de mobilon column lehet */
  align-items: center; /* Középre igazítás */
  gap: 30px;
  overflow: hidden; /* Átmenetekhez */
  padding: 15px;
}

.character-image-container {
  flex: 0 0 300px; /* Fix szélesség a képnek */
  height: 400px;  /* Fix magasság */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.character-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Kép méretezése, hogy kitöltse a konténert vágás nélkül */
}

.character-info {
  flex: 1;
  color: var(--text);
  text-align: left;
}

.character-info h3 {
  font-family: 'Cinzel Decorative', cursive;
  font-size: 2em;
  color: var(--accent);
  margin-top: 0;
  margin-bottom: 15px;
}

.character-info p {
  font-size: 1em;
  line-height: 1.7;
  color: #d0d8e0; /* Világosabb szöveg */
}

.slider-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 15px;
}

.nav-button {
  background-color: var(--accent);
  color: var(--button-text);
  border: none;
  border-radius: 50%; /* Kerek gombok */
  width: 40px;
  height: 40px;
  font-size: 1.5em;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease;
}
.nav-button:hover {
  background-color: #e04e00; /* Sötétebb narancs */
}

.slide-indicators {
    display: flex;
    gap: 8px;
}
.indicator-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: rgba(255,255,255,0.3);
    cursor: pointer;
    transition: background-color 0.3s ease;
}
.indicator-dot.active {
    background-color: var(--accent);
}


/* Átmenet animációk */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px); /* Jobbról jön be */
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px); /* Balra tűnik el */
}
/* Ha a prev gombot nyomjuk, fordított animáció kellene,
   de ez egyszerűbb implementációban nehezebb.
   Ezért most mindkettő ugyanúgy animál. */


/* Mobilnézet */
@media (max-width: 768px) {
  .character-card {
    flex-direction: column; /* Kép és szöveg egymás alá */
    text-align: center;
  }
  .character-image-container {
    flex-basis: auto; /* Magasságot a tartalom adja */
    width: 80%; /* Kisebb kép */
    max-width: 250px;
    height: 300px; /* Mégis adjunk neki magasságot */
    margin-bottom: 20px;
  }
  .character-info {
    text-align: center;
  }
  .character-info h3 {
      font-size: 1.8em;
  }
}
</style>