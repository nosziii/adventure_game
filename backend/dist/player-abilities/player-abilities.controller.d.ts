import { PlayerAbilitiesService } from './player-abilities.service';
import { LearnableAbilityDto, LearnAbilityRequestDto } from './dto';
import { GameService } from '../game/game.service';
import { GameStateDto } from '../game/dto/game-state.dto';
export declare class PlayerAbilitiesController {
    private readonly playerAbilitiesService;
    private readonly gameService;
    private readonly logger;
    constructor(playerAbilitiesService: PlayerAbilitiesService, gameService: GameService);
    listLearnableAbilities(req: any): Promise<LearnableAbilityDto[]>;
    learnNewAbility(req: any, learnAbilityDto: LearnAbilityRequestDto): Promise<GameStateDto>;
}
