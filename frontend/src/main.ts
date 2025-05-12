import { createApp } from "vue";
import { createPinia } from "pinia";
// import './style.css'
import App from "./App.vue";
import router from "./router";
import "vis-network/styles/vis-network.css";

// import './assets/main.css'

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount("#app");
