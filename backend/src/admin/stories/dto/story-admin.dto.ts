export class StoryAdminDto {
  id: number;
  title: string;
  description: string | null;
  startingNodeId: number;
  isPublished: boolean;
  createdAt: Date; // Vagy string, ahogy a többinél konzisztens
  updatedAt: Date; // Vagy string
}
