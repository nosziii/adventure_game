import { NodeDto } from '../../nodes/dto/node.dto';
import { ChoiceAdminDto } from '../../choices/dto/choice-admin.dto';

export class StoryGraphDto {
  nodes: NodeDto[];
  choices: ChoiceAdminDto[];
}
