export class ChoiceAdminDto {
    id: number;
    sourceNodeId: number;
    targetNodeId: number;
    text: string;
    requiredItemId: number | null;
    itemCostId: number | null;
    requiredStatCheck: string | null;
    // visible_only_if: string | null; // Ezt is hozzáadhatjuk, ha kell
    createdAt: Date; // Vagy string, ahogy a NodeDto-nál
    updatedAt: Date; // Vagy string
}