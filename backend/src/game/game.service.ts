// src/game.service.ts - JAVÍTOTT
import {
    Injectable,
    Inject,
    NotFoundException,
    Logger,
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.module'
import { CharacterService, Character } from '../character.service'
// Használjuk az index exportot a DTO-khoz (ha létrehoztad az index.ts-t)
import { GameStateDto, ChoiceDto, EnemyDataDto, CharacterStatsDto, CombatActionDto, InventoryItemDto } from './dto'
// Importáljuk az interfészeket
import { StoryNode } from './interfaces/story-node.interface'
import { ChoiceRecord } from './interfaces/choice-record.interface'
import { EnemyRecord } from './interfaces/enemy-record.interface'

const STARTING_NODE_ID = 1;

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex, // Knex közvetlen injektálása
    private readonly characterService: CharacterService
  ) {}

  // Segédfüggvény a Character -> CharacterStatsDto átalakításhoz
  private mapCharacterToDto(character: Character): CharacterStatsDto {
      return {
          health: character.health,
          skill: character.skill,
          luck: character.luck,
          stamina: character.stamina,
          name: character.name
      };
  }

  // --- getCurrentGameState ---
  async getCurrentGameState(userId: number): Promise<GameStateDto> {
    this.logger.log(`Workspaceing game state for user ID: ${userId}`);
    const character = await this.characterService.findOrCreateByUserId(userId);
    this.logger.debug('Character data fetched/created:', JSON.stringify(character, null, 2))

    // Ellenőrizzük az aktív harcot
    const activeCombat = await this.knex('active_combats')
                                .where({ character_id: character.id })
                                .first()

    let inventory: InventoryItemDto[] | null = null

    this.logger.debug(`Workspaceing inventory for character ID: ${character.id}`)

    if (activeCombat) {
      // --- HARCBAN VAN ---
      this.logger.log(`User ${userId} is in active combat (Combat ID: ${activeCombat.id}, Enemy ID: ${activeCombat.enemy_id})`);
      const enemyBaseData = await this.knex<EnemyRecord>('enemies')
                                     .where({ id: activeCombat.enemy_id })
                                     .first()

      if (!enemyBaseData) {
          this.logger.error(`Enemy data not found for active combat! Enemy ID: ${activeCombat.enemy_id}`);
          await this.knex('active_combats').where({id: activeCombat.id}).del();
          throw new InternalServerErrorException('Combat data corrupted, enemy not found.');
      }

      inventory = await this.characterService.getInventory(character.id)
      this.logger.debug('Inventory data fetched:', JSON.stringify(inventory, null, 2))

      // EnemyDataDto összeállítása
      const enemyData: EnemyDataDto = {
          id: enemyBaseData.id,
          name: enemyBaseData.name,
          health: enemyBaseData.health,
          currentHealth: activeCombat.enemy_current_health,
          skill: enemyBaseData.skill,
      }

      return {
        node: null,
        choices: [],
        character: this.mapCharacterToDto(character), // Használjuk a segédfüggvényt
        combat: enemyData,
        inventory: inventory,
        messages: [] // Üzenetek megőrzése, ha voltak
      }

    } else {
      // --- NINCS HARCBAN ---
      this.logger.log(`User ${userId} is not in combat. Current node: ${character.current_node_id}`);
      let currentNodeId = character.current_node_id ?? STARTING_NODE_ID;
      inventory = await this.characterService.getInventory(character.id)

      if (character.current_node_id !== currentNodeId) {
           this.logger.warn(`Character ${character.id} had null current_node_id, setting to STARTING_NODE_ID ${STARTING_NODE_ID}`);
           // Frissítés és a frissített karakteradatok lekérése
           const updatedCharacter = await this.characterService.updateCharacter(character.id, { current_node_id: currentNodeId });
           // Biztosítjuk, hogy a 'character' változó a legfrissebb adatokat tartalmazza
           Object.assign(character, updatedCharacter); // Frissítjük a meglévő objektumot, vagy használjuk közvetlenül az updatedCharacter-t
      }

      this.logger.debug(`Workspaceing story node with ID: ${currentNodeId}`);
      const currentNode = await this.knex<StoryNode>('story_nodes') // Használjuk a this.knex-et
                                   .where({ id: currentNodeId })
                                   .first();

      if (!currentNode) {
        this.logger.error(`Story node ${currentNodeId} not found!`);
        throw new NotFoundException(`Story node ${currentNodeId} not found.`);
      }
      this.logger.debug(`Found story node: ${currentNode.id}`);

      this.logger.debug(`Workspaceing and evaluating choices for source node ID: ${currentNodeId}`);
      const potentialChoices = await this.knex<ChoiceRecord>('choices')
                                  .where({ source_node_id: currentNodeId });

    // Mivel a checkChoiceAvailability aszinkron lett, Promise.all-t használunk
    const availableChoicesPromises = potentialChoices.map(async (choice) => {
        const isAvailable = await this.checkChoiceAvailability(choice, character); // await itt!
        this.logger.debug(`Choice ${choice.id} (${choice.text}) - Evaluated Availability: ${isAvailable}`);
        return { // Visszaadjuk a teljes ChoiceDto-t
            id: choice.id,
            text: choice.text,
            isAvailable: isAvailable
            
        };
    });

    // Megvárjuk az összes ellenőrzést
    const availableChoices: ChoiceDto[] = await Promise.all(availableChoicesPromises);

    this.logger.debug(`Evaluated ${availableChoices.length} choices.`);

      return{
        node: { id: currentNode.id, text: currentNode.text, image: currentNode.image },
        choices: availableChoices,
        character: this.mapCharacterToDto(character), // Használjuk a segédfüggvényt
        combat: null,
        inventory: inventory,
        messages: [],
      }
    } // if (activeCombat) vége
  } // getCurrentGameState vége


  // --- checkChoiceAvailability JAVÍTVA ---
  private async checkChoiceAvailability(choice: ChoiceRecord, character: Character): Promise<boolean> {

      if (choice.required_item_id !== null && choice.required_item_id !== undefined) {
        this.logger.debug(`Checking required item ID: ${choice.required_item_id}`);
        const hasRequiredItem = await this.characterService.hasItem(character.id, choice.required_item_id);
        if (!hasRequiredItem) {
            this.logger.debug(`Choice ${choice.id} unavailable: Missing required item ${choice.required_item_id}`);
            return false; // Ha hiányzik a tárgy, a választás nem elérhető
        }
        this.logger.debug(`Required item ${choice.required_item_id} found in inventory.`);
      }
    
    // TODO: Implement item_cost_id check

       const reqStatCheck = choice.required_stat_check;
    if (typeof reqStatCheck === 'string') {
        this.logger.debug(`Evaluating stat requirement: "${reqStatCheck}"`);
        const parts = reqStatCheck.match(/(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+)/);
        if (parts) {
            const [, stat, operator, valueStr] = parts;
            const requiredValue = parseInt(valueStr, 10);
            let characterValue: number | null | undefined;

            switch (stat.toLowerCase()) {
                case 'skill': characterValue = character.skill; break;
                case 'health': characterValue = character.health; break;
                case 'luck': characterValue = character.luck; break;
                case 'stamina': characterValue = character.stamina; break;
                default:
                    this.logger.warn(`Unknown stat in requirement: ${stat}`);
                    return false;
            }

            if (characterValue === null || characterValue === undefined) {
                 this.logger.debug(`Stat ${stat} is null/undefined for character ${character.id}`);
                 return false;
            }

            this.logger.debug(`Checking: <span class="math-inline">\{stat\} \(</span>{characterValue}) ${operator} ${requiredValue}`);

            let conditionMet = false;
            switch (operator) {
                case '>=': conditionMet = characterValue >= requiredValue; break;
                case '<=': conditionMet = characterValue <= requiredValue; break;
                case '>':  conditionMet = characterValue > requiredValue; break;
                case '<':  conditionMet = characterValue < requiredValue; break;
                case '==': conditionMet = characterValue == requiredValue; break;
                case '!=': conditionMet = characterValue != requiredValue; break;
                default:
                    this.logger.warn(`Unknown operator in requirement: ${operator}`);
                    return false;
            }
             this.logger.debug(`Requirement ${reqStatCheck} result: ${conditionMet}`);
            if (!conditionMet) {
                return false; // Ha a stat feltétel nem teljesül
            }
        } else {
           this.logger.warn(`Could not parse stat requirement string: ${reqStatCheck}`);
           return false;
        }
    } // Stat check vége
      // Ha nem volt stat feltétel, vagy az teljesült (és más feltétel sem bukott meg):
      return true;
  } // checkChoiceAvailability vége

  // --- makeChoice ---
  async makeChoice(userId: number, choiceId: number): Promise<GameStateDto> {
    this.logger.log(`Processing choice ID: ${choiceId} for user ID: ${userId}`);
    const character = await this.characterService.findOrCreateByUserId(userId);

    // Ellenőrizzük a harcot (változatlan)
    const existingCombat = await this.knex('active_combats').where({ character_id: character.id }).first();
    if (existingCombat) { throw new ForbiddenException('Cannot make choices while in combat.'); }

    const currentNodeId = character.current_node_id;
    if (!currentNodeId) { throw new BadRequestException('Cannot make a choice without being at a node.'); }

    // Lekérdezzük az AKTUÁLIS node-ot is, hogy az effektjeit/jutalmait kezeljük
    const currentNode = await this.knex<StoryNode>('story_nodes').where({ id: currentNodeId }).first();
    if (!currentNode) { throw new NotFoundException(`Current node ${currentNodeId} not found!`); } // Extra ellenőrzés

    // Választás validálása (változatlan)
    const choice = await this.knex<ChoiceRecord>('choices').where({ id: choiceId, source_node_id: currentNodeId }).first();
    if (!choice) { throw new BadRequestException(`Invalid choice ID: ${choiceId}`); }
    if (!await this.checkChoiceAvailability(choice, character)) { // checkAvailability most már async!
        throw new ForbiddenException('You do not meet the requirements for this choice.');
    }

    const targetNodeId = choice.target_node_id;
    this.logger.debug(`Choice ${choiceId} valid. Target node ID: ${targetNodeId}`);

    const targetNode = await this.knex<StoryNode>('story_nodes').where({ id: targetNodeId }).first();
    if (!targetNode) { throw new InternalServerErrorException('Target node missing.'); }

    // --- Effekt/Jutalom Alkalmazása a FORRÁS (currentNode) alapján MIELŐTT lépünk ---
    let healthUpdate = character.health;
    // Health effect (az aktuális node-on, ha van)
    if (currentNode.health_effect !== null && currentNode.health_effect !== undefined) {
      this.logger.log(`Applying health effect ${currentNode.health_effect} from current node ${currentNodeId}`);
      healthUpdate = Math.max(0, character.health + currentNode.health_effect);
    }

    // Item reward (az aktuális node-on, ha van)
    if (currentNode.item_reward_id !== null && currentNode.item_reward_id !== undefined) {
      this.logger.log(`Current node ${currentNodeId} grants item reward ID: ${currentNode.item_reward_id}`);
      try {
        await this.characterService.addItemToInventory(character.id, currentNode.item_reward_id, 1);
        this.logger.log(`Item ${currentNode.item_reward_id} added to inventory.`);
      } catch (itemError) {
        this.logger.error(`Failed to add item reward ${currentNode.item_reward_id}: ${itemError}`);
      }
    }
    // TODO: Item cost levonása (a choice alapján) itt történjen

    // --- Most jön a továbblépés vagy harc indítása ---
    if (targetNode.enemy_id) {
       // HARC KEZDŐDIK (a cél node alapján)
       this.logger.log(`Choice leads to combat! Node ${targetNodeId} has enemy ID: ${targetNode.enemy_id}`);
       // Karakter HP frissítése az esetleges forrás node effekt miatt
       if (healthUpdate !== character.health) {
           await this.characterService.updateCharacter(character.id, { health: healthUpdate })
       }
       // Harc rekord létrehozása (változatlan)
       const enemy = await this.knex<EnemyRecord>('enemies').where({ id: targetNode.enemy_id }).first();
       if (!enemy) { throw new InternalServerErrorException('Enemy data missing for combat.'); }
       await this.knex('active_combats').insert({
           character_id: character.id,         // A karakter ID-ja
           enemy_id: enemy.id,                 // Az ellenfél ID-ja
           enemy_current_health: enemy.health, // Kezdő HP = Max HP az enemies táblából
       });
       // Node ID NEM változik még

    } else {
      // NINCS HARC, TOVÁBBLÉPÉS
      this.logger.log(`Choice leads to non-combat node ${targetNodeId}`);
      // Karakter frissítése: ÚJ node ID ÉS az esetlegesen módosult HP
      await this.characterService.updateCharacter(character.id, {
        current_node_id: targetNodeId,
        health: healthUpdate, // A forrás node effektje már benne van
      });
      // Itt már NEM ellenőrizzük a cél node item rewardját, mert azt a KÖVETKEZŐ lépésnél kell megkapnia.
    }

    // Visszaadjuk az új állapotot
    this.logger.log(`Choice processed for user ${userId}. Fetching new game state.`);
    return this.getCurrentGameState(userId); // Ez lekéri az aktuális állapotot (ami lehet harc vagy az új node)
} // makeChoice vége

  async handleCombatAction(userId: number, actionDto: CombatActionDto): Promise<GameStateDto> {
    this.logger.log(`Handling combat action '${actionDto.action}' for user ID: ${userId}`)

    // 1. Aktív harc és résztvevők adatainak lekérdezése
    const character = await this.characterService.findOrCreateByUserId(userId)
    const activeCombat = await this.knex('active_combats').where({ character_id: character.id }).first()

    // Ellenőrizzük, hogy harcban van-e
    if (!activeCombat) {
        this.logger.warn(`User ${userId} tried combat action but is not in combat.`)
        throw new ForbiddenException('You are not currently in combat.')
    }

    // Ellenőrizzük az ellenfél adatait
    const enemyBaseData = await this.knex<EnemyRecord>('enemies').where({ id: activeCombat.enemy_id }).first()
    if (!enemyBaseData) {
        this.logger.error(`Enemy data not found for active combat! Enemy ID: ${activeCombat.enemy_id}`)
        await this.knex('active_combats').where({ id: activeCombat.id }).del() // Töröljük a rossz rekordot
        throw new InternalServerErrorException('Combat data corrupted, enemy not found.')
    }
    // Innentől az 'enemyBaseData' biztosan nem undefined a TypeScript számára sem a throw miatt

    let enemyCurrentHealth = activeCombat.enemy_current_health
    let playerCurrentHealth = character.health
    const combatLogMessages: string[] = []
    let playerActionSuccessful = false // Jelző, hogy az ellenfélnek támadnia kell-e

    // --- 2. Játékos Akciójának Feldolgozása ---
    if (actionDto.action === 'attack') {
        combatLogMessages.push(`Megtámadod (${enemyBaseData.name})!`)
        const playerDice = Math.floor(Math.random() * 6) + 1
        const enemyDice = Math.floor(Math.random() * 6) + 1
        const playerAttack = (character.skill ?? 0) + playerDice
        const enemyDefense = (enemyBaseData.skill ?? 0) + enemyDice

        if (playerAttack > enemyDefense) {
            const damage = 10 // Egyszerűsített sebzés
            enemyCurrentHealth = Math.max(0, enemyCurrentHealth - damage)
            combatLogMessages.push(`Eltaláltad! Sebzés: ${damage}. Ellenfél HP: ${enemyCurrentHealth}/${enemyBaseData.health}`)
            await this.knex('active_combats').where({ id: activeCombat.id }).update({ enemy_current_health: enemyCurrentHealth, last_action_time: new Date() })
        } else {
            combatLogMessages.push(`Támadásod célt tévesztett!`)
        }
        playerActionSuccessful = true

        // Győzelem ellenőrzése KÖZVETLENÜL a játékos támadása után
        this.logger.debug(`Checking enemy defeat after attack. Current Health: ${enemyCurrentHealth}`)
        if (enemyCurrentHealth <= 0) {
            this.logger.log(`>>> ENEMY DEFEATED BLOCK ENTERED (After Attack) <<< Health: ${enemyCurrentHealth}`)
            combatLogMessages.push(`Legyőzted: ${enemyBaseData.name}! ${enemyBaseData.defeat_text ?? ''}`)
            await this.knex('active_combats').where({ id: activeCombat.id }).del()
            const victoryNodeId = 8 // TODO: Konfigurálhatóvá tenni
            this.logger.log(`Moving character ${character.id} to victory node ${victoryNodeId}`)

            if (enemyBaseData.item_drop_id !== null && enemyBaseData.item_drop_id !== undefined) {
                 combatLogMessages.push(`Az ellenfél eldobott valamit! (Tárgy ID: ${enemyBaseData.item_drop_id})`)
                 try {
                     await this.characterService.addItemToInventory(character.id, enemyBaseData.item_drop_id, 1)
                     this.logger.log(`Item ${enemyBaseData.item_drop_id} added to inventory.`)
                 } catch (itemDropError) { this.logger.error(`Failed to add item drop ${enemyBaseData.item_drop_id}: ${itemDropError}`) }
            }
             await this.characterService.updateCharacter(character.id, { current_node_id: victoryNodeId })
            const finalState = await this.getCurrentGameState(userId)
            finalState.messages = combatLogMessages
            this.logger.log('>>> RETURNING FINAL STATE FROM VICTORY BLOCK (After Attack) <<<')
            return finalState // Kilépés a függvényből győzelem esetén
        }

    } else if (actionDto.action === 'use_item') {
        const itemIdToUse = actionDto.itemId
        if (!itemIdToUse) { throw new BadRequestException('No itemId provided for use_item action.') }
        combatLogMessages.push(`Megpróbálsz használni egy tárgyat (ID: ${itemIdToUse}).`)

        const hasItem = await this.characterService.hasItem(character.id, itemIdToUse)
        if (!hasItem) {
            combatLogMessages.push(`Nincs ilyen tárgyad!`)
            playerActionSuccessful = true // Sikertelen próbálkozás is egy akció lehet
        } else {
            const item = await this.knex('items').where({ id: itemIdToUse }).first()
            if (!item) { throw new InternalServerErrorException('Item data inconsistency.') }

            if (!item.usable) {
                combatLogMessages.push(`Ez a tárgy (${item.name}) nem használható így.`)
                 playerActionSuccessful = true // Sikertelen próbálkozás
            } else if (item.effect && item.effect.startsWith('heal+')) {
                const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10)
                if (healAmount > 0) {
                    const maxHp = 100 // TODO: Használj valós max HP-t
                    const previousPlayerHealth = playerCurrentHealth
                    playerCurrentHealth = Math.min(maxHp, playerCurrentHealth + healAmount)
                    const healedAmount = playerCurrentHealth - previousPlayerHealth

                    if (healedAmount > 0) {
                        combatLogMessages.push(`Gyógyító italt használtál (${item.name}). Visszatöltöttél ${healedAmount} életerőt! HP: ${playerCurrentHealth}`)
                        const updatedCharacterData = await this.characterService.updateCharacter(character.id, { health: playerCurrentHealth })
                        playerCurrentHealth = updatedCharacterData.health // Helyi változó frissítése
                        const removed = await this.characterService.removeItemFromInventory(character.id, itemIdToUse, 1)
                        if (!removed) { this.logger.error(`Failed to remove item ${itemIdToUse} after use`) }
                        playerActionSuccessful = true // Sikeres használat
                    } else {
                        combatLogMessages.push(`Már így is maximum életerőn vagy.`)
                        playerActionSuccessful = true // Próbálkozás volt, az ellenfél jön
                    }
                } else {
                     combatLogMessages.push(`Ez a tárgy (${item.name}) nem gyógyít.`)
                     playerActionSuccessful = true // Próbálkozás volt
                }
            } else {
                combatLogMessages.push(`Ezt a tárgyat (${item.name}) most nem tudod használni.`)
                 playerActionSuccessful = true // Próbálkozás volt
            }
        }
    } else {
        this.logger.error(`Unknown combat action received: ${actionDto.action}`)
        throw new BadRequestException('Invalid combat action.')
    }

    // --- 4. Ellenfél Támadása (Csak ha még él ÉS a játékos csinált valamit) ---
    if (enemyCurrentHealth > 0 && playerActionSuccessful) {
        combatLogMessages.push(`${enemyBaseData.name} rád támad (${enemyBaseData.attack_description ?? ''})!`)
        const playerDiceDef = Math.floor(Math.random() * 6) + 1
        const enemyDiceAtk = Math.floor(Math.random() * 6) + 1
        const enemyAttack = (enemyBaseData.skill ?? 0) + enemyDiceAtk
        const playerDefense = (character.skill ?? 0) + playerDiceDef

        if (enemyAttack > playerDefense) {
            const enemyDamage = 5
            playerCurrentHealth = Math.max(0, playerCurrentHealth - enemyDamage)
            combatLogMessages.push(`Eltalált! Sebzés: ${enemyDamage}. Életerőd: ${playerCurrentHealth}`)
            await this.characterService.updateCharacter(character.id, { health: playerCurrentHealth })
        } else {
            combatLogMessages.push(`Sikeresen kivédted a támadást!`)
        }

        // --- 5. Ellenőrizzük a Játékost az ellenfél támadása UTÁN ---
        if (playerCurrentHealth <= 0) {
           combatLogMessages.push(`Leestél a lábadról... Vége a kalandnak.`)
           this.logger.log(`Character ${character.id} defeated by enemy ${enemyBaseData.id}.`)
           await this.knex('active_combats').where({ id: activeCombat.id }).del()
           const defeatNodeId = 3 // TODO: Konfigurálhatóvá tenni
           await this.characterService.updateCharacter(character.id, { current_node_id: defeatNodeId, health: 0 })
           const finalState = await this.getCurrentGameState(userId)
           finalState.messages = combatLogMessages
           return finalState // Kilépés a függvényből vereség esetén
        }
    } // Ellenfél támadásának vége

    // --- 6. Ha a harc folytatódik ---
    // (Ide csak akkor jutunk, ha sem a játékos, sem az ellenfél nem halt meg ebben a körben)
    this.logger.log(`Combat continues for user ${userId}. Round finished.`)
    // Újra lekérdezzük a frissített karakter adatokat a válaszhoz
    const updatedCharacter = await this.characterService.findById(character.id)
    if (!updatedCharacter) throw new InternalServerErrorException('Character vanished after combat round!')
    const currentInventory = await this.characterService.getInventory(updatedCharacter.id)
    const currentCombatState: EnemyDataDto = {
        id: enemyBaseData.id,
        name: enemyBaseData.name,
        health: enemyBaseData.health, // Max HP
        currentHealth: enemyCurrentHealth, // Frissített aktuális HP
        skill: enemyBaseData.skill
    }
    const resultState: GameStateDto = {
        node: null,
        choices: [],
        character: this.mapCharacterToDto(updatedCharacter),
        combat: currentCombatState,
        inventory: currentInventory,
        messages: combatLogMessages,
    }
    return resultState

} // handleCombatAction vége

} // GameService vége