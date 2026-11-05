import type { Skill } from "./types";
import { logExpenseSkill } from "./finance/log-expense";

/** Register new skills here. Nothing else needs to change. */
export const ALL_SKILLS: Skill[] = [logExpenseSkill];
