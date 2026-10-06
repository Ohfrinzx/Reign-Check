/**
 * MOLE — rules. PLACEHOLDER written by the slice 3 scaffold; the agent
 * building this game replaces this whole file. No React, no DOM (ground
 * rule 11). The screen calls moleSetup(seed, moleDifficulty(...)) and passes
 * the setup to src/ui/minigames/MoleGame.tsx.
 */
export interface MoleDifficulty { act: number }
export interface MoleSetup { seed: number; d: MoleDifficulty }

export function moleDifficulty(act: number): MoleDifficulty {
  return { act };
}

export function moleSetup(seed: number, d: MoleDifficulty): MoleSetup {
  return { seed, d };
}
