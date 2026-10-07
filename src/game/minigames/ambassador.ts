/**
 * AMBASSADOR — rules. PLACEHOLDER written by the slice 3b scaffold; the agent
 * building this game replaces this whole file. No React, no DOM (ground
 * rule 11). The screen calls ambassadorSetup(seed, ambassadorDifficulty(act)) and
 * passes the setup to src/ui/minigames/AmbassadorGame.tsx.
 */
export interface AmbassadorDifficulty { act: number }
export interface AmbassadorSetup { seed: number; d: AmbassadorDifficulty }

export function ambassadorDifficulty(act: number): AmbassadorDifficulty {
  return { act };
}

export function ambassadorSetup(seed: number, d: AmbassadorDifficulty): AmbassadorSetup {
  return { seed, d };
}
