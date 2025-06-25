// backend/seeds/shadow_city_story.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // --- ÚJ TÖRTÉNET: AZ ÁRNYAK VÁROSA ---
  console.log('Inserting "Az Árnyak Városa" story...');

  // 1. Új Tárgyak (items)
  await knex('items').insert([
    {
      id: 101,
      name: 'Vámpírkönny Eszencia',
      description: 'Egy kis üvegcsényi szentelt, ezüstösen csillogó folyadék. Képes megtörni a legsötétebb rituálékat is.',
      type: 'potion',
      effect: 'ritual_break', // Ezt a speciális effektet a játékmotornak kell kezelnie
      usable: true,
    },
    {
      id: 102,
      name: 'Éjprizma Töredéke',
      description: 'Egy sötét kristálydarab, ami gyenge, pulzáló fényt bocsát ki. A sötétség erejének egy darabját hordozza.',
      type: 'relic',
      effect: 'skill+5;stamina-5', // Példa hatás: növeli a képességet, de csökkenti az életerőt
      usable: false,
    },
    {
      id: 103,
      name: 'Kopott bőrvért',
      description: 'Megviselt, de még funkcionális bőrvért. Jobb, mint a semmi.',
      type: 'armor',
      effect: 'defense+5',
      usable: false,
    },
  ]);
  console.log('New items for Shadow City inserted.');

  // 2. Új Ellenségek (enemies)
  await knex('enemies').insert([
    {
      id: 101,
      name: 'Lélekrabló',
      health: 45,
      skill: 15,
      attack_description: 'rozsdás pengéjével feléd sújt',
      defeat_text: 'A Lélekrabló felvisít, majd fekete vére a macskakőre csordulva összecsuklik.',
      item_drop_id: 3, // A már meglévő Rozsdás Kulcsot dobja (ID: 3)
      xp_reward: 40,
      special_attack_name: 'Lélekcsapás',
      special_attack_damage_multiplier: 1.8,
      special_attack_charge_turns: 1,
      special_attack_telegraph_text: 'A Lélekrabló vörös szemei izzani kezdenek, és sötét energia gyűlik a pengéje köré.',
      special_attack_execute_text: 'A Lélekrabló a Lélekcsapással a lelkedet próbálja kitépni!',
    },
    {
      id: 102,
      name: 'Árnyékúr',
      health: 250,
      skill: 35,
      attack_description: 'sötét energiával teli csapást mér rád',
      defeat_text: 'Az Árnyékúr hitetlenkedve rogy térdre, ahogy a rituálé ereje szertefoszlik. A teste lassan porrá omlik.',
      xp_reward: 500,
      special_attack_name: 'Végső Sötétség',
      special_attack_damage_multiplier: 3.0,
      special_attack_charge_turns: 2,
      special_attack_telegraph_text: 'Az Árnyékúr felemeli a kezét az Éjprizma felé, és a csarnokot elementáris sötétség kezdi elárasztani. Ez a következő támadása végzetes lehet!',
      special_attack_execute_text: 'Az Árnyékúr rád szabadítja a Végső Sötétséget, elnyelve minden fényt!',
    },
    {
      id: 103,
      name: 'Szektás csatlós',
      health: 30,
      skill: 10,
      attack_description: 'rozsdás tőrével támad',
      defeat_text: 'A csuklyás alak a földre rogy.',
      xp_reward: 15,
    },
  ]);
  console.log('New enemies for Shadow City inserted.');

  // 3. Új Képességek (abilities) - (A meglévő abilities tábla alapján)
  await knex('abilities').insert([
    {
      id: 101,
      name: 'Árnyékugrás',
      description: 'Egy gyors bűbájjal az árnyékokba olvadva kerülj az ellenfél mögé egy meglepetésszerű támadáshoz.',
      type: 'ACTIVE_COMBAT_ACTION',
      effect_string: 'surprise_attack;stamina_cost:10', // Ezt a játéknak kell kezelnie
      talent_point_cost: 2,
      level_requirement: 3,
    },
    {
      id: 102,
      name: 'Éjtekintet',
      description: 'Lehetővé teszi, hogy tökéletesen láss a teljes sötétségben is egy rövid ideig.',
      type: 'PASSIVE_EFFECT',
      effect_string: 'night_vision',
      talent_point_cost: 1,
      level_requirement: 2,
    },
    {
      id: 103,
      name: 'Mágikus Pajzs',
      description: 'Egy láthatatlan védőburkot von köréd, ami elnyeli a következő mágikus támadást.',
      type: 'ACTIVE_COMBAT_ACTION',
      effect_string: 'magic_shield;stamina_cost:20',
      talent_point_cost: 3,
      level_requirement: 5,
    },
  ]);
  console.log('New abilities for Shadow City inserted.');

  // 4. Történeti Csomópontok (story_nodes)
  await knex('story_nodes').insert([
    // --- Kezdő Fejezet ---
    {
      id: 101, // Csomópont 1 
      text: 'Késő éjszaka van a város ódon negyedében. A gázlámpák pislákoló fénye alig űzi el a ködöt a macskaköves utcákról. Régi barátod, Lea rejtélyes hívása hozott ide – eltűnt, miután valami különös nyomra bukkant a város alatti alagutakban. Most egy elhagyatottnak tűnő kapualj előtt állsz, a távolból pedig halk morajlás hallatszik, mintha valami mocorogna a szűk sikátor mélyén.',
    },
    {
      id: 102, // Csomópont 2 
      text: 'Lassan lopakodsz be a sötét sikátorba. Hirtelen egy reszelős morgás üti meg a füled, majd egy alacsony, torz testű lény lép elő a szemétkupacok közül – egy Lélekrabló. Csontos karmai között rozsdás pengét szorongat, és rád veti magát!',
      enemy_id: 101, // Harc a Lélekrablóval! A harc kimenetele dönt. Győzelem -> 104, Vereség -> (egy új vereség node)
    },
    {
      id: 103, // Csomópont 3 
      text: 'Elkerülöd a közvetlen veszélyt. Egy másik sikátorban egy rozsdás tűzlépcsőre bukkansz. Felkapaszkodva átjutsz egy udvarba, ahol egy félig nyitott csapóajtót veszel észre a földön, mely a város alatti sötét terekbe vezet.',
    },
    {
      id: 104, // Csomópont 4 
      text: 'Lihegve állsz a legyőzött Lélekrabló felett. Ahogy körülnézel, a fal tövében egy eszméletlen civilre bukkansz, akit talán te mentettél meg. A földön megcsillan valami: egy Rozsdás Kulcs. Zsebre vágod, és egy levezető lépcső felé indulsz, ami a mélybe vezet.',
      item_reward_id: 3, // Megkapod a 3-as ID-jű tárgyat (Rozsdás Kulcs)
    },
    {
      id: 105, // Csomópont 5 
      text: 'Leereszkedtél a város alatti nyirkos, dohos alagútrendszerbe. A falakon bizarr falfirkákat és ősi rúnákat látsz. Lea eldobott tárgyai jelzik, hogy jó irányba haladsz. A járat egy elágazáshoz ér: balról halk zene és beszédfoszlányok szűrődnek ki, jobbról pedig hűvös, friss levegőt érzel.',
    },
    {
      id: 106, // Csomópont 6 
      text: 'Egy tágas, boltíves csarnokba érkezel. Valaha metróállomás lehetett, most egy szekta szentélye. A terem közepén egy oltár áll, fölötte egy zöldesen pulzáló kristály lebeg: az Éjprizma. Több csuklyás alak kántál, az oltár mögött pedig egy magas, szarvakat viselő alak, az Árnyékúr vezeti a rituálét. És ott, egy oszlophoz láncolva megpillantod barátodat, Leát, eszméletlenül. Sikerül elrejtőznöd egy oszlop mögött. Cselekedned kell.',
      // A végső harc node-ja lehetne ez, vagy egy külön node, pl. 107.
    },

    // --- Befejezések ---
    {
      id: 201, // Befejezés 1 (Tragikus) 
      text: 'Előrontasz és rátámadsz az Árnyékúrra. Bár sikerül megsebezned, ő az Éjprizma erejét használva kiszívja belőled az erőt. Térdre rogysz, a fegyver kihullik a kezedből. Az utolsó kép, amit látsz, ahogy az Árnyékúr árnyéka rátok borul, és a várost elnyeli az örök éj. A kalandod tragikus véget ért.',
      is_end: true,
    },
    {
      id: 202, // Befejezés 2 (Sikeres) 
      text: 'Lopva a közelbe osonva barátod táskájából kiveszed a Vámpírkönny eszenciát, és az Éjprizmához hajítod. Az üvegcse széttörik, a szentelt folyadék pedig megsemmisíti a kristályt. A rituálé megtörik. Kiszabadítod Leát, és miközben a csarnok omladozni kezd, a felszínre menekültök, ahol a hajnal első fényei fogadnak. Megmentetted a várost. A kalandod sikeresen zárult.',
      is_end: true,
    },
    {
      id: 203, // Befejezés 3 (Alternatív) 
      text: 'Előlépsz, de nem támadsz, hanem alkut ajánlasz. Hűségedért cserébe az Árnyékúr elengedi Leát. A rituálé folytatódik, de már te is a részese vagy. A város nem süllyed teljes sötétségbe, de az árnyak hatalomra jutnak. Jutalomként megkapod az Éjprizma egy töredékét, de Lea csalódottan tekint rád. Megmentetted az életét, de sötét egyezséget kötöttél. A kalandod kétes kimenetellel zárult.',
      is_end: true,
      item_reward_id: 102, // Megkapod az Éjprizma Töredékét
    },
  ]);
  console.log('Story nodes for Shadow City inserted.');

  // 5. Választási lehetőségek (choices)
  await knex('choices').insert([
    // Csomópont 101 választásai
    { source_node_id: 101, target_node_id: 102, text: 'Belépsz az árnyakkal teli sikátorba, hogy kiderítsd a zaj forrását.' }, // 
    { source_node_id: 101, target_node_id: 103, text: 'Óvatos maradsz, és a főúton keresel biztonságosabb útvonalat.' }, // 

    // Csomópont 102 (Harc) után a logika dönt, nincs manuális választás.

    // Csomópont 103 választásai
    { source_node_id: 103, target_node_id: 105, text: 'Lemászol a csapóajtón keresztül a föld alatti alagútrendszerbe.' }, // 
    { source_node_id: 103, target_node_id: 105, text: 'Mielőtt lemennél, előkészíted Éjtekintet képességedet.', required_stat_check: 'ability_id:102' }, // Példa képesség-ellenőrzésre. 

    // Csomópont 104 választásai (Győzelem után)
    { source_node_id: 104, target_node_id: 105, text: 'Óvatosan leereszkedsz a föld alatti lépcsőn.' }, // 
    { source_node_id: 104, target_node_id: 105, text: 'Gyorsan, habozás nélkül követed a nyomokat a mélybe.' }, // 

    // Csomópont 105 választásai
    { source_node_id: 105, target_node_id: 106, text: 'Követed a zene hangját a bal oldali folyosón.' }, // 
    { source_node_id: 105, target_node_id: 106, text: 'A jobb oldali, friss levegőt hozó járat felé indulsz.' }, // // Itt mindkettő ugyanoda vezet, de lehetne elágaztatni

    // Csomópont 106 választásai (Végső döntés)
    {
      source_node_id: 106,
      target_node_id: 201, // Tragikus befejezés
      text: 'Előrontasz rejtekedből, és rátámadsz az Árnyékúrra!',
    }, // 
    {
      source_node_id: 106,
      target_node_id: 202, // Sikeres befejezés
      text: 'Megpróbálod a Vámpírkönny fiolát az Éjprizmához dobni.',
      required_item_id: 101, // Szükséges a Vámpírkönny eszencia
    }, // 
    {
      source_node_id: 106,
      target_node_id: 203, // Alternatív befejezés
      text: 'Megpróbálod szavakkal megzavarni a szertartást, és alkut ajánlasz.',
    }, // 
  ]);
  console.log('Choices for Shadow City inserted.');

  // 6. Maga a történet definíciója
  await knex('stories').insert([
    {
      id: 2, // Új ID a sztorinak
      title: 'Az Árnyak Városa',
      description: 'Egy rejtélyes eltűnés egy sötét, ködös városban. Egy ősi rituálé, egy sötét szekta, és a barátod, akit meg kell mentened... vagy csatlakozol az árnyakhoz.',
      starting_node_id: 101, // A sztori a 101-es csomóponttal kezdődik
      is_published: true,
    },
  ]);
  console.log('Shadow City story defined.');

  console.log('Seeding for "Az Árnyak Városa" complete!');
};