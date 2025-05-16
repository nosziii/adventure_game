<template>
  <div>
    <h1>Admin Kezdőlap</h1>
    <p>Üdv az admin felületen!</p>
    <nav>
        <router-link to="/admin/nodes">Story Node-ok Kezelése</router-link>
        <li><router-link to="/admin/choices">Választások Kezelése</router-link></li>
        <li><router-link to="/admin/items">Tárgyak Kezelése</router-link></li>
         <li><router-link to="/admin/enemies">Ellenségek Kezelése</router-link></li>
         <li><router-link to="/admin/map">Történet Térkép Megtekintése</router-link></li>
         <li><router-link to="/admin/stories">Sztorik Kezelése</router-link></li>
        </nav>
  </div>
</template>
<script setup lang="ts"></script>