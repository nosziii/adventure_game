import { StoryInfoDto } from './story-info.dto'; // A meglévő DTO

export class PlayerStoryListItemDto extends StoryInfoDto {
  // örökli: id, title, description
  lastPlayedAt: Date | null; // Mikor játszott utoljára ezzel a sztorival
  currentNodeIdInStory: number | null; // Hol tart ebben a sztoriban
  isActive: boolean; // Ez az éppen aktív sztorija?
}
