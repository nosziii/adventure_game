import { Module } from '@nestjs/common';
import { AdminNodesController } from './nodes/nodes.controller';
import { AdminNodesService } from './nodes/nodes.service';
import { AuthModule } from '../auth/auth.module';

import { CharacterModule } from '../character.module';
import { AdminChoicesController } from './choices/choices.controller';
import { AdminChoicesService } from './choices/choices.service';

import { AdminItemsController } from './items/items.controller';
import { AdminItemsService } from './items/items.service';
import { AdminEnemiesController } from './enemies/enemies.controller';
import { AdminEnemiesService } from './enemies/enemies.service';

@Module({
  // imports: [AuthModule, CharacterModule], csak majd ha szükség lesz a providers-re
  controllers: [
    AdminNodesController,
    AdminChoicesController,
    AdminItemsController,
    AdminEnemiesController,
  ],
  providers: [
    AdminNodesService,
    AdminChoicesService,
    AdminItemsService,
    AdminEnemiesService,
  ],
})
export class AdminModule {}
