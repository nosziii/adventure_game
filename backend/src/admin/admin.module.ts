import { Module } from '@nestjs/common';
import { AdminNodesController } from './nodes/nodes.controller';
import { AdminNodesService } from './nodes/nodes.service';
import { AuthModule } from '../auth/auth.module'

import { CharacterModule } from '../character.module'

@Module({
  // imports: [AuthModule, CharacterModule], csak majd ha szükség lesz a providers-re
  controllers: [AdminNodesController],
  providers: [AdminNodesService]
})
export class AdminModule {}
