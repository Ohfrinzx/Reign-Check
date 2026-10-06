/**
 * BUDGET — rules. PLACEHOLDER written by the slice 3 scaffold; the agent
 * building this game replaces this whole file. No React, no DOM (ground
 * rule 11). The screen calls budgetSetup(seed, budgetDifficulty(...)) and passes
 * the setup to src/ui/minigames/BudgetGame.tsx.
 */
export interface BudgetDifficulty { act: number }
export interface BudgetSetup { seed: number; d: BudgetDifficulty }

export function budgetDifficulty(act: number): BudgetDifficulty {
  return { act };
}

export function budgetSetup(seed: number, d: BudgetDifficulty): BudgetSetup {
  return { seed, d };
}
