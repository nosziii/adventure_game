import { ChoiceDto } from './choice.dto'
import { EnemyDataDto } from './enemy-data.dto'
import { CharacterStatsDto } from './character-stats.dto'

interface StoryNodeData {
    id: number
    text: string
    image: string | null
}

export class GameStateDto {
  node: StoryNodeData
  choices: ChoiceDto[]
  character: CharacterStatsDto
  combat: EnemyDataDto | null
}