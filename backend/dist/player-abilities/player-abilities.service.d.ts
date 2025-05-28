import { Knex } from 'knex';
import { CharacterService } from '../character.service';
import { CharacterStoryProgressRecord } from '../game/interfaces/character-story-progres-record.interface';
import { LearnableAbilityDto } from './dto';
export declare class PlayerAbilitiesService {
    private readonly knex;
    private readonly characterService;
    private readonly logger;
    constructor(knex: Knex, characterService: CharacterService);
    getLearnableAbilities(userId: number): Promise<LearnableAbilityDto[]>;
    learnAbility(userId: number, abilityIdToLearn: number): Promise<CharacterStoryProgressRecord>;
}
