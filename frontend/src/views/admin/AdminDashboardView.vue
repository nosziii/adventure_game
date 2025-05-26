<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <h1>Admin Kezdőlap</h1>
      <p>Üdv az admin felületen!</p>
    </header>

    <nav class="admin-nav">
      <ul>
        <li>
          <router-link to="/admin/nodes">
            <span class="icon">📚</span> Story Node-ok
          </router-link>
        </li>
        <li>
          <router-link to="/admin/choices">
            <span class="icon">🔀</span> Választások
          </router-link>
        </li>
        <li>
          <router-link to="/admin/items">
            <span class="icon">🎒</span> Tárgyak
          </router-link>
        </li>
        <li>
          <router-link to="/admin/enemies">
            <span class="icon">👹</span> Ellenségek
          </router-link>
        </li>
        <li>
          <router-link to="/admin/map">
            <span class="icon">🗺️</span> Térkép
          </router-link>
        </li>
        <li>
          <router-link to="/admin/stories">
            <span class="icon">📖</span> Sztorik
          </router-link>
        </li>
        <li>
          <router-link to="/admin/abilities">
            <span class="icon">✨</span> Képességek
          </router-link>
        </li>
        <li><router-link to="/admin/archetypes">
          <span class="icon">🔮</span>Karakter Archetípusok Kezelése
        </router-link></li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
// Még nincs szükség scriptre itt
</script>

<style scoped>
.admin-dashboard {
  max-width: 900px;
  margin: 80px auto;
  padding: 2rem 1rem;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 1rem;
  box-shadow: 0 0 30px rgba(179, 136, 255, 0.1);
  backdrop-filter: blur(6px);
}

.admin-header {
  text-align: center;
  margin-bottom: 2rem;
}

.admin-header h1 {
  font-family: 'Cinzel Decorative', cursive;
  font-size: 2.5rem;
  color: var(--accent-primary);
  margin: 0;
}

.admin-header p {
  font-style: italic;
  color: var(--text-secondary);
}

.admin-nav ul {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.admin-nav li {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.admin-nav li:hover {
  border-color: var(--input-focus-border);
  background: rgba(179, 136, 255, 0.1);
}

.admin-nav a {
  display: flex;
  align-items: center;
  padding: 1rem;
  color: var(--input-text);
  font-weight: 500;
  transition: color 0.3s;
}

.admin-nav a:hover {
  color: var(--accent-primary);
}

.admin-nav .icon {
  font-size: 1.4rem;
  margin-right: 0.75rem;
}
</style>
