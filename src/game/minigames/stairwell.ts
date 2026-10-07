/**
 * STAIRWELL — rules. PLACEHOLDER written by the slice 3b scaffold; the agent
 * building this game replaces this whole file. No React, no DOM (ground
 * rule 11). The screen calls stairwellSetup(seed, stairwellDifficulty(act)) and
 * passes the setup to src/ui/minigames/StairwellGame.tsx.
 */
export interface StairwellDifficulty { act: number }
export interface StairwellSetup { seed: number; d: StairwellDifficulty }

export function stairwellDifficulty(act: number): StairwellDifficulty {
  return { act };
}

export function stairwellSetup(seed: number, d: StairwellDifficulty): StairwellSetup {
  return { seed, d };
}
