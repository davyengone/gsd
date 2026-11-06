import type { Skill } from "./types";
import { lifeSkill } from "./life";
import { actionsSkill } from "./actions";

/** Register new skills here. Nothing else needs to change. */
export const ALL_SKILLS: Skill[] = [lifeSkill, actionsSkill];
