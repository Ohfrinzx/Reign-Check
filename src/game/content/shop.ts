import type { Effects, GameState, Hidden, StatKey, Stats } from '../types';

/**
 * THE BACK ROOM — everything you can buy, as data.
 *
 * Design contract (docs/DESIGN_V2.md §4.2, adapted): the shop opens at the
 * end of every day, not only between acts. Nightly stock is small and cheap
 * (`tier: 'small'`); the night an act's confidence vote is passed, the room
 * opens properly and the expensive, run-defining items (`tier: 'big'`)
 * come out too.
 *
 * Every item states its price AND its catch in plain language before you buy
 * — see `upside` / `downside`. `rarity: 'rare'` is the only kind allowed to
 * have no downside at all, and rare items are priced for it.
 *
 * Nothing here needs an engine change to add. A new item is an object in
 * SHOP_ITEMS using the four consequence mechanisms the engine already has:
 *
 *   1. `effects.stats` / `effects.factions`  — an immediate price in something
 *                                              other than money
 *   2. `effects.commitments`                 — a recurring bill on the daily budget
 *   3. `effects.schedule` / `effects.queueCard` — a consequence that arrives later
 *   4. `effects.hidden`                      — pressure that surfaces as a threat card
 *
 * plus two ongoing rules read by the engine while you own the item:
 *
 *   `daily`    — applied every morning in engine.ts's dayUpkeep()
 *   `lossMult` / `gainMult` / `priceMult` — read in effects.ts's applyCoupling()
 *                and shop.ts's shopPrice()
 *
 * Most deals are permanent; `durationDays`/`expireEffects` mark the few that
 * run on a day-to-day timer instead (see GameState.activeDeals). Advisors
 * carry `fireCost`/`fireEffects`/`endsCommitment` — what it costs, in money
 * and consequence, to let them go mid-run from the "Advisors & Deals" screen.
 *
 * See src/game/shop.ts for the logic and CLAUDE.md for the writing rules.
 */

export type ShopKind = 'advisor' | 'policy' | 'favour' | 'deal';
export type ShopRarity = 'common' | 'uncommon' | 'rare';
export type ShopTier = 'small' | 'big';

export interface ShopItemDef {
  id: string;
  kind: ShopKind;
  rarity: ShopRarity;
  tier: ShopTier;
  name: string;
  /** who is offering it — one line, in their voice or about them */
  seller: string;
  /** what you get, in plain language. No stat names, no numbers you can't act on. */
  upside: string;
  /** what it costs beyond money. Only a `rare` item may leave this out. */
  downside?: string;
  /**
   * What leaves your account, in $bn. NEGATIVE means the deal pays YOU — the
   * real price is in `downside`. Modified by `priceMult` from owned items.
   */
  cost: number;
  /** hidden from the stock roll when this returns false */
  requires?: (s: GameState) => boolean;
  /** resolved at purchase through applyEffects(), exactly like a card option */
  effects?: Effects;
  /** advisors and policies: applied every morning for as long as you own it */
  daily?: {
    stats?: Partial<Stats>;
    hidden?: Partial<Hidden>;
  };
  /** multiplies incoming NEGATIVE stat changes while owned (0.5 = losses halved) */
  lossMult?: Partial<Record<StatKey, number>>;
  /** multiplies incoming POSITIVE stat changes while owned */
  gainMult?: Partial<Record<StatKey, number>>;
  /** multiplies every Back Room price while owned */
  priceMult?: number;
  /** favours only: what happens when you spend it */
  use?: {
    label: string;
    text: string;
    effects?: Effects;
  };
  /**
   * Deals only. Most deals are permanent — this is the exception: the
   * arrangement runs for this many days (tracked in `GameState.activeDeals`,
   * see shop.ts's tickActiveDeals()), then `expireEffects` fires once and it
   * is gone. Shown to the player as a plain "Lasts N days" line — this is an
   * overt mechanic like the price, not a hidden variable (ground rule 6).
   */
  durationDays?: number;
  /** fires once, through applyEffects(), when a timed deal's daysLeft hits 0 */
  expireEffects?: Effects;
  /**
   * Advisors only. What it costs to let them go, mid-run, from the "Advisors
   * & Deals" screen — every advisor must have a real answer here, "figurative
   * or literal", per the same everything-has-a-downside rule that governs
   * buying one in the first place.
   */
  fireCost?: number;
  /** the non-monetary consequence of firing them, applied through applyEffects() */
  fireEffects?: Effects;
  /** the commitment id (if any) their hiring created, cancelled when fired */
  endsCommitment?: string;
}

export const SHOP_ITEMS: ShopItemDef[] = [
  /* ------------------------------------------------------------- advisors */
  {
    id: 'fixer',
    kind: 'advisor',
    rarity: 'common',
    tier: 'small',
    name: 'A Fixer on Retainer',
    seller: 'Doran knows a man. She will not say his name in the room.',
    upside: 'Bad stories about you land softer. He gets to the people in them first.',
    downside: 'He is paid every day, forever, and the bill shows up on your budget.',
    cost: 5.5,
    lossMult: {
      legitimacy: 0.66,
    },
    effects: {
      commitments: [
        {
          id: 'cmt-fixer',
          label: 'The fixer',
          perDay: 0.25,
        },
      ],
      regime: {
        patronage: 8,
      },
    },
    fireCost: 2.0,
    endsCommitment: 'cmt-fixer',
    fireEffects: {
      hidden: {
        leak: 3,
      },
    },
  },
  {
    id: 'channel-seven-man',
    kind: 'advisor',
    rarity: 'common',
    tier: 'small',
    name: 'A Man at Channel Seven',
    seller: 'A deputy editor on the 7pm news. Loz will not notice for a while.',
    upside: 'Your version of events runs first. The public turns on you more slowly.',
    downside: 'He takes money from two people. Every day he works for you, more of the state is for sale.',
    cost: 5.0,
    lossMult: {
      support: 0.7,
    },
    daily: {
      hidden: {
        corruption: 0.7,
      },
    },
    effects: {
      regime: {
        graft: 6,
      },
    },
    fireEffects: {
      hidden: {
        scandal: 5,
      },
    },
  },
  {
    id: 'garrison-liaison',
    kind: 'advisor',
    rarity: 'uncommon',
    tier: 'small',
    name: "Tern's Liaison Officer",
    seller: 'Commander Tern offers you an officer who will sit in on garrison meetings.',
    upside: 'You hear what the army decided on the day it decides it. Plots get harder to keep quiet.',
    downside: 'Tern picks the officer. The Sable Office takes it as an insult, because it is one.',
    cost: 7.0,
    daily: {
      hidden: {
        coup: -1.2,
      },
    },
    effects: {
      factions: {
        sable: {
          loyalty: -9,
          patience: -6,
        },
      },
      regime: {
        militarism: 8,
      },
    },
    fireEffects: {
      factions: {
        staff: {
          loyalty: -6,
        },
      },
    },
  },
  {
    id: 'second-books',
    kind: 'advisor',
    rarity: 'uncommon',
    tier: 'big',
    name: 'A Second Set of Books',
    seller: 'Not Brask. Brask would resign. Someone two floors below Brask.',
    upside: 'Revenue that was going somewhere else now arrives: $0.55B a day.',
    downside: 'The money comes from somewhere. Corruption spreads, and the story is one audit away.',
    cost: 15.0,
    effects: {
      commitments: [
        {
          id: 'cmt-second-books',
          label: 'Reallocated revenue',
          perDay: -0.55,
        },
      ],
      hidden: {
        corruption: 10,
      },
      regime: {
        graft: 14,
      },
    },
    daily: {
      hidden: {
        corruption: 0.9,
        scandal: 0.5,
      },
    },
    fireCost: 4.0,
    endsCommitment: 'cmt-second-books',
    fireEffects: {
      hidden: {
        scandal: 4,
      },
    },
  },
  {
    id: 'archivist',
    kind: 'advisor',
    rarity: 'rare',
    tier: 'big',
    name: 'The Archivist',
    seller: 'She catalogued the last three governments. She has no politics and no friends.',
    upside: 'Documents stop walking out of the building, and what you know stays worth knowing.',
    cost: 22.0,
    daily: {
      hidden: {
        leak: -1.6,
      },
    },
    lossMult: {
      information: 0.55,
    },
    fireEffects: {
      hidden: {
        leak: 2,
      },
    },
  },

  /* -------------------------------------------------------------- policies */
  {
    id: 'emergency-powers',
    kind: 'policy',
    rarity: 'uncommon',
    tier: 'big',
    name: 'Emergency Powers',
    seller: 'The Civil Service has had the decree drafted since before you arrived.',
    upside: 'Orders get obeyed. Losses to your grip on the army, the police and your own information are halved.',
    downside: 'A country under emergency rule stops believing the rule is temporary. Legitimacy falls every single day.',
    cost: 14.0,
    lossMult: {
      power: 0.5,
      security: 0.5,
      military: 0.5,
      information: 0.5,
    },
    daily: {
      stats: {
        legitimacy: -1.0,
      },
    },
    effects: {
      regime: {
        repression: 18,
        personalism: 8,
      },
    },
  },
  {
    id: 'bread-subsidy',
    kind: 'policy',
    rarity: 'common',
    tier: 'small',
    name: 'The Bread Subsidy',
    seller: 'Hess says the number that keeps the mines working is on this page.',
    upside: 'Food stays cheap. The street cools down a little every day and warms to you.',
    downside: 'It costs $0.60B every day and it never ends on its own. Taking it away later is worse than never giving it.',
    cost: 6.0,
    daily: {
      hidden: {
        unrest: -1.6,
      },
      stats: {
        support: 0.35,
      },
    },
    effects: {
      commitments: [
        {
          id: 'cmt-bread',
          label: 'Bread subsidy',
          perDay: 0.6,
        },
      ],
      factions: {
        combine: {
          loyalty: 8,
        },
      },
      regime: {
        populism: 12,
      },
    },
  },
  {
    id: 'night-courts',
    kind: 'policy',
    rarity: 'common',
    tier: 'small',
    name: 'The Night Courts',
    seller: 'Cases heard after 10pm, with no public list of who is being heard.',
    upside: 'Trouble on the street gets processed quietly, and the police get more confident every day.',
    downside: 'Everyone knows what a night court is. Legitimacy drains and the press keeps a running count.',
    cost: 4.0,
    daily: {
      stats: {
        security: 0.45,
        legitimacy: -0.5,
      },
      hidden: {
        unrest: -1.1,
        scandal: 0.8,
      },
    },
    effects: {
      regime: {
        repression: 14,
      },
    },
  },
  {
    id: 'publish-accounts',
    kind: 'policy',
    rarity: 'uncommon',
    tier: 'small',
    name: 'Publish the Accounts',
    seller: 'Brask has wanted this since day one. He has the first edition ready.',
    upside: 'Money stops leaking, and people start believing the figures you give them.',
    downside: 'Every problem in the budget becomes a public problem. The Concord hates it and the press feeds on it.',
    cost: 3.0,
    daily: {
      stats: {
        legitimacy: 0.6,
      },
      hidden: {
        corruption: -1.3,
        scandal: 0.9,
      },
    },
    effects: {
      factions: {
        concord: {
          loyalty: -11,
        },
      },
      regime: {
        reform: 14,
        technocracy: 8,
      },
    },
  },

  /* --------------------------------------------------------------- favours */
  {
    id: 'quiet-word',
    kind: 'favour',
    rarity: 'common',
    tier: 'small',
    name: 'A Quiet Word',
    seller: 'Sarran offers it without being asked, which is its own information.',
    upside: 'Spend it any time and the story you are most afraid of stops.',
    downside: 'The Sable Office writes down that you used it, and what it was about.',
    cost: 4.0,
    effects: {
      hidden: {
        leak: 5,
      },
    },
    use: {
      label: 'Have the quiet word',
      text: 'Nobody prints it. Nobody says why. The editor who had it is now covering the port expansion.',
      effects: {
        hidden: {
          scandal: -28,
          leak: -8,
        },
        regime: {
          repression: 6,
        },
      },
    },
  },
  {
    id: 'garrison-envelope',
    kind: 'favour',
    rarity: 'common',
    tier: 'small',
    name: 'An Envelope for the Garrison',
    seller: 'Cash for the capital garrison, handed over without a signature anywhere.',
    upside: 'Spend it any time and the army remembers whose side it is on.',
    downside: 'They will expect another one. Money that moves this way makes more of the state purchasable.',
    cost: 4.5,
    effects: {
      hidden: {
        corruption: 7,
      },
      regime: {
        patronage: 8,
      },
    },
    use: {
      label: 'Send the envelope',
      text: 'Tern does not mention it. The morning report from the garrison is noticeably warmer.',
      effects: {
        factions: {
          staff: {
            loyalty: 13,
            patience: 8,
          },
        },
        hidden: {
          coup: -15,
        },
        characters: {
          tern: {
            loyalty: 8,
            plotting: -10,
          },
        },
      },
    },
  },
  {
    id: 'blank-warrant',
    kind: 'favour',
    rarity: 'uncommon',
    tier: 'small',
    name: 'A Blank Warrant',
    seller: 'Signed, sealed, and with the name left off. You fill it in later.',
    upside: 'Spend it any time to clear the street and put the police back on the front foot.',
    downside: 'Buying one is recorded. Material about you starts circulating outside the building.',
    cost: 5.5,
    effects: {
      hidden: {
        leak: 6,
      },
    },
    use: {
      label: 'Fill in the name',
      text: 'The square is empty by morning. Nobody in the building asks whose name went on the paper.',
      effects: {
        stats: {
          security: 9,
          power: 6,
          legitimacy: -7,
        },
        hidden: {
          unrest: -14,
          fear: 8,
        },
        factions: {
          chorus: {
            loyalty: -8,
          },
        },
        regime: {
          repression: 14,
        },
      },
    },
  },
  {
    id: 'one-good-story',
    kind: 'favour',
    rarity: 'rare',
    tier: 'small',
    name: 'One Good Story',
    seller: 'A real one, about something your government actually did, held back until you need it.',
    upside: 'Spend it any time for a genuinely good day in the press. Nobody is paid and nobody is threatened.',
    cost: 9.0,
    use: {
      label: 'Run the story',
      text: 'It leads at seven and it is true, which is why it works. Even the Chorus runs it.',
      effects: {
        stats: {
          legitimacy: 11,
          support: 9,
        },
        hidden: {
          scandal: -8,
        },
      },
    },
  },

  /* ----------------------------------------------------------------- deals */
  {
    id: 'gorsk-lease',
    kind: 'deal',
    rarity: 'common',
    tier: 'small',
    name: 'Sell the Gorsk Lease',
    seller: 'A Sereth mining group wants forty years of the highland shafts.',
    upside: 'They pay $11.0B into the account this week.',
    downside: 'The mining revenue stops being yours — $0.35B a day gone — and the Combine finds out today.',
    cost: -11.0,
    requires: (s) => !s.flags.gorskLeaseSold,
    effects: {
      flags: {
        gorskLeaseSold: 1,
      },
      commitments: [
        {
          id: 'cmt-gorsk',
          label: 'Gorsk revenue, sold',
          perDay: 0.35,
        },
      ],
      factions: {
        combine: {
          loyalty: -15,
          patience: -10,
        },
      },
      hidden: {
        unrest: 9,
      },
      regime: {
        graft: 8,
      },
    },
  },
  {
    id: 'ilvet-levy',
    kind: 'deal',
    rarity: 'uncommon',
    tier: 'small',
    name: 'A Levy on the Free Zone',
    seller: 'Ilvet has enormous turnover and pays almost no tax. You could change that tonight.',
    upside: 'A one-off $7.0B settlement, and $0.30B a day from then on.',
    downside: 'The Concord will not forget it. Adamek in particular, whose money is most of what is in Ilvet.',
    cost: -7.0,
    requires: (s) => !s.flags.ilvetLevy,
    effects: {
      flags: {
        ilvetLevy: 1,
      },
      factions: {
        concord: {
          loyalty: -17,
          patience: -12,
        },
      },
      hidden: {
        foreign: 6,
      },
      characters: {
        adamek: {
          loyalty: -12,
          plotting: 8,
        },
      },
      regime: {
        technocracy: 6,
      },
    },
  },
  {
    id: 'three-judges',
    kind: 'deal',
    rarity: 'uncommon',
    tier: 'small',
    name: 'Three Judges',
    seller: 'Not the whole bench. Three of them, on the cases that matter.',
    upside: 'Rulings go your way for about a week. The government looks lawful and the police get room to work.',
    downside: 'Three judges know they were bought, and so do the clerks who arranged it. In five days the rotation changes them out.',
    cost: 8.0,
    durationDays: 5,
    requires: (s) => !s.flags.judgesBought,
    effects: {
      flags: {
        judgesBought: 1,
      },
      stats: {
        legitimacy: 7,
        power: 6,
        security: 4,
      },
      hidden: {
        corruption: 10,
        scandal: 8,
      },
      factions: {
        chorus: {
          loyalty: -9,
        },
      },
      regime: {
        graft: 10,
        repression: 6,
      },
    },
    // The rotation moves them to other courts and the arrangement is over —
    // whatever it bought you does not reverse, but the story catches up.
    expireEffects: {
      hidden: {
        scandal: 6,
      },
      news: ['The three judges everyone was talking about have been quietly reassigned to appellate courts upstate.'],
    },
  },
  {
    id: 'ostrene-loan',
    kind: 'deal',
    rarity: 'common',
    tier: 'big',
    name: 'The Ostrene Loan',
    seller: 'Ostrene will lend you $20B tonight, at a rate Piek describes as friendly.',
    upside: '$20.0B in the account immediately. Nothing else changes today.',
    downside: 'It costs $1.10B a day to service for the rest of your term, and Ostrene now owns a piece of your foreign policy.',
    cost: -20.0,
    requires: (s) => !s.flags.ostreneLoan,
    effects: {
      flags: {
        ostreneLoan: 1,
      },
      commitments: [
        {
          id: 'cmt-ostrene',
          label: 'Ostrene loan, debt service',
          perDay: 1.1,
        },
      ],
      hidden: {
        foreign: 14,
        fiscal: 8,
      },
      regime: {
        isolation: -6,
      },
    },
  },
];

export const SHOP_MAP: Record<string, ShopItemDef> =
  Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i]));

export const KIND_LABEL: Record<ShopKind, string> = {
  advisor: 'Advisor',
  policy: 'Policy',
  favour: 'Favour',
  deal: 'Deal',
};

export const KIND_NOTE: Record<ShopKind, string> = {
  advisor: 'Stays with you for the rest of the run.',
  policy: 'Changes the rules for the rest of the run.',
  favour: 'Kept in your pocket. Spend it on any day you choose.',
  deal: 'Happens once, tonight, and is done.',
};
