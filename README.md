Kalandjáték Kockázat - Szöveges Kalandjáték Motor
Üdv a Kalandjáték Kockázat projektben! Ez egy modern, teljeskörű (full-stack) webalkalmazás, ami egy rugalmas motort biztosít szöveges, választás-alapú RPG kalandjátékok létrehozásához és játszásához. A projekt egy NestJS alapú backend API-ra és egy Vue 3 alapú frontend felületre épül, mindezt Docker konténerekben futtatva a könnyű hordozhatóság és fejlesztés érdekében.

A rendszer központi eleme a sztorinkénti haladás, ahol egy játékos több, egymástól független kalandban is részt vehet a karakterével, és a haladása, leltára, képességei minden sztorihoz külön vannak elmentve. A játékmenedzserek egy átfogó adminisztrációs felületen keresztül hozhatnak létre és szerkeszthetnek minden játékelemet, a történeti csomópontoktól kezdve a tárgyakon és képességeken át egészen a karaktertípusokig.

Főbb Jellemzők
Játékos Funkciók
Dinamikus, Elágazó Történetvezetés: A játékos döntései közvetlenül befolyásolják a kaland alakulását.

Sztorinkénti Haladás: Egy karakter több, független sztorit is elkezdhet, folytathat vagy újrakezdhet. A statisztikák, leltár, szint és képességek minden sztorihoz külön vannak elmentve.

Választható Karakter Archetípusok: A játék elején a játékos előre definiált archetípusok (pl. Harcos, Varázsló) közül választhat, amelyek kezdő statisztika bónuszokat és képességeket adnak.

Részletes Karakterfejlődés:

A karakterek tapasztalati pontokat (XP) szereznek és szintet lépnek.

Szintlépéskor a maximális életerő (Stamina) automatikusan nő.

A játékos tehetségpontokat (Talent Points) kap, amiket egy felugró Karakterlapon oszthat szét az alap statisztikáira (Skill, Luck, Defense, Stamina).

Képességrendszer:

A karakterek tehetségpontokért és szintkövetelmények teljesítésével új passzív és aktív harci képességeket tanulhatnak meg.

A passzív képességek (pl. +10 Stamina) automatikusan érvényesülnek a karakter statisztikáin.

Körökre Osztott Harcrendszer:

A játékos választhat Támadás, Védekezés, Tárgyhasználat és megtanult Aktív Képességek között.

Az ellenfelek rendelkezhetnek telegrafált speciális támadásokkal, amik ellen a "Védekezés" akció különösen hatékony.

Strukturált, szekvenciálisan megjelenő harci napló a jobb átláthatóságért.

Felszerelés- és Leltárkezelés:

Sztorinkénti leltár.

Felszerelhető fegyverek és páncélok, amelyek passzív bónuszokat adnak a karakter statisztikáihoz.

Használható tárgyak (pl. gyógyitalok) harcon kívül és harc közben is.

Modern Felhasználói Felület:

Tematikus, reszponzív (mobilbarát) design a Dashboardon, bejelentkezési/regisztrációs oldalakon és a játékfelületen.

Interaktív Dashboard a sztorik indításához, folytatásához és újrakezdéséhez.

Felugró Karakterlap és Minimap a játék közben.

Adminisztrátori Funkciók
Teljeskörű CRUD Menedzsment: Az összes alapvető játékelem létrehozható, olvasható, frissíthető és törölhető egy biztonságos, jelszóval védett admin felületen keresztül:

Sztorik (Stories): Cím, leírás, kezdő node, publikált állapot.

Karakter Archetípusok (Character Archetypes): Név, leírás, ikon, alap stat bónuszok, kezdő képességek.

Képességek (Abilities): Név, leírás, típus (passzív, aktív), effektus, költség, szint- és előfeltétel-követelmények, archetípus-korlátozások.

Tárgyak (Items): Név, leírás, típus (fegyver, páncél, kulcs, potion), effektus, használhatóság.

Ellenségek (Enemies): Név, statisztikák, item drop, XP jutalom, speciális támadások definiálása.

Történeti Csomópontok (Story Nodes): Szöveg, kép, HP effekt, tárgyjutalom, ellenfél hozzárendelése, győzelmi és vereségi cél-node-ok beállítása harcokhoz.

Választások (Choices): Szöveg, forrás- és cél-node összekötése, feltételek (szükséges stat, szükséges tárgy, tárgyköltség) beállítása.

Felhasználóbarát Felület: A legtöbb ID-alapú hivatkozás (pl. cél-node kiválasztása) legördülő listákkal van megoldva a könnyebb és hibamentesebb tartalomgyártás érdekében.

Vizuális Térképszerkesztő: Egy alapvető gráf nézet, ami vizuálisan megjeleníti a Story Node-ok és a Choices közötti kapcsolatokat.

Technológiai Készlet
Backend:

Framework: NestJS

Nyelv: TypeScript

Adatbázis Kezelés: Knex.js Query Builder

Adatbázis: PostgreSQL

Authentikáció: JWT (JSON Web Tokens), Passport.js

Frontend:

Framework: Vue 3 (Composition API, <script setup>)

Nyelv: TypeScript

Állapotkezelés: Pinia

API Kommunikáció: Axios

Build Eszköz: Vite

Környezet:

Konténerizáció: Docker & Docker Compose

Telepítés és Futtatás
A projekt elindításához Docker és Docker Compose szükséges.

Repository Klónozása:
git clone <repository_url>
cd <repository_mappa>

Környezeti Változók Létrehozása:
A backend mappában hozz létre egy .env fájlt a .env.example alapján, és add meg a szükséges adatbázis és JWT adatokat.

# .env fájl a backend/ mappában

DB_HOST=kalandjatek_db
DB_PORT=5432
DB_USER=gameuser
DB_PASSWORD=your_secret_password
DB_NAME=kalandjatek_db
JWT_SECRET=your_super_secret_jwt_key

Konténerek Elindítása:
A projekt gyökérmappájából futtasd a következő parancsot:
docker compose up -d --build

Ez felépíti és elindítja a frontend, backend és db service-eket.

Adatbázis Migrációk és Seederek Futtatása:
Az első indítás után (és minden adatbázis séma változás után) futtatni kell a migrációkat és a seedereket.

# Migrációk futtatása

docker compose --profile tools run --rm migrate npx knex migrate:latest --knexfile /usr/src/app/knexfile.js

# Seederek futtatása (feltölti az adatbázist alap adatokkal)

docker compose --profile tools run --rm migrate npx knex seed:run --knexfile /usr/src/app/knexfile.js

Használat
Frontend Elérése: Nyisd meg a böngésződben a http://localhost:5173 címet.

Backend API: Az API a http://localhost:3000 címen érhető el (pl. Postman teszteléshez).

Admin Felhasználó: A seeder létrehoz egy alapértelmezett admin felhasználót a következő adatokkal (ezt módosítsd a backend/seeds/admin_user_seed.js-ben):

Email: admin@kalandjatek.hu

Jelszó: password

Jövőbeli Tervek (Roadmap)
Játékos oldali grafikus minimap SVG fa-szerkezettel.

Vizuális talentfa UI a képességek fejlesztéséhez.

"Menekülés" akció bevezetése a harcba.

Szerencse (Luck) statisztika szerepének növelése (pl. kritikus találat, több loot).

"Undo" funkció a játékosnak (utolsó 1-3 lépés visszavonása).

Részletesebb admin felület a felhasználók és karaktereik közvetlen menedzseléséhez.

Hangeffektek és zene.

Új, nagyszabású történetek és tartalmak létrehozása.
