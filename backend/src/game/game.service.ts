// src/game.service.ts
import { 
    Injectable, 
    Inject, 
    NotFoundException, 
    Logger, 
    BadRequestException, 
    ForbiddenException, 
    InternalServerErrorException 
} from '@nestjs/common'
import { Knex } from 'knex'
import { KNEX_CONNECTION } from '../database/database.module'
import { GameStateDto } from './dto/game-state.dto'
import { ChoiceDto } from './dto/choice.dto'
import { EnemyDataDto } from './dto/enemy-data.dto'
import {CharacterStatsDto} from './dto/character-stats.dto'
import { CharacterService, Character } from '../character.service'
import { StoryNode } from './interfaces/story-node.interface'
import { ChoiceRecord } from './interfaces/choice-record.interface'


const STARTING_NODE_ID = 1

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name)

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly characterService: CharacterService    
) {}


async getCurrentGameState(userId: number): Promise<GameStateDto> {

    interface EnemyRecord {
        id: number; name: string; health: number; skill: number
    }

    this.logger.log(`Workspaceing game state for user ID: ${userId}`)

    // 1. Karakter keresése vagy létrehozása a CharacterService segítségével
    let character = await this.characterService.findByUserId(userId)

    if (!character) {
      character = await this.characterService.createCharacter(userId)
    }

    let currentNodeId = character.current_node_id ?? STARTING_NODE_ID
     // Ha a node ID megváltozott (pl. null volt), frissítsük a DB-ben is
     if (character.current_node_id !== currentNodeId) {
         this.logger.warn(`Character ${character.id} had null current_node_id, setting to STARTING_NODE_ID ${STARTING_NODE_ID}`)
         character = await this.characterService.updateCharacter(character.id, { current_node_id: currentNodeId })
     }

    // 2. Aktuális StoryNode lekérdezése (ehhez kell a knex itt is, vagy egy NodeService)
    // Jobb lenne egy NodeService, de most maradjunk a knexnél itt:
    this.logger.debug(`Workspaceing story node with ID: ${currentNodeId}`);
    const currentNode = await this.knex<StoryNode>('story_nodes')
                                 .where({ id: currentNodeId })
                                 .first()

    if (!currentNode) {
      this.logger.error(`Story node with ID ${currentNodeId} not found for character ${character.id}!`);
      throw new NotFoundException(`Story node ${currentNodeId} not found.`);
    }
    this.logger.debug(`Found story node: ${currentNode.id}`);

    // 3. Választási lehetőségek lekérdezése ÉS feltételek ellenőrzése
    this.logger.debug(`Workspaceing and evaluating choices for source node ID: ${currentNodeId}`);
    const potentialChoices = await this.knex<ChoiceRecord>('choices')
                                  .where({ source_node_id: currentNodeId });

    const availableChoices: ChoiceDto[] = [];
    for (const choice of potentialChoices) {
        const isAvailable = this.checkChoiceAvailability(choice, character); // Segédfüggvény az ellenőrzéshez
         this.logger.debug(`Choice <span class="math-inline">\{choice\.id\} \(</span>{choice.text}) - Available: ${isAvailable}`);
        availableChoices.push({
            id: choice.id,
            text: choice.text,
            isAvailable: isAvailable // Adjuk hozzá az elérhetőséget a DTO-hoz
        })
    }
    this.logger.debug(`Evaluated ${availableChoices.length} choices.`);

     // 4. Harc információ hozzáadása, ha van ellenfél
     let enemyData: EnemyDataDto | null = null; // <-- Használjuk a DTO típust
     if (currentNode.enemy_id) {
         const enemy = await this.knex<EnemyRecord>('enemies').where({ id: currentNode.enemy_id }).first()
         if(enemy) {
            // Hozzunk létre egy EnemyDataDto példányt
            enemyData = {
                 name: enemy.name,
                 health: enemy.health,
                 skill: enemy.skill
            };
         } else {
             this.logger.error(`Enemy with ID ${currentNode.enemy_id} not found!`)
         }
     }

       // 5. Válasz összeállítása DTO formátumban
    const gameState: GameStateDto = {
        node: {
          id: currentNode.id,
          text: currentNode.text,
          image: currentNode.image,
        },
        // Csak az elérhető választásokat küldjük? Vagy mindet, és a frontend tiltja le? Küldjük mindet isAvailable-lel.
        choices: availableChoices,
        character: { // Karakter statisztikák hozzáadása
          health: character.health,
          skill: character.skill,
          luck: character.luck,
          stamina: character.stamina,
          name: character.name
        },
        combat: enemyData // Harc adatok hozzáadása (null, ha nincs harc)
      };
  
      return gameState;
    } // getCurrentGameState vége

     // Segédfüggvény a választás feltételeinek ellenőrzésére
  private checkChoiceAvailability(choice: ChoiceRecord, character: Character): boolean {
    // TODO: required_item_id ellenőrzése (CharacterService.hasItem(character.id, choice.required_item_id))
    // TODO: item_cost_id ellenőrzése (hasonlóan)

    const reqStatCheck = choice.required_stat_check; // Mentsük külön változóba
    if (typeof reqStatCheck === 'string') { // Explicit típusellenőrzés
        const parts = reqStatCheck.match(/(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+)/);
        if (parts) {
           // ... a többi logika változatlan ...
        } else {
           this.logger.warn(`Could not parse stat requirement: ${reqStatCheck}`);
           return false;
        }
        // Ha reqStatCheck null vagy undefined volt, vagy a fenti string logika lefutott és nem adott vissza false-t
    return true
    }
    

    if (choice.required_stat_check) {
        // Egyszerű "stat >= érték" ellenőrzés (később bővíthető)
        const parts = choice.required_stat_check.match(/(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+)/);
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
                    return false; // Ismeretlen stat esetén nem elérhető
            }

             if (characterValue === null || characterValue === undefined) return false; // Ha nincs ilyen statja a karakternek

            this.logger.debug(`Checking stat requirement: <span class="math-inline">\{stat\} \(</span>{characterValue}) ${operator} ${requiredValue}`);

            switch (operator) {
                case '>=': if (!(characterValue >= requiredValue)) return false; break;
                case '<=': if (!(characterValue <= requiredValue)) return false; break;
                case '>':  if (!(characterValue > requiredValue)) return false; break;
                case '<':  if (!(characterValue < requiredValue)) return false; break;
                case '==': if (!(characterValue == requiredValue)) return false; break; // dupla == lehet jobb itt? Vagy parseInt?
                case '!=': if (!(characterValue != requiredValue)) return false; break;
                default: return false; // Ismeretlen operátor
            }
        } else {
           this.logger.warn(`Could not parse stat requirement: ${choice.required_stat_check}`);
           return false; // Ha nem tudjuk értelmezni, nem elérhető
        }
    }

    // Ha minden feltétel teljesült (vagy nem volt feltétel)
    return true;
}

