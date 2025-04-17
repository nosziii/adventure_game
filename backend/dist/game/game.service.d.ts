import { Knex } from 'knex';
import { GameStateDto } from './dto/game-state.dto';
import { CharacterService } from '../character.service';
export declare class GameService {
    private readonly knex;
    private readonly characterService;
    private readonly logger;
    constructor(knex: Knex, characterService: CharacterService);
    getCurrentGameState(userId: number): Promise<GameStateDto>;
    private checkChoiceAvailability;
    makeChoice(userId: number, choiceId: number): Promise<GameStateDto>;
}
