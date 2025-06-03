// src/player-abilities.service.ts
import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  forwardRef,
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.module';
import { CharacterService } from '../character.service'; // CharacterStoryProgressRecord is kell
import { CharacterStoryProgressRecord } from '../game/interfaces/character-story-progres-record.interface';
import { AbilityRecord } from '../game/interfaces/ability-record.interface';
import { CharacterArchetypeRecord } from '../game/interfaces/character-archetype-record.interface';
import { LearnableAbilityDto } from './dto';

@Injectable()
export class PlayerAbilitiesService {
  private readonly logger = new Logger(PlayerAbilitiesService.name);

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    // CharacterService-re szükségünk lesz az aktív progresszió és a karakter adatainak lekéréséhez
    @Inject(forwardRef(() => CharacterService)) // forwardRef, ha körkörös függőség lenne
    private readonly characterService: CharacterService,
  ) {}

  async getLearnableAbilities(userId: number): Promise<LearnableAbilityDto[]> {
    const baseCharacter =
      await this.characterService.findOrCreateByUserId(userId);
    const activeProgress = await this.characterService.getActiveStoryProgress(
      baseCharacter.id,
    );

    if (!activeProgress) {
      this.logger.warn(
        `No active story progress for character ${baseCharacter.id} to list learnable abilities.`,
      );
      return [];
    }

    // Összes képesség lekérése az adatbázisból
    const allAbilitiesFromDb =
      await this.knex<AbilityRecord>('abilities').select('*');

    const learnedAbilitiesResult = await this.knex('character_story_abilities')
      .where({ character_story_progress_id: activeProgress.id })
      .select('ability_id');
    const learnedAbilityIds = new Set(
      learnedAbilitiesResult.map((la) => la.ability_id),
    );

    const learnableDtos: LearnableAbilityDto[] = [];

    for (const ability of allAbilitiesFromDb) {
      let canLearnThisAbility = true;
      let reason = '';
      const isLearned = learnedAbilityIds.has(ability.id);

      if (isLearned) {
        canLearnThisAbility = false;
        reason = 'Már megtanultad.';
      } else {
        // 1. Archetípus korlátozás ellenőrzése (az abilities.allowed_archetype_ids alapján)
        if (
          ability.allowed_archetype_ids &&
          Array.isArray(ability.allowed_archetype_ids) &&
          ability.allowed_archetype_ids.length > 0
        ) {
          if (
            !baseCharacter.selected_archetype_id ||
            !ability.allowed_archetype_ids.includes(
              baseCharacter.selected_archetype_id,
            )
          ) {
            canLearnThisAbility = false;
            reason += `Ezt a képességet a te archetípusod (${baseCharacter.selected_archetype_id ? 'ID: ' + baseCharacter.selected_archetype_id : 'Nincs'}) nem tanulhatja meg. `;
          }
        }
        // Ha egy képességnek van allowed_archetype_ids listája, de a karakternek nincs archetípusa, akkor nem tanulhatja.
        // (Ez a fenti if már lefedi, ha a selected_archetype_id null)

        // 2. Szint követelmény (ha még tanulható)
        if (
          canLearnThisAbility &&
          activeProgress.level < (ability.level_requirement ?? 1)
        ) {
          canLearnThisAbility = false;
          reason += `Szint követelmény: ${ability.level_requirement} (Jelenlegi: ${activeProgress.level}). `;
        }
        // 3. Tehetségpont (ha még tanulható)
        if (
          canLearnThisAbility &&
          (activeProgress.talent_points_available ?? 0) <
            (ability.talent_point_cost ?? 1)
        ) {
          canLearnThisAbility = false;
          reason += `Nincs elég tehetségpontod (Szükséges: ${ability.talent_point_cost}, Van: ${activeProgress.talent_points_available ?? 0}). `;
        }
        // 4. Előfeltételek (ha még tanulható)
        if (
          canLearnThisAbility &&
          ability.prerequisites &&
          Array.isArray(ability.prerequisites) &&
          ability.prerequisites.length > 0
        ) {
          const missingPrereqs = ability.prerequisites.filter(
            (prereqId) => !learnedAbilityIds.has(prereqId as number),
          );
          if (missingPrereqs.length > 0) {
            canLearnThisAbility = false;
            const prereqAbilities = await this.knex<AbilityRecord>('abilities')
              .whereIn('id', missingPrereqs)
              .select('name');
            reason += `Hiányzó előfeltétel(ek): ${prereqAbilities.map((p) => p.name).join(', ')}. `;
          }
        }
      }

      learnableDtos.push({
        id: ability.id,
        name: ability.name,
        description: ability.description,
        type: ability.type,
        effectString: ability.effect_string,
        talentPointCost: ability.talent_point_cost,
        levelRequirement: ability.level_requirement,
        prerequisites: ability.prerequisites,
        canLearn: canLearnThisAbility && !isLearned, // A canLearn már tartalmazza a legtöbb logikát
        reasonCantLearn: reason.trim() || undefined,
        isAlreadyLearned: isLearned,
      });
    }
    return learnableDtos.sort(
      (a, b) =>
        a.levelRequirement - b.levelRequirement || a.name.localeCompare(b.name),
    );
  }

  async learnAbility(
    userId: number,
    abilityIdToLearn: number,
  ): Promise<CharacterStoryProgressRecord> {
    const baseCharacter =
      await this.characterService.findOrCreateByUserId(userId);
    const activeProgress = await this.characterService.getActiveStoryProgress(
      baseCharacter.id,
    );

    if (!activeProgress)
      throw new NotFoundException('No active story progress to learn ability.');

    const abilityToLearn = await this.knex<AbilityRecord>('abilities')
      .where({ id: abilityIdToLearn })
      .first();
    if (!abilityToLearn)
      throw new NotFoundException(
        `Ability with ID ${abilityIdToLearn} not found.`,
      );

    this.logger.debug(
      `User ${userId} (ProgressID: ${activeProgress.id}) attempting to learn AbilityID: ${abilityIdToLearn} ("${abilityToLearn.name}")`,
    );

    // Archetípus korlátozás ellenőrzése (az abilities.allowed_archetype_ids alapján)
    if (
      abilityToLearn.allowed_archetype_ids &&
      Array.isArray(abilityToLearn.allowed_archetype_ids) &&
      abilityToLearn.allowed_archetype_ids.length > 0
    ) {
      if (
        !baseCharacter.selected_archetype_id ||
        !abilityToLearn.allowed_archetype_ids.includes(
          baseCharacter.selected_archetype_id,
        )
      ) {
        const archetype = baseCharacter.selected_archetype_id
          ? await this.knex<CharacterArchetypeRecord>('character_archetypes')
              .where({ id: baseCharacter.selected_archetype_id })
              .first()
          : null;
        throw new ForbiddenException(
          `A karaktered archetípusa (${archetype?.name || 'Nincs'}) nem tanulhatja meg ezt a képességet: ${abilityToLearn.name}. Engedélyezett: ${abilityToLearn.allowed_archetype_ids.join(',')}`,
        );
      }
    }

    // Archetípus korlátozás ellenőrzése
    // TODO: ez valoszinu duplikacio elenorizni a fenti validacioval

    // if (activeProgress.selected_archetype_id) {
    //   const archetype = await this.knex<CharacterArchetypeRecord>(
    //     'character_archetypes',
    //   )
    //     .where({ id: activeProgress.selected_archetype_id })
    //     .select('name', 'learnable_ability_ids')
    //     .first();
    //   if (
    //     archetype &&
    //     archetype.learnable_ability_ids &&
    //     !archetype.learnable_ability_ids.includes(abilityIdToLearn)
    //   ) {
    //     throw new ForbiddenException(
    //       `A karaktered archetípusa (${archetype.name}) nem tanulhatja meg ezt a képességet: ${abilityToLearn.name}.`,
    //     );
    //   }
    // }

    const alreadyLearned = await this.knex('character_story_abilities')
      .where({
        character_story_progress_id: activeProgress.id,
        ability_id: abilityIdToLearn,
      })
      .first();
    if (alreadyLearned)
      throw new BadRequestException('Ezt a képességet már megtanultad.');

    if (activeProgress.level < abilityToLearn.level_requirement) {
      throw new BadRequestException(
        `Nem érted el a szükséges szintet (${abilityToLearn.level_requirement}).`,
      );
    }
    if (
      (activeProgress.talent_points_available ?? 0) <
      abilityToLearn.talent_point_cost
    ) {
      throw new BadRequestException('Nincs elég tehetségpontod.');
    }

    if (
      abilityToLearn.prerequisites &&
      abilityToLearn.prerequisites.length > 0
    ) {
      const learnedAbilities = await this.knex('character_story_abilities')
        .where({ character_story_progress_id: activeProgress.id })
        .pluck('ability_id');
      const missingPrereqs = abilityToLearn.prerequisites.filter(
        (prereqId) => !learnedAbilities.includes(prereqId),
      );
      if (missingPrereqs.length > 0) {
        const prereqNames = (
          await this.knex<AbilityRecord>('abilities')
            .whereIn('id', missingPrereqs)
            .select('name')
        ).map((p) => p.name);
        throw new BadRequestException(
          `Hiányzó előfeltétel(ek) a(z) "${abilityToLearn.name}" képességhez: ${prereqNames.join(', ')}.`,
        );
      }
    }

    const newTalentPoints =
      (activeProgress.talent_points_available ?? 0) -
      abilityToLearn.talent_point_cost;

    await this.knex.transaction(async (trx) => {
      await trx('character_story_abilities').insert({
        character_story_progress_id: activeProgress.id,
        ability_id: abilityIdToLearn,
      });
      // Itt a CharacterService.updateStoryProgress-t hívjuk, hogy a DB update egy helyen legyen
      await this.characterService.updateStoryProgress(
        activeProgress.id,
        { talent_points_available: newTalentPoints },
        trx,
      ); // Átadjuk a tranzakciót
    });

    this.logger.log(
      `Character progress ${activeProgress.id} learned ability ${abilityIdToLearn} (${abilityToLearn.name}).`,
    );

    const updatedProgress = await this.characterService.getActiveStoryProgress(
      baseCharacter.id,
    );
    if (!updatedProgress)
      throw new InternalServerErrorException(
        'Failed to fetch progress after learning ability.',
      );
    return updatedProgress;
  }
}
