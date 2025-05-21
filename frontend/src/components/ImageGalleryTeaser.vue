<template>
  <div class="gallery-teaser-wrapper">
    <!-- <h2 class="section-title">Pillantás a Világokba</h2> -->
    <div class="image-gallery-grid">
      <div
        v-for="n in 6"
        :key="n"
        class="gallery-item"
        @click="imageClicked(n)"
        role="link"
        tabindex="0"
        :aria-label="`Galéria kép ${n}`"
      >
        <img :src="`/images/gallery/teaser-${n}.jpg`" :alt="`Hangulatkép ${n}`" class="gallery-image" />
        <div class="item-overlay">
          <span class="overlay-text">Felfedezés...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const imageClicked = (imageNumber: number) => {
  alert(`Kattintottál a(z) ${imageNumber}. képre! Ide jöhet majd a továbblépés.`);
  // Pl. router.push(...) vagy esemény kibocsátása
};
</script>

<style scoped>
.gallery-teaser-wrapper {
  width: 100%;
  max-width: 1100px; /* Illeszkedjen a Dashboard többi eleméhez */
  margin: 40px auto;
  padding: 0 20px; /* Oldalsó padding */
}

.section-title { /* Ezt a stílust már a DashboardView-ban is használhattuk */
  font-family: 'Cinzel Decorative', cursive;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  color: var(--accent-primary); /* Arany kiemelés */
  text-align: center;
  margin-bottom: 30px;
  text-shadow: 0 0 8px rgba(0,0,0,0.5);
}

.image-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Reszponzív rács */
  gap: 25px;
}

.gallery-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  aspect-ratio: 4 / 3; /* Képarány tartása */
  background-color: var(--panel-bg); /* Háttér, amíg a kép töltődik */
  border: 1px solid var(--panel-border);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.gallery-item:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(var(--accent-rgb, 255, 215, 0), 0.2); /* Finom arany glow hoverre */
}

.gallery-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover; /* Kép méretezése, hogy kitöltse a konténert vágás nélkül */
  transition: opacity 0.3s ease-in-out;
}

.gallery-item:hover .gallery-image {
  opacity: 0.8;
}

.item-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(13, 18, 43, 0.9) 0%, transparent 100%); /* Sötét átmenet alulról */
  color: var(--text-primary);
  padding: 20px 15px 15px 15px;
  text-align: center;
  opacity: 0; /* Alapból rejtett */
  transform: translateY(20px); /* Alulról jön be */
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.gallery-item:hover .item-overlay {
  opacity: 1;
  transform: translateY(0);
}

.overlay-text {
  font-family: 'Cinzel', serif;
  font-size: 1.1em;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(0,0,0,0.7);
}
</style>