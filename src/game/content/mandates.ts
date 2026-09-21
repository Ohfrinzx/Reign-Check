import type { CardDef, Effects, GameState, HiddenKey, FactionId } from '../types';

/** Origins are data. These hooks also support future mandates without engine branches. */
export interface MandateDef {
  id: string;
  name: string;
  summary: string;
  startText: string;
  startEffects: Effects;
  ruleText: string;
  daily?: Effects;
  extraCards?: number;
  priceMult?: number;
  pressureGainMult?: Partial<Record<HiddenKey, number>>;
  patienceLossMult?: Partial<Record<FactionId, number>>;
}

export const MANDATES: MandateDef[] = [
  {
    id: 'stairwell',
    name: 'The Stairwell',
    summary: 'Krast died in a stairwell. The army put you in his chair before anyone asked who was with him. Sarran kept the recording.',
    startText: 'Army support +20. Legitimacy starts about 20 lower.',
    startEffects: {
      factions: { staff: { loyalty: 20 } },
      stats: { legitimacy: -20, support: -20, stability: -20 },
      schedule: [{
        id: 'mandate-stairwell-file',
        inDays: 3,
        visible: true,
        label: 'Sarran wants a private meeting about the stairwell.',
        cardId: 'mandate-stairwell-file',
      }],
    },
    ruleText: 'On day 4, Security will use the recording once. Pay for their silence, give them more control, or release it yourself.',
  },
  {
    id: 'landslide',
    name: 'The Landslide',
    summary: 'The emergency election was yours by a mile. The victory party filled the square. The campaign bills filled three offices.',
    startText: 'Street support +30. Starting treasury −$20.0B.',
    startEffects: {
      factions: { chorus: { loyalty: 30 } },
      stats: { treasury: -20 },
    },
    ruleText: 'From day 2, Legitimacy falls by about 2 each morning. Winning the vote was the easy part.',
    daily: { stats: { legitimacy: -2, support: -2, stability: -2 } },
  },
  {
    id: 'handover',
    name: 'The Handover',
    summary: 'The old cabinet handed you the keys and a well-funded account. The people outside were not invited to the handover.',
    startText: 'Starting treasury +$30.0B. Street support −20.',
    startEffects: {
      stats: { treasury: 30 },
      factions: { chorus: { loyalty: -20 } },
    },
    ruleText: 'Back Room prices are 25% lower. Street pressure builds faster, and the Street loses patience faster. Deals that pay you still pay the full amount.',
    priceMult: 0.75,
    pressureGainMult: { unrest: 1.5 },
    patienceLossMult: { chorus: 1.5 },
  },
  {
    id: 'accident',
    name: 'The Accident',
    summary: 'The meeting needed a temporary chair. You raised your hand to ask a question. The minutes record unanimous consent.',
    startText: 'No starting bonuses or penalties.',
    startEffects: {},
    ruleText: 'One extra decision each day. More chances to fix the country. More chances to sign the wrong thing.',
    extraCards: 1,
  },
  {
    id: 'clean-hands',
    name: 'The Clean Hands Promise',
    summary: 'You promised an honest audit of everything. The public believed you. Sarran asked whether everything included his department.',
    startText: 'Legitimacy starts about 10 higher. Security support −15.',
    startEffects: {
      stats: { legitimacy: 10, support: 10, stability: 10 },
      factions: { sable: { loyalty: -15 } },
    },
    ruleText: 'From day 2, daily audits reduce corruption but uncover more material for scandals. Clean books do not mean quiet newspapers.',
    daily: { hidden: { corruption: -1.5, scandal: 1.5 } },
  },
  {
    id: 'pay-deal',
    name: 'The Pay Deal',
    summary: 'Hess called off the national strike after you signed a wage agreement. Parliament made you chair before he could change his mind.',
    startText: 'Workers support +20. Starting treasury −$10.0B.',
    startEffects: {
      factions: { combine: { loyalty: 20 } },
      stats: { treasury: -10 },
      commitments: [{ id: 'mandate-pay-deal', label: 'The wage agreement', perDay: 0.6 }],
    },
    ruleText: 'The wage agreement costs $0.60B every day. From day 2, Workers gain 1 support and 1 patience each morning.',
    daily: { factions: { combine: { loyalty: 1, patience: 1 } } },
  },
];

export const MANDATE_MAP: Record<string, MandateDef> = Object.fromEntries(MANDATES.map((m) => [m.id, m]));

export function currentMandate(s: GameState): MandateDef {
  return MANDATE_MAP[s.mandateId] ?? MANDATE_MAP.accident;
}

/** Queued only by the Stairwell mandate; never part of the random pool. */
export const MANDATE_CARDS: CardDef[] = [{
  id: 'mandate-stairwell-file',
  title: 'The Stairwell Recording',
  category: 'intelligence',
  actor: 'sarran',
  faction: 'sable',
  once: true,
  base: 0,
  body: 'Sarran puts a recorder on your desk. Krast is on the tape. So are you.\n\n"Only one copy, {sir}. You can pay to keep it that way. Or let my office decide which files reach your desk."',
  options: [
    {
      id: 'pay',
      label: 'Pay for the recording.',
      hint: 'Cost: $8.0B. Security keeps quiet and learns what silence is worth.',
      enabled: (s) => s.stats.treasury >= 8,
      lockedText: 'You need $8.0B in the account.',
      outcome: {
        text: 'The recorder stays. Sarran leaves. You are paying him to call this the only copy.',
        tone: 'mixed',
        effects: { stats: { treasury: -8 }, factions: { sable: { loyalty: 8 } }, hidden: { corruption: 5 } },
      },
    },
    {
      id: 'control',
      label: 'Let Security control the files.',
      hint: 'No cash cost. Security gains influence. You get less independent information.',
      outcome: {
        text: 'Sarran takes the recorder back. Your morning files now arrive with several pages missing.',
        tone: 'bad',
        effects: { stats: { information: -12 }, factions: { sable: { loyalty: 6, influence: 12 } } },
      },
    },
    {
      id: 'release',
      label: 'Give the recording to the press.',
      hint: 'No cash cost. The scandal breaks now. Security turns colder, but cannot sell you the same secret again.',
      outcome: {
        text: 'The evening news plays the whole tape. For once, Sarran learns about a government decision from television.',
        tone: 'mixed',
        effects: {
          stats: { legitimacy: -6 },
          hidden: { scandal: 12 },
          factions: { sable: { loyalty: -12 }, chorus: { loyalty: 6 } },
        },
      },
    },
  ],
}];
