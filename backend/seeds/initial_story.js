// backend/seeds/initial_story.js - FRISSÍTETT

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // 1. Régi adatok törlése (FONTOS a helyes sorrend a függőségek miatt!)
  console.log('Deleting existing data...');
  // Először a kapcsolótábla
  await knex('character_inventory').del();
  // Aztán a harcok (amik story_node-ra és item-re hivatkoznak)
  await knex('active_combats').del();
  // Aztán a choice-ok (amik story_node-ra és item-re hivatkoznak)
  await knex('choices').del();
  // Aztán a story_node_item (amik story_node-ra és item-re hivatkoznak)
  await knex('stories').del(); 
  // Aztán a story_node-ok (amik enemy-re és item-re hivatkoznak)
  await knex('story_nodes').del();
  // Aztán az enemies (amik item-re hivatkoznak)
  await knex('enemies').del();
  // Végül az items
  await knex('items').del();
  // A characters és users táblákat általában NEM töröljük seedeléskor, hacsak nem tesztadatok

  console.log('Inserting new seed data...');

  // 2. Tárgyak (items) beszúrása
  await knex('items').insert([
    {
      id: 1, // Explicit ID-t adunk a könnyebb hivatkozáshoz
      name: 'Rozsdás Kard',
      description: 'Egy régi, de még használható kard. Növeli az ügyességed.',
      type: 'weapon',
      effect: 'skill+2;damage+5', // Ezt a stringet majd a kódnak kell értelmeznie
      usable: false, // Felszerelés jellegű
    },
    {
      id: 2,
      name: 'Gyógyító Ital',
      description: 'Egy kis üvegcsényi piros folyadék. Visszaállít némi életerőt.',
      type: 'potion',
      effect: 'heal+30', // Kód értelmezi majd
      usable: true, // Használható
    },
    {
      id: 3,
      name: 'Rozsdás Kulcs',
      description: 'Egy régi, nehéz kulcs. Vajon mit nyit?',
      type: 'key',
      effect: null,
      usable: false
    },
    {
      id: 4, // Következő szabad ID
      name: 'Egyszerű Bőrvért',
      description: 'Alapvető védelmet nyújt a könnyebb támadások ellen.',
      type: 'armor',
      effect: 'defense+3', // +3 védelem
      usable: false, // Felszerelés
    }
  ]);
  console.log('Items inserted.');

  // 3. Ellenfél (enemies) beszúrása
  await knex('enemies').insert([
    {
      id: 1, // Ogre ID-ja
      name: 'Morcos Ogre',
      health: 60,
      skill: 12,
      attack_description: 'óriási bunkósbotjával lesújt',
      defeat_text: 'Az ogre nagyot nyögve a földre rogy.',
      item_drop_id: 3, // Rozsdás Kulcs (ha legyőzöd)
      // item_drop_id: 2, // Gyógyító Ital (ha legyőzöd)
      xp_reward: 50,
      special_attack_name: 'Bődületes Bunkócsapás',
      special_attack_damage_multiplier: 2.5, // 2.5x sebzés
      special_attack_charge_turns: 1, // 1 kör töltés után támad
      special_attack_telegraph_text: 'Az Ogre mély levegőt vesz, és magasra emeli óriási bunkóját, láthatóan egy hatalmas csapásra készül!',
      special_attack_execute_text: 'Az Ogre teljes erejéből lesújt rád a Bődületes Bunkócsapással!'
    },
  ]);
  console.log('Enemies inserted.');

  // 4. Történeti Csomópontok (story_nodes) beszúrása/frissítése
  await knex('story_nodes').insert([
    {
      id: 1, // Kezdő csomópont
      text: 'Egy sötét erdő szélén állsz. Előtted egy keskeny ösvény kanyarog be a fák közé, jobbra pedig egy düledező kunyhót látsz. Egy közeli bokor gyanúsan zizeg.',
      // is_end: false (default)
    },
    {
      id: 2, // Manós végpont
      text: 'Az ösvényen haladva hamarosan egy tisztásra érsz, ahol egy barátságos manó integet neked. Megmenekültél!',
      is_end: true,
    },
    // Node 3 mostantól az Ogre legyőzése utáni állapot lehetne, de a tervben Node 8 volt ez.
    // Hagyjuk ki a 3-ast, vagy adjunk neki új szerepet? Legyen a régi ogre helyett ez a vereség?
    {
        id: 3, // Legyen ez a Vereség node (korábban az ogre volt itt)
        text: 'Túl sokáig haboztál, és valami a sötétből elkapott... A kalandod itt véget ért.',
        is_end: true,
    },
    {
      id: 4, // Bokor (Új)
      text: 'Átkutatod a sűrű bokrot, és a levelek alatt egy rozsdás kardot találsz! Úgy tűnik, használható.',
      item_reward_id: 1, // Megkapod az 1-es ID-jű tárgyat (Rozsdás Kard)
    },
    {
      id: 6, // Kunyhó bejárata (Új)
      text: 'A kunyhó rogyadozik, de füst száll a kéményéből. Hallod, ahogy bentről morgás és csörömpölés szűrődik ki.',
    },
    {
      id: 7, // Ogre Harc (Új)
      text: 'Ahogy belépsz, egy hatalmas, morcos ogre fordul feléd bunkósbottal a kezében és rád támad!',
      enemy_id: 1, // Az 1-es ID-jű ellenfél (Morcos Ogre) jelenik meg itt
      // Itt nincs választás, a harc kimenetele dönt
    },
    // {
    //     id: 8, // Győzelem az ogre felett (Új)
    //     text: 'Nagy nehezen legyűröd az ogrét! A kunyhóban kutatva találsz egy gyógyító italt a holmijai között.',
    //     item_reward_id: 2, // Megkapod a 2-es ID-jű tárgyat (Gyógyító Ital)
    // },
    { id: 8, text: 'Nagy nehezen legyűröd az ogrét! A holmijai között egy rozsdás kulcsot találsz.' }, // Már nem ad italt itt!
    { id: 10, text: 'A kunyhó hátsó részében egy erős, zárt ajtót találsz, ami egy pincébe vezethet.'}, // <-- ÚJ NODE: Pinceajtó
    { id: 11, text: 'A kulccsal kinyitod az ajtót és leereszkedsz a sötét, dohos pincébe. Egy ládát látsz a sarokban!'},
    // Node 9 nem kell, mert a Node 3 lett a vereség vége.
  ]);
  console.log('Story nodes inserted/updated.');

  // 5. Választási lehetőségek (choices) beszúrása
  // ID-kat nem adunk meg, hagyjuk az auto-incrementet (bár ez tesztelésnél néha nehezebb)
  await knex('choices').insert([
    // Node 1 választásai
    {
      source_node_id: 1,
      target_node_id: 2,
      text: 'Elindulsz az ösvényen. (Költség: Gyógyító Ital)',
      item_cost_id: 2
    }, // -> Manó
    { source_node_id: 1, target_node_id: 6, text: 'Odamész a kunyhóhoz.' }, // -> Kunyhó bejárata
    { source_node_id: 1, target_node_id: 4, text: 'Megvizsgálod a zizegő bokrot.' }, // -> Bokor

    // Node 4 választása
    { source_node_id: 4, target_node_id: 1, text: 'Felveszed a kardot és visszamész.' }, // -> Erdőszél

    // Node 6 választásai
    { source_node_id: 6, target_node_id: 7, text: 'Bemész a kunyhóba.', required_stat_check: 'skill >= 10',required_item_id: 1 }, // -> Ogre Harc (feltétellel)
    { source_node_id: 6, target_node_id: 2, text: 'Inkább elsunnyogsz az ösvény felé.' }, // -> Manó

    // Node 8 választása (Győzelem után)
    // { source_node_id: 8, target_node_id: 2, text: 'Elhagyod a kunyhót.' }, // -> Manó
     // Node 8 (Győzelem) választása MOST Node 10-re mutat
    { source_node_id: 8, target_node_id: 10, text: 'Körülnézel a kunyhóban.' }, // <-- MÓDOSÍTOTT CÉL
    // Node 10 (Pinceajtó) választásai (ÚJAK)
    { source_node_id: 10, target_node_id: 11, text: 'Kinyitod az ajtót a kulccsal.', required_item_id: 3 }, // <-- Kell a kulcs (ID=3)
    { source_node_id: 10, target_node_id: 2, text: 'Inkább elhagyod a kunyhót az ösvény felé.' }, // -> Manó
  ]);
  console.log('Choices inserted.');

  await knex('stories').insert([
    {
      id: 1, // Adjunk neki explicit ID-t a könnyebb hivatkozásért
      title: 'Az Elveszett Kaland Kezdete',
      description: 'Egy klasszikus kaland egy sötét erdőben, egy rejtélyes kunyhóval, ogréval és egy barátságos manóval.',
      starting_node_id: 1, // Feltételezzük, hogy a Node ID 1 a kezdőpontja ennek a sztorinak
      is_published: true   // Legyen publikált, hogy a játékosok lássák
    },
    // Ide vehetsz fel majd másik sztorit is teszteléshez, pl.:
    // {
    //   id: 2,
    //   title: 'A Vár Titka (Készülőben)',
    //   description: 'Fedezd fel egy ősi vár elhagyatott termeit...',
    //   starting_node_id: X, // Ehhez kellene egy új kezdő node ID
    //   is_published: false
    // }
]);
  console.log('Seeding complete!');
};