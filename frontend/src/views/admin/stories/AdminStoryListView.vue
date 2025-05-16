<template>
  <div class="admin-story-list">
    <h1>Sztorik Kezelése</h1>
    <div v-if="store.isLoading">Adatok töltése...</div>
    <div v-else-if="store.getError" class="error">Hiba: {{ store.getError }}</div>
    <div v-else>
      <button @click="goToCreateStory" class="create-button">Új Sztori Létrehozása</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cím</th>
            <th>Kezdő Node ID</th>
            <th>Publikált?</th>
            <th>Műveletek</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="story in store.allStories" :key="story.id">
            <td>{{ story.id }}</td>
            <td>{{ story.title }}</td>
            <td>{{ story.startingNodeId }}</td>
            <td>{{ story.isPublished ? 'Igen' : 'Nem' }}</td>
            <td>
              <button @click="goToEditStory(story.id)" class="edit-button">Szerkesztés</button>
              <button @click="handleDeleteStory(story.id, story.title)" class="delete-button">Törlés (TODO)</button>
            </td>
          </tr>
          <tr v-if="store.allStories.length === 0">
            <td colspan="5">Nincsenek még sztorik.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStoriesStore } from '../../../stores/adminStories'; // Vagy relatív útvonal

const store = useAdminStoriesStore();
const router = useRouter();

onMounted(() => {
  store.fetchStories();
});

const goToCreateStory = () => {
  router.push({ name: 'admin-stories-new' });
};

const goToEditStory = (id: number) => {
   router.push({ name: 'admin-stories-edit', params: { id: id.toString() } });
};

const deleteStory = (id: number) => {
    if (confirm(`Biztosan törölni akarod a(z) ${id} ID-jú sztorit?`)) {
       console.log(`Deleting story ${id}... (TODO: Implement store action)`);
       alert(`Sztori ${id} törlése még nincs implementálva.`);
    }
};

const handleDeleteStory = async (id: number, storyTitle: string) => {
  // Megerősítés kérése a felhasználótól
  if (confirm(`Biztosan törölni akarod a következő sztorit?\n\nID: ${id}\nCím: "${storyTitle}"`)) {
    console.log(`User confirmed deletion for story ID: ${id}`);
    await store.deleteStory(id);
    // A store.error már kezeli a hibaüzeneteket, ha a törlés nem sikerül
    // Ha a store akció sikeres, a lista automatikusan frissül, mert a state.stories változik
  } else {
    console.log(`User cancelled deletion for story ID: ${id}`);
  }
};
</script>

<style scoped>
/* Hasonló stílusok, mint a többi admin listázó nézetnél */
.admin-story-list { padding: 20px; }
.create-button { margin-bottom: 15px; padding: 8px 12px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
th { background-color: #f2f2f2; }
.edit-button, .delete-button { padding: 4px 8px; font-size: 0.9em; margin-right: 5px; cursor: pointer; }
.delete-button { background-color: #dc3545; color: white; border-color: #dc3545; }
.error { color: red; }
</style>