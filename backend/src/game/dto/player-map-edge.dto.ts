export class PlayerMapEdgeDto {
  from: number | null; // Forrás node ID (null a kezdőpontnál)
  to: number; // Cél node ID
  choiceTextSnippet?: string | null; // A választás rövid szövege
}
