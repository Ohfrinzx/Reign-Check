import type { Effects, FactionId, GameState } from '../types';

/**
 * PHASE 3 STEP 1 — FACTION DEMANDS (content only; the rules live in
 * src/game/demands.ts).
 *
 * When one of the five factions the player can see loses enough patience, it
 * issues one of these. A demand climbs murmur → formal → ultimatum if it is
 * left alone. The player can meet it (pay `meetCost` and take `meet`'s side
 * effects) or try to bribe for more time. If an ultimatum runs out, that
 * faction's FACTION_MOVES entry decides what they do about it.
 *
 * Only the five display factions (display.ts) get demands, so nothing can
 * arrive from a group the player has no way to track (ground rule 8).
 *
 * Money is in $B, same unit as `stats.treasury`. The UI puts the cost first
 * ("Cost: $3.0B. …", writing rule 5), so `meetHint` holds only the trade-off.
 */
export interface DemandDef {
  id: string;
  faction: FactionId;
  /** character who brings it to you */
  from: string;
  /** says what the demand is about, e.g. "The army wants its pay rise" */
  title: string;
  /** what they want, plain, with real numbers */
  ask: string;
  meetLabel: string;
  /** the trade-off, without the price — the UI adds "Cost: $X." in front */
  meetHint: string;
  /** base $B price at the murmur stage; later stages cost more (demands.ts) */
  meetCost: number;
  /** the side effects of giving in — never free (writing rules) */
  meet: Effects;
  /** one line for the log and the result toast */
  meetText: string;
  /** optional extra requirement beyond having the money */
  canMeet?: (s: GameState) => boolean;
  lockedText?: string;
}

/**
 * What a faction does when its ultimatum runs out. Whether it moves against
 * you at all, and whether that works, depends on its support and strength and
 * on `defence` (demands.ts has the maths). `protectedBy` says in plain words
 * what `defence` reads, so the player can see what keeps them safe.
 */
export interface FactionMoveDef {
  faction: FactionId;
  /** e.g. "a coup" — used in "The army may attempt a coup." */
  attempt: string;
  /** the ending fired if the attempt succeeds (content/endings.ts) */
  endingId: string;
  protectedBy: string;
  /** 0..100 — how well-protected you are against this faction */
  defence: (s: GameState) => number;
  /** they tried and failed */
  failedTitle: string;
  failedText: string;
  failedEffects: Effects;
  /** they did not try to remove you — but they did not let it go either */
  punishTitle: string;
  punishText: string;
  punishEffects: Effects;
}

const avg = (...xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export const DEMANDS: DemandDef[] = [
  /* ------------------------------------------------------------------ army */
  {
    id: 'army-pay-rise',
    faction: 'staff',
    from: 'varkov',
    title: 'The army wants its pay rise',
    ask: 'General Varkov wants the 6% officers\' pay rise that was promised two governments ago. She is not asking whether. She is asking when.',
    meetLabel: 'Sign the pay rise.',
    meetHint: 'The officers are happy. The unions notice who got paid first.',
    meetCost: 3,
    meet: {
      factions: { combine: { loyalty: -4 } },
      regime: { militarism: 2 },
    },
    meetText: 'The pay rise goes through. The officers\' mess sends a thank-you card. The unions send a list.',
  },
  {
    id: 'army-border-garrison',
    faction: 'staff',
    from: 'tern',
    title: 'The army wants more troops on the Hadem border',
    ask: 'Commander Tern wants two more battalions on the Hadem border, paid for out of the civilian budget. He says Drovna is "testing the fence".',
    meetLabel: 'Send the battalions.',
    meetHint: 'The army gets its way. The border region gets nervous, and so does Drovna.',
    meetCost: 2.5,
    meet: {
      hidden: { foreign: 4 },
      stats: { military: 3 },
      regime: { militarism: 2 },
    },
    meetText: 'Two battalions move east. Drovna files a complaint. Tern files it next to the others.',
  },

  /* -------------------------------------------------------------- security */
  {
    id: 'security-surveillance-budget',
    faction: 'sable',
    from: 'sarran',
    title: 'Security wants a bigger surveillance budget',
    ask: 'Director Sarran wants $2.5 billion for new phone-tapping equipment and "fewer questions about who it is pointed at".',
    meetLabel: 'Fund the equipment, no questions.',
    meetHint: 'Security is pleased. The press finds out eventually. It always does.',
    meetCost: 2.5,
    meet: {
      stats: { information: 4, legitimacy: -3 },
      factions: { chorus: { loyalty: -4 } },
      regime: { repression: 2 },
    },
    meetText: 'The equipment arrives in unmarked crates. Sarran stops asking for meetings, which is how you know she is happy.',
  },
  {
    id: 'security-immunity',
    faction: 'sable',
    from: 'sarran',
    title: 'Security wants legal cover for its officers',
    ask: 'Sarran wants a decree that no Sable Office officer can be prosecuted for anything done "in the course of duty". She has brought the decree. It is already typed.',
    meetLabel: 'Sign the decree.',
    meetHint: 'Security relaxes. Everyone else notices that Security relaxed.',
    meetCost: 1,
    meet: {
      stats: { legitimacy: -5, security: 3 },
      hidden: { fear: 4 },
      regime: { repression: 3 },
    },
    meetText: 'You sign it. Sarran takes the only copy with her, which is a detail you think about later.',
  },

  /* ----------------------------------------------------------------- money */
  {
    id: 'money-tax-holiday',
    faction: 'concord',
    from: 'adamek',
    title: 'Business wants a tax holiday',
    ask: 'Rulf Adamek wants a one-year break from corporate tax for the Ilvet Free Zone. He says it will "pay for itself". It will not.',
    meetLabel: 'Grant the tax holiday.',
    meetHint: 'Business is happy. The budget loses money every day for the next 8 days.',
    meetCost: 1.5,
    meet: {
      commitments: [{ label: 'Free Zone tax holiday', perDay: 0.35, days: 8 }],
      factions: { combine: { loyalty: -3 } },
      regime: { patronage: 2 },
    },
    meetText: 'The tax holiday is announced on a Friday afternoon. Adamek\'s shares are up by Monday.',
  },
  {
    id: 'money-broadcast-licence',
    faction: 'concord',
    from: 'loz',
    title: 'Loz wants the second TV licence',
    ask: 'Dmitar Loz wants the national broadcast licence that is up for renewal. He already owns Channel Seven. This would give him most of the evening news.',
    meetLabel: 'Give Loz the licence.',
    meetHint: 'Loz is grateful and on air every night. Every other newsroom is not.',
    meetCost: 1,
    meet: {
      stats: { information: 3 },
      factions: { chorus: { loyalty: -5 } },
      hidden: { corruption: 3 },
      regime: { graft: 2 },
    },
    meetText: 'Loz gets the licence. His first new programme is a documentary about you. It is very flattering.',
  },

  /* --------------------------------------------------------------- workers */
  {
    id: 'workers-mine-wages',
    faction: 'combine',
    from: 'hess',
    title: 'The miners want a wage rise',
    ask: 'Bogdan Hess wants an 8% wage rise for the Gorsk miners, and he wants it paid for the last three months too. He has a strike date written on the back of his hand.',
    meetLabel: 'Pay the miners.',
    meetHint: 'The mines keep running. The mining companies send their lawyers.',
    meetCost: 3,
    meet: {
      factions: { concord: { loyalty: -4 } },
      regime: { populism: 2 },
    },
    meetText: 'The rise is agreed. Hess shakes your hand exactly once and leaves.',
  },
  {
    id: 'workers-safety-inspectors',
    faction: 'combine',
    from: 'hess',
    title: 'The unions want real safety inspectors',
    ask: 'Hess wants 400 new safety inspectors for the factories and shafts, hired by the state and not by the owners. Two men died at the Number Six shaft last month.',
    meetLabel: 'Hire the inspectors.',
    meetHint: 'Workers are safer. Owners pay fines they are not used to paying.',
    meetCost: 2,
    meet: {
      factions: { concord: { loyalty: -3 } },
      stats: { support: 2 },
      regime: { reform: 2 },
    },
    meetText: 'Four hundred inspectors are hired. By the end of the week they have closed two shafts and made three enemies.',
  },

  /* ---------------------------------------------------------------- street */
  {
    id: 'street-bread-price',
    faction: 'chorus',
    from: 'vel',
    title: 'The public wants the bread price cut',
    ask: 'Sanna Vel is leading a campaign to cut the price of bread back to what it was last spring. The difference costs the state about $2.5 billion.',
    meetLabel: 'Cut the bread price.',
    meetHint: 'People are grateful. The finance ministry is not.',
    meetCost: 2.5,
    meet: {
      stats: { support: 3 },
      hidden: { fiscal: 3 },
      regime: { populism: 2 },
    },
    meetText: 'Bread goes back to last spring\'s price. Vel takes the credit. That was always going to happen.',
  },
  {
    id: 'street-free-the-editors',
    faction: 'chorus',
    from: 'vel',
    title: 'The public wants the jailed editors freed',
    ask: 'Three newspaper editors have been held for eleven days without charge. Vel wants them released and she wants it on the evening news.',
    meetLabel: 'Release the editors.',
    meetHint: 'The public cheers. Security thinks you have gone soft.',
    meetCost: 0.5,
    meet: {
      stats: { legitimacy: 4 },
      factions: { sable: { loyalty: -5 } },
      regime: { reform: 2 },
    },
    meetText: 'The editors walk out at noon. By six, all three have written about it.',
  },
];

export const DEMAND_MAP: Record<string, DemandDef> = Object.fromEntries(DEMANDS.map((d) => [d.id, d]));

export const FACTION_MOVES: Partial<Record<FactionId, FactionMoveDef>> = {
  staff: {
    faction: 'staff',
    attempt: 'a coup',
    endingId: 'coup',
    protectedBy: 'Security\'s support, your control of the security services, and your legitimacy',
    defence: (s) => avg(s.factions.sable.loyalty, s.stats.security, s.stats.legitimacy),
    failedTitle: 'The army tried to remove you',
    failedText: 'Two companies from the capital garrison moved on the palace at four in the morning. The Sable Office was waiting for them. By breakfast it was over, and nobody is saying the word "coup" out loud.',
    failedEffects: {
      stats: { military: -8, stability: -6 },
      hidden: { fear: 6 },
      factions: { staff: { power: -15, loyalty: -8 } },
      news: ['Troop movements in the capital overnight. The government calls it "an exercise".'],
    },
    punishTitle: 'The army stopped taking your calls',
    punishText: 'Varkov did not move against you. She simply stopped answering. Orders now reach the barracks late, if at all.',
    punishEffects: {
      stats: { military: -8, power: -4 },
      hidden: { coup: 10 },
      factions: { staff: { loyalty: -8 } },
    },
  },
  sable: {
    faction: 'sable',
    attempt: 'to remove you quietly',
    endingId: 'sable-removal',
    protectedBy: 'the army\'s support, your hold on power, and how much you know',
    defence: (s) => avg(s.factions.staff.loyalty, s.stats.power, s.stats.information),
    failedTitle: 'Security tried to remove you',
    failedText: 'A file on you reached four ministers at once. So did a message from the army saying it would not be acting on it. The file is now in a furnace, and two Sable Office deputies are on leave.',
    failedEffects: {
      stats: { security: -8, information: -6 },
      hidden: { leak: 8 },
      factions: { sable: { power: -15, loyalty: -8 } },
    },
    punishTitle: 'Security stopped telling you things',
    punishText: 'Sarran did not move against you. She just stopped sending reports. You now learn about arrests from the newspapers.',
    punishEffects: {
      stats: { information: -10, security: -4 },
      hidden: { leak: 8 },
      factions: { sable: { loyalty: -8 } },
    },
  },
  concord: {
    faction: 'concord',
    attempt: 'to have you replaced',
    endingId: 'elite',
    protectedBy: 'the support of the wealthy, the state of the economy, and your legitimacy',
    defence: (s) => avg(s.stats.elite, s.stats.economy, s.stats.legitimacy),
    failedTitle: 'Business tried to replace you',
    failedText: 'Eleven people had lunch in the Free Zone and tried to buy the Council of the Republic. The Council, for once, was not for sale. The lunch was expensive for everyone.',
    failedEffects: {
      stats: { elite: -8, economy: -4 },
      factions: { concord: { power: -15, loyalty: -8 } },
      hidden: { corruption: 4 },
    },
    punishTitle: 'The money left the country',
    punishText: 'Business did not try to remove you. It moved $6 billion to Sereth over a weekend instead.',
    punishEffects: {
      stats: { treasury: -6, economy: -6 },
      factions: { concord: { loyalty: -8 } },
      hidden: { fiscal: 6 },
    },
  },
  combine: {
    faction: 'combine',
    attempt: 'a general strike to bring you down',
    endingId: 'general-strike',
    protectedBy: 'your public support, how stable the country is, and the public\'s own mood',
    defence: (s) => avg(s.stats.support, s.stats.stability, s.factions.chorus.loyalty),
    failedTitle: 'The unions tried to bring you down',
    failedText: 'Hess called a general strike to end your government. Half the country came out. The other half went to work. After four days the strike ended, and Hess is quieter than he was.',
    failedEffects: {
      stats: { economy: -8, stability: -5 },
      factions: { combine: { power: -15, loyalty: -8 } },
      hidden: { unrest: 6 },
    },
    punishTitle: 'The mines stopped',
    punishText: 'Hess did not try to bring you down. He shut the Gorsk mines for three days instead, to show that he could.',
    punishEffects: {
      stats: { economy: -7, treasury: -3 },
      factions: { combine: { loyalty: -8 } },
      hidden: { unrest: 6 },
    },
  },
  chorus: {
    faction: 'chorus',
    attempt: 'to take the square until you go',
    endingId: 'revolution',
    protectedBy: 'the security services, Security\'s support, and your public support',
    defence: (s) => avg(s.stats.security, s.factions.sable.loyalty, s.stats.support),
    failedTitle: 'The square tried to bring you down',
    failedText: 'The square filled and stayed full for three nights. On the fourth night it rained, and most people went home. The ones who stayed were arrested, and everyone saw it.',
    failedEffects: {
      stats: { legitimacy: -6, stability: -6 },
      factions: { chorus: { power: -15, loyalty: -8 } },
      hidden: { unrest: 5 },
      regime: { repression: 2 },
    },
    punishTitle: 'The protests started',
    punishText: 'Vel did not call for your removal. She called for a march every evening until you listen, and people came.',
    punishEffects: {
      stats: { support: -6, stability: -5 },
      factions: { chorus: { loyalty: -8 } },
      hidden: { unrest: 10 },
    },
  },
};
