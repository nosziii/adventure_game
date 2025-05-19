<template>
  <div class="image-gallery-teaser">
    <div v-for="n in 8" :key="n" class="gallery-item">
      <a href="#" @click.prevent="imageClicked(n)">
        <img :src="`https://picsum.photos/seed/img${n}/400/300`" :alt="`Kép ${n}`" />
        <div class="item-overlay"><span>Részletek...</span></div>
      </a>
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
.image-gallery-teaser {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1100px; /* Illeszkedjen a többi tartalomhoz */
  margin: 0 auto; /* Középre */
}
.gallery-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  border: 2px solid var(--accent);
}
.gallery-item img {
  display: block;
  width: 100%;
  height: auto;
  transition: transform 0.4s ease;
}
.gallery-item:hover img {
  transform: scale(1.1);
}
.gallery-item a {
    display: block; /* Hogy a kép kitöltse */
}
.item-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0,0,0,0.6);
  color: white;
  padding: 10px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.4s ease;
  font-family: 'Cinzel', serif;
}
.gallery-item:hover .item-overlay {
  opacity: 1;
}
</style>