"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PlayerAbilitiesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerAbilitiesService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("../database/database.module");
const character_service_1 = require("../character.service");
let PlayerAbilitiesService = PlayerAbilitiesService_1 = class PlayerAbilitiesService {
    knex;
    characterService;
    logger = new common_1.Logger(PlayerAbilitiesService_1.name);
    constructor(knex, characterService) {
        this.knex = knex;
        this.characterService = characterService;
    }
    async getLearnableAbilities(userId) {
        const baseCharacter = await this.characterService.findOrCreateByUserId(userId);
        const activeProgress = await this.characterService.getActiveStoryProgress(baseCharacter.id);
        if (!activeProgress) {
            this.logger.warn(`No active story progress for character ${baseCharacter.id} to list learnable abilities.`);
            return [];
        }
        const archetype = activeProgress.selected_archetype_id
            ? await this.knex('character_archetypes')
                .where({ id: activeProgress.selected_archetype_id })
                .first()
            : null;
        let archetypeLearnableAbilityIds = archetype?.learnable_ability_ids || null;
        if (baseCharacter.selected_archetype_id) {
            const archetype = await this.knex('character_archetypes')
                .where({ id: baseCharacter.selected_archetype_id })
                .first();
            if (archetype) {
                archetypeLearnableAbilityIds = archetype.learnable_ability_ids;
            }
        }
        let abilitiesQuery = this.knex('abilities').select('*');
        if (archetypeLearnableAbilityIds) {
            if (archetypeLearnableAbilityIds.length === 0) {
                this.logger.debug(`Archetype for progress ${activeProgress.id} has an empty learnable_ability_ids list.`);
                return [];
            }
            abilitiesQuery = abilitiesQuery.whereIn('id', archetypeLearnableAbilityIds);
        }
        const allPotentiallyLearnableAbilities = await abilitiesQuery;
        const learnedAbilitiesResult = await this.knex('character_story_abilities')
            .where({ character_story_progress_id: activeProgress.id })
            .select('ability_id');
        const learnedAbilityIds = new Set(learnedAbilitiesResult.map((la) => la.ability_id));
        const learnableDtos = [];
        for (const ability of allPotentiallyLearnableAbilities) {
            let canLearnThisAbility = true;
            let reason = '';
            const isLearned = learnedAbilityIds.has(ability.id);
            if (isLearned) {
                canLearnThisAbility = false;
                reason = 'Már megtanultad.';
            }
            else {
                if (activeProgress.level < ability.level_requirement) {
                    canLearnThisAbility = false;
                    reason += `Szint követelmény: ${ability.level_requirement} (Jelenlegi: ${activeProgress.level}). `;
                }
                if ((activeProgress.talent_points_available ?? 0) <
                    ability.talent_point_cost) {
                    canLearnThisAbility = false;
                    reason += `Nincs elég tehetségpontod. (Szükséges: ${ability.talent_point_cost}, Rendelkezésre áll: ${activeProgress.talent_points_available ?? 0}). `;
                }
                if (ability.prerequisites && ability.prerequisites.length > 0) {
                    const missingPrereqs = ability.prerequisites.filter((prereqId) => !learnedAbilityIds.has(prereqId));
                    if (missingPrereqs.length > 0) {
                        canLearnThisAbility = false;
                        const prereqAbilities = await this.knex('abilities')
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
                canLearn: canLearnThisAbility && !isLearned,
                reasonCantLearn: reason.trim() || undefined,
                isAlreadyLearned: isLearned,
            });
        }
        return learnableDtos.sort((a, b) => a.levelRequirement - b.levelRequirement || a.name.localeCompare(b.name));
    }
    async learnAbility(userId, abilityIdToLearn) {
        const baseCharacter = await this.characterService.findOrCreateByUserId(userId);
        const activeProgress = await this.characterService.getActiveStoryProgress(baseCharacter.id);
        if (!activeProgress)
            throw new common_1.NotFoundException('No active story progress to learn ability.');
        const abilityToLearn = await this.knex('abilities')
            .where({ id: abilityIdToLearn })
            .first();
        if (!abilityToLearn)
            throw new common_1.NotFoundException(`Ability with ID ${abilityIdToLearn} not found.`);
        this.logger.debug(`User ${userId} (ProgressID: ${activeProgress.id}) attempting to learn AbilityID: ${abilityIdToLearn} ("${abilityToLearn.name}")`);
        if (abilityToLearn.allowed_archetype_ids &&
            Array.isArray(abilityToLearn.allowed_archetype_ids) &&
            abilityToLearn.allowed_archetype_ids.length > 0) {
            if (!baseCharacter.selected_archetype_id ||
                !abilityToLearn.allowed_archetype_ids.includes(baseCharacter.selected_archetype_id)) {
                const archetype = baseCharacter.selected_archetype_id
                    ? await this.knex('character_archetypes')
                        .where({ id: baseCharacter.selected_archetype_id })
                        .first()
                    : null;
                throw new common_1.ForbiddenException(`A karaktered archetípusa (${archetype?.name || 'Nincs'}) nem tanulhatja meg ezt a képességet: ${abilityToLearn.name}. Engedélyezett: ${abilityToLearn.allowed_archetype_ids.join(',')}`);
            }
        }
        const alreadyLearned = await this.knex('character_story_abilities')
            .where({
            character_story_progress_id: activeProgress.id,
            ability_id: abilityIdToLearn,
        })
            .first();
        if (alreadyLearned)
            throw new common_1.BadRequestException('Ezt a képességet már megtanultad.');
        if (activeProgress.level < abilityToLearn.level_requirement) {
            throw new common_1.BadRequestException(`Nem érted el a szükséges szintet (${abilityToLearn.level_requirement}).`);
        }
        if ((activeProgress.talent_points_available ?? 0) <
            abilityToLearn.talent_point_cost) {
            throw new common_1.BadRequestException('Nincs elég tehetségpontod.');
        }
        if (abilityToLearn.prerequisites &&
            abilityToLearn.prerequisites.length > 0) {
            const learnedAbilities = await this.knex('character_story_abilities')
                .where({ character_story_progress_id: activeProgress.id })
                .pluck('ability_id');
            const missingPrereqs = abilityToLearn.prerequisites.filter((prereqId) => !learnedAbilities.includes(prereqId));
            if (missingPrereqs.length > 0) {
                const prereqNames = (await this.knex('abilities')
                    .whereIn('id', missingPrereqs)
                    .select('name')).map((p) => p.name);
                throw new common_1.BadRequestException(`Hiányzó előfeltétel(ek) a(z) "${abilityToLearn.name}" képességhez: ${prereqNames.join(', ')}.`);
            }
        }
        const newTalentPoints = (activeProgress.talent_points_available ?? 0) -
            abilityToLearn.talent_point_cost;
        await this.knex.transaction(async (trx) => {
            await trx('character_story_abilities').insert({
                character_story_progress_id: activeProgress.id,
                ability_id: abilityIdToLearn,
            });
            await this.characterService.updateStoryProgress(activeProgress.id, { talent_points_available: newTalentPoints }, trx);
        });
        this.logger.log(`Character progress ${activeProgress.id} learned ability ${abilityIdToLearn} (${abilityToLearn.name}).`);
        const updatedProgress = await this.characterService.getActiveStoryProgress(baseCharacter.id);
        if (!updatedProgress)
            throw new common_1.InternalServerErrorException('Failed to fetch progress after learning ability.');
        return updatedProgress;
    }
};
exports.PlayerAbilitiesService = PlayerAbilitiesService;
exports.PlayerAbilitiesService = PlayerAbilitiesService = PlayerAbilitiesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => character_service_1.CharacterService))),
    __metadata("design:paramtypes", [Function, character_service_1.CharacterService])
], PlayerAbilitiesService);
//# sourceMappingURL=player-abilities.service.js.map