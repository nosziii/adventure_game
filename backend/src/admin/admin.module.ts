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
import { AdminStoriesController } from './stories/stories.controller';
import { AdminStoriesService } from './stories/stories.service';
import { AdminAbilitiesController } from './abilities/abilities.controller';
import { AdminAbilitiesService } from './abilities/abilities.service';
import { AdminArchetypesController } from './archetypes/archetypes.controller';
import { AdminArchetypesService } from './archetypes/archetypes.service';

@Module({
  // imports: [AuthModule, CharacterModule], csak majd ha szükség lesz a providers-re
  controllers: [
    AdminNodesController,
    AdminChoicesController,
    AdminItemsController,
    AdminEnemiesController,
    AdminStoriesController,
    AdminAbilitiesController,
    AdminArchetypesController,
  ],
  providers: [
    AdminNodesService,
    AdminChoicesService,
    AdminItemsService,
    AdminEnemiesService,
    AdminStoriesService,
    AdminAbilitiesService,
    AdminArchetypesService,
  ],
})
export class AdminModule {}
