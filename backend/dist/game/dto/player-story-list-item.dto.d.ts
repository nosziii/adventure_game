import { StoryInfoDto } from './story-info.dto';
export declare class PlayerStoryListItemDto extends StoryInfoDto {
    lastPlayedAt: Date | null;
    currentNodeIdInStory: number | null;
    isActive: boolean;
}
