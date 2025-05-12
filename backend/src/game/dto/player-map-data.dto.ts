import { PlayerMapNodeDto } from './player-map-node.dto';
import { PlayerMapEdgeDto } from './player-map-edge.dto';

export class PlayerMapDataDto {
  nodes: PlayerMapNodeDto[];
  edges: PlayerMapEdgeDto[];
}
