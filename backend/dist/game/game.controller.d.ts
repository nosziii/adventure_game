import { GameService } from './game.service';
import { GameStateDto } from './dto/game-state.dto';
import { MakeChoiceDto } from './dto/make-choice.dto';
export declare class GameController {
    private readonly gameService;
    private readonly logger;
    constructor(gameService: GameService);
    getGameState(req: any): Promise<GameStateDto>;
    makeChoice(req: any, makeChoiceDto: MakeChoiceDto): Promise<GameStateDto>;
}