async makeChoice(userId: number, choiceId: number): Promise<GameStateDto> {
    this.logger.log(`Processing choice ID: ${choiceId} for user ID: ${userId}`);

    // 1. Karakter lekérdezése a CharacterService-ből
    const character = await this.characterService.findByUserId(userId);
    if (!character) { throw new NotFoundException('Character not found.'); }
    const currentNodeId = character.current_node_id;
    if (!currentNodeId) { throw new BadRequestException('Cannot make a choice without being at a node.'); }

    // 2. Választás validálása (adatbázisból)
    
     const choice = await this.knex<ChoiceRecord>('choices')
                          .where({ id: choiceId, source_node_id: currentNodeId })
                          .first()
     if (!choice) { throw new BadRequestException(`Invalid choice ID: ${choiceId}`); }

     // --- ÚJ: Választási feltételek ÚJRAELLENŐRZÉSE ---
     if (!this.checkChoiceAvailability(choice, character)) {
         this.logger.warn(`Choice requirement not met for choice ${choiceId} by user ${userId}.`);
         throw new ForbiddenException('You do not meet the requirements for this choice.');
     }
     // -------------------------------------------

    const targetNodeId = choice.target_node_id;
    this.logger.debug(`Choice ${choiceId} is valid and requirements met. Target node ID: ${targetNodeId}`);

     // 3. Effektek lekérdezése és alkalmazása
     let newHealth = character.health;
     let newSkill = character.skill;
     let newLuck = character.luck ?? undefined; // Kezeljük a null értéket
     let newStamina = character.stamina ?? undefined;
     let itemsToAdd: number[] = [];
     // TODO: Item cost levonása

     const targetNode = await this.knex<StoryNode>('story_nodes')
                              .where({ id: targetNodeId })
                              .first();

     if (!targetNode) {
         this.logger.error(`Target node ${targetNodeId} not found!`);
         throw new InternalServerErrorException('Target node missing.');
     }

     // Health effect
     if (targetNode.health_effect !== null && targetNode.health_effect !== undefined) {
         this.logger.log(`Applying health effect ${targetNode.health_effect} from node ${targetNodeId}`);
         newHealth = Math.max(0, newHealth + targetNode.health_effect);
         this.logger.log(`Character new health calculated: ${newHealth}`);
     }

      // Item reward
     if (targetNode.item_reward_id !== null && targetNode.item_reward_id !== undefined) {
        this.logger.log(`Applying item reward ID ${targetNode.item_reward_id} from node ${targetNodeId}`);
        // TODO: Hívd meg a CharacterService.addItemToInventory(character.id, targetNode.item_reward_id, 1);
        // Ehhez implementálni kell az addItemToInventory-t!
        // Most csak logoljuk:
         this.logger.warn(`Inventory system not implemented. Would add item: ${targetNode.item_reward_id}`);
        // itemsToAdd.push(targetNode.item_reward_id); // Esetleg gyűjtsük össze
     }

    // TODO: Egyéb effektek (pl. stat effect a node-on, choice-on)

     // 4. Karakter állapotának frissítése (új node ID és módosult statok)
     const updates: Partial<Character> = {
         current_node_id: targetNodeId,
         health: newHealth, // Frissített health
         // skill: newSkill, // Ha változna
         // luck: newLuck,
         // stamina: newStamina,
     };
     this.logger.debug(`Updating character ${character.id} with data: ${JSON.stringify(updates)}`);
     await this.characterService.updateCharacter(character.id, updates);

     // TODO: Ha itemeket adtunk hozzá, azokat is mentsük el
     // await this.characterService.addItemsToInventory(character.id, itemsToAdd);


    // 5. Új játékállapot visszaadása
    this.logger.log(`Choice processed successfully for user ${userId}. Fetching new game state.`);
    return this.getCurrentGameState(userId);
} // makeChoice vége

// ... (Knex elérés a CharacterService-en keresztül, ha szükséges)
// Erre valószínűleg jobb megoldás lenne a Knex közvetlen injektálása ide is,
// Vagy dedikált Service-ek létrehozása (NodeService, ChoiceService)
}