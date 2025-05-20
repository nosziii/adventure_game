// src/combat.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { CombatService } from './combat.service';
import { CharacterModule } from './character.module'; // Szükség lesz a CharacterService-re
// A GameModule-t itt nem importáljuk közvetlenül, hogy elkerüljük a körkörös függőséget, ha ő is importálná ezt.
// Helyette a GameModule importálja ezt.

@Module({
  imports: [
    forwardRef(() => CharacterModule), // Hogy a CombatService hozzáférjen a CharacterService-hez
  ],
  providers: [CombatService],
  exports: [CombatService], // Exportáljuk, hogy a GameService használhassa
})
export class CombatModule {}
