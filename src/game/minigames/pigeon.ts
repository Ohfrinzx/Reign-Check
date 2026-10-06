/**
 * PIGEON — rules. PLACEHOLDER written by the slice 3 scaffold; the agent
 * building this game replaces this whole file. No React, no DOM (ground
 * rule 11). The screen calls pigeonSetup(seed, pigeonDifficulty(...)) and passes
 * the setup to src/ui/minigames/PigeonGame.tsx.
 */
export interface PigeonDifficulty { act: number; champion: boolean }
export interface PigeonSetup { seed: number; d: PigeonDifficulty }

export function pigeonDifficulty(act: number, champion = false): PigeonDifficulty {
  return { act, champion };
}

export function pigeonSetup(seed: number, d: PigeonDifficulty): PigeonSetup {
  return { seed, d };
}
