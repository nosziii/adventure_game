// src/combat.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { CombatService } from './combat.service';
import { CharacterModule } from './character.module'; // Szükség lesz a CharacterService-re
// A GameModule-t itt nem importáljuk közvetlenül, hogy elkerüljük a körkörös függőséget, ha ő is importálná ezt.
// Helyette a GameModule importálja ezt.

@Module({
  imports: [
    CharacterModule, // Hogy a CombatService hozzáférjen a CharacterService-hez
    // DatabaseModule itt nem kell, ha a Knex-et providerként adjuk át,
    // vagy ha a CharacterService-n keresztül éri el (de jobb a direkt injektálás)
  ],
  providers: [CombatService],
  exports: [CombatService], // Exportáljuk, hogy a GameService használhassa
})
export class CombatModule {}
