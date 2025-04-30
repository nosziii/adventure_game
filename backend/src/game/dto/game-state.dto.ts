import { ChoiceDto } from './choice.dto'
import { EnemyDataDto } from './enemy-data.dto'
import { CharacterStatsDto } from './character-stats.dto'
import { InventoryItemDto } from './inventory-item.dto'

interface StoryNodeData {
    id: number
    text: string
    image: string | null
    is_end?: boolean
}


export class GameStateDto {
  node: StoryNodeData | null
  choices: ChoiceDto[]
  character: CharacterStatsDto
  combat: EnemyDataDto | null
  messages?: string[]
  inventory: InventoryItemDto[] | null
}