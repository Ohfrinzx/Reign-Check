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
 * ADVISORS and DEALS are both capped (shop.ts's ADVISOR_CAP/DEAL_CAP) — you
 * can only hold so many of each at once, which is the whole point: past the
 * cap, buying a new one means letting an old one go first. Advisors carry
 * `fireCost`/`fireEffects`/`endsCommitment` (what it costs to let them go);
 * every deal — permanent or timed — occupies a slot the same way and carries
 * `cutCost`/`cutEffects`/`endsCommitment` (what it costs to end it early).
 * `durationDays`/`expireEffects` mark the few deals that also run out on
 * their own on a day-to-day timer (see GameState.HeldDeal/heldDeals) — that
 * is separate from, and in addition to, being cuttable at any time.
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
   * arrangement also runs out on its own after this many days (tracked in
   * `GameState.heldDeals`, see shop.ts's tickHeldDeals()), firing
   * `expireEffects` once when it does. Shown to the player as a plain
   * "Lasts N days" line — this is an overt mechanic like the price, not a
   * hidden variable (ground rule 6). A timed deal can still be cut early
   * too (see `cutCost` below) — the timer is how it ends on its own, not the
   * only way it can end.
   */
  durationDays?: number;
  /** fires once, through applyEffects(), when a timed deal's daysLeft hits 0 */
  expireEffects?: Effects;
  /**
   * Advisors only. What it costs to let them go, mid-run, from the "Advisors
   * & Deals" screen (or the Back Room's own held-panel) — every advisor must
   * have a real answer here, "figurative or literal", per the same
   * everything-has-a-downside rule that governs buying one in the first
   * place.
   */
  fireCost?: number;
  /** the non-monetary consequence of firing them, applied through applyEffects() */
  fireEffects?: Effects;
  /**
   * Deals only. Every deal occupies a slot (see DEAL_CAP) until it ends, and
   * this is what it costs to end one on purpose rather than waiting it out —
   * same shape and same rule as an advisor's fireCost/fireEffects.
   */
  cutCost?: number;
  /** the non-monetary consequence of cutting a deal short, applied through applyEffects() */
  cutEffects?: Effects;
  /** the commitment id (if any) this item's purchase created, cancelled when fired (advisors) or cut (deals) */
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
  {
    id: 'varkov-adjutant',
    kind: 'advisor',
    rarity: 'common',
    tier: 'small',
    name: "Varkov's Adjutant",
    seller: 'A staff officer, retired last year, who still has coffee with everyone who matters.',
    upside: 'You hear what the General Staff is planning before it happens, not after.',
    downside: 'Varkov knows exactly who is talking to you now, and she does not enjoy the feeling.',
    cost: 6.0,
    daily: {
      hidden: {
        coup: -1.0,
      },
    },
    fireCost: 3.0,
    fireEffects: {
      factions: {
        staff: {
          loyalty: -5,
        },
      },
    },
  },
  {
    id: 'convocation-clerk',
    kind: 'advisor',
    rarity: 'common',
    tier: 'small',
    name: 'A Clerk in the Convocation',
    seller: 'Handles the paperwork for the body that meets four times a year and votes on you in one of them.',
    upside: 'Whatever you send to the Grand Convocation now moves. It stops sitting in a drawer.',
    downside: 'He expects a favour back for every favour forward. The state gets a little more purchasable.',
    cost: 3.5,
    daily: {
      hidden: {
        corruption: 0.5,
      },
    },
    fireEffects: {
      hidden: {
        corruption: 4,
      },
    },
  },
  {
    id: 'central-bank-friend',
    kind: 'advisor',
    rarity: 'uncommon',
    tier: 'small',
    name: 'A Friend at the Central Bank',
    seller: '"Independent in law," Brask says, "and in the building next door in practice."',
    upside: 'The peg holds a little longer than it should. A bad economic day lands softer.',
    downside: 'Defending a currency by hand is not free. The bill shows up every morning.',
    cost: 6.5,
    lossMult: {
      economy: 0.7,
    },
    effects: {
      commitments: [
        {
          id: 'cmt-peg-friend',
          label: 'Quiet currency support',
          perDay: 0.35,
        },
      ],
    },
    fireCost: 2.0,
    endsCommitment: 'cmt-peg-friend',
  },
  {
    id: 'communion-man',
    kind: 'advisor',
    rarity: 'common',
    tier: 'small',
    name: "The Salt Communion's Man",
    seller: 'Vask sends a quiet young priest who never raises his voice and never leaves early.',
    upside: 'Attacks on your legitimacy lose their edge. The Communion has a way of talking people down.',
    downside: 'The provinces start reading your government as blessed rather than elected. Reform gets harder to sell.',
    cost: 4.5,
    lossMult: {
      legitimacy: 0.75,
    },
    effects: {
      regime: {
        personalism: 6,
        reform: -6,
      },
    },
    fireEffects: {
      factions: {
        provinces: {
          loyalty: -5,
        },
      },
    },
  },
  {
    id: 'night-reader',
    kind: 'advisor',
    rarity: 'uncommon',
    tier: 'small',
    name: 'The Night Reader',
    seller: 'Reads Sarran\'s overnight logs before Sarran does, and tells you what is in them.',
    upside: 'Embarrassing stories get caught and buried before they run, not after.',
    downside: 'Sarran finds out eventually that someone reads her logs first. She does not forget who arranged it.',
    cost: 6.0,
    daily: {
      hidden: {
        scandal: -0.6,
        leak: -0.4,
      },
    },
    fireCost: 3.0,
    fireEffects: {
      factions: {
        sable: {
          loyalty: -8,
          patience: -6,
        },
      },
    },
  },
  {
    id: 'customs-supervisor',
    kind: 'advisor',
    rarity: 'common',
    tier: 'small',
    name: 'The Customs Supervisor',
    seller: 'Runs the loading manifests at Mavro. Says the corruption there has been "studied academically."',
    upside: 'Cargo actually gets counted. A little more of it gets taxed on the way through.',
    downside: 'Honest counting makes enemies. The people who used to skim the manifests are Concord people.',
    cost: 5.0,
    effects: {
      commitments: [
        {
          id: 'cmt-customs',
          label: 'Mavro customs, properly counted',
          perDay: -0.3,
        },
      ],
      factions: {
        concord: {
          loyalty: -6,
        },
      },
    },
    fireCost: 0,
    endsCommitment: 'cmt-customs',
    fireEffects: {
      hidden: {
        corruption: 3,
      },
    },
  },
  {
    id: 'pigeon-federation-man',
    kind: 'advisor',
    rarity: 'common',
    tier: 'small',
    name: "The Pigeon Federation's Man",
    seller: 'The Federation has 400,000 members and reaches every village faster than the state does.',
    upside: 'Word travels through the provinces on its own, and most of it is about you.',
    downside: 'You are now, formally, an honorary patron of competitive pigeon racing. Missing an event is bigger news than most of your actual decisions.',
    cost: 3.0,
    daily: {
      hidden: {
        separatism: -0.4,
        scandal: 0.3,
      },
    },
    effects: {
      factions: {
        provinces: {
          loyalty: 6,
        },
      },
    },
    fireEffects: {
      hidden: {
        scandal: 5,
      },
    },
  },
  {
    id: 'piek-deputy',
    kind: 'advisor',
    rarity: 'uncommon',
    tier: 'big',
    name: "Piek's Deputy",
    seller: 'Sees every cable before Piek sends it. Ambitious enough to show you first.',
    upside: 'You read what your own Foreign Minister tells the Ostrene embassy before the embassy does.',
    downside: 'Piek is not stupid. He works out who has been reading his cables, eventually.',
    cost: 12.0,
    daily: {
      hidden: {
        foreign: -0.6,
      },
    },
    fireCost: 4.0,
    fireEffects: {
      characters: {
        piek: {
          trust: -15,
          plotting: 10,
        },
      },
    },
  },
  {
    id: 'gorsk-engineer',
    kind: 'advisor',
    rarity: 'uncommon',
    tier: 'big',
    name: 'The Gorsk Engineer',
    seller: 'Runs a shaft in the highlands. Knows exactly how close the mines are to striking, always.',
    upside: 'The mines keep producing. You hear about trouble in Gorsk a week before Hess does.',
    downside: 'Paying an engineer to inform on the miners, if it gets out, is the kind of thing that gets a mine shut down by its own workforce.',
    cost: 13.0,
    daily: {
      stats: {
        economy: 0.3,
      },
      hidden: {
        unrest: -0.4,
      },
    },
    fireCost: 5.0,
    fireEffects: {
      factions: {
        combine: {
          loyalty: -10,
          patience: -8,
        },
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
  {
    id: 'currency-controls',
    kind: 'policy',
    rarity: 'uncommon',
    tier: 'big',
    name: 'Currency Controls',
    seller: 'Brask has the decree ready. It stops money leaving the country, starting tonight.',
    upside: 'The panic stops. Money that wanted to run for the door cannot get through it. The economy stabilises.',
    downside: 'Money that wanted to come IN cannot get through it either. Every foreign lender reads this as the beginning of the end.',
    cost: 12.0,
    lossMult: {
      economy: 0.6,
    },
    effects: {
      hidden: {
        foreign: 10,
      },
      factions: {
        concord: {
          loyalty: -14,
          patience: -10,
        },
      },
      regime: {
        isolation: 12,
      },
    },
  },
  {
    id: 'hadem-fund',
    kind: 'policy',
    rarity: 'common',
    tier: 'small',
    name: 'The Hadem Development Fund',
    seller: 'Two paved roads in since 1897. Piek says a fund would be "a gesture Drovna cannot easily answer."',
    upside: 'Roads actually get built in the Hadem region. The border quiets down a little more every day.',
    downside: 'It costs $0.55B every day, and Kostyn asks, reasonably, why the Basin never gets one of these.',
    cost: 7.0,
    daily: {
      hidden: {
        separatism: -1.1,
      },
    },
    effects: {
      commitments: [
        {
          id: 'cmt-hadem',
          label: 'Hadem development fund',
          perDay: 0.55,
        },
      ],
      factions: {
        provinces: {
          patience: -6,
        },
      },
    },
  },
  {
    id: 'peg-defense',
    kind: 'policy',
    rarity: 'uncommon',
    tier: 'big',
    name: 'Currency Peg Defense',
    seller: 'A formal commitment to defend the exchange rate at any cost, announced at 6am so it leads the news.',
    upside: 'A stable currency reads as a stable government. People trust the number on the receipt again.',
    downside: 'Defending a peg by force of will costs real money, every day, for as long as you keep the promise.',
    cost: 10.0,
    daily: {
      stats: {
        legitimacy: 0.4,
        support: 0.3,
      },
    },
    effects: {
      commitments: [
        {
          id: 'cmt-peg-defense',
          label: 'Peg defense',
          perDay: 0.75,
        },
      ],
    },
  },
  {
    id: 'land-reform',
    kind: 'policy',
    rarity: 'uncommon',
    tier: 'big',
    name: 'Land Reform, Properly Done',
    seller: 'The 1961 republic promised this and delivered the schools instead. Kostyn has the maps ready.',
    upside: 'The promise from \'61 finally gets kept. The countryside notices, and it does not forget who kept it.',
    downside: 'Every family that owns the land now being redistributed is a Concord family. They will not forgive this one.',
    cost: 16.0,
    daily: {
      stats: {
        support: 0.4,
      },
    },
    effects: {
      factions: {
        provinces: {
          loyalty: 14,
        },
        combine: {
          loyalty: 10,
        },
        concord: {
          loyalty: -20,
          patience: -15,
        },
      },
      regime: {
        reform: 16,
        populism: 10,
      },
    },
  },
  {
    id: 'dovra-broadcast',
    kind: 'policy',
    rarity: 'common',
    tier: 'small',
    name: 'The Dovra Day Broadcast',
    seller: 'Loz offers to close every Dovra Day broadcast with your name and a shot of the crowd.',
    upside: 'People start expecting to see you on the big day. Expectation, kept up, starts to look like affection.',
    downside: 'A government that has to remind you it is legitimate, every year, on the same day, is telling you something.',
    cost: 5.0,
    daily: {
      stats: {
        support: 0.3,
      },
      hidden: {
        cult: 0.5,
      },
    },
    effects: {
      hidden: {
        cult: 8,
      },
      regime: {
        personalism: 6,
      },
    },
  },
  {
    id: 'central-bank-capture',
    kind: 'policy',
    rarity: 'uncommon',
    tier: 'big',
    name: 'Central Bank Capture',
    seller: '"Independent in law, and in the Finance Ministry in practice," Brask says. This makes the practice official.',
    upside: 'You can spend what the country needs, when it needs it, without asking anyone\'s permission.',
    downside: 'Every foreign lender who cared about central bank independence now prices Velmorra as a worse bet.',
    cost: 11.0,
    effects: {
      stats: {
        treasury: 6.0,
      },
      hidden: {
        foreign: 9,
        fiscal: 6,
      },
      regime: {
        personalism: 8,
        technocracy: -6,
      },
    },
  },
  {
    id: 'convocation-rubberstamp',
    kind: 'policy',
    rarity: 'uncommon',
    tier: 'small',
    name: 'The Convocation Rubber-Stamp',
    seller: 'The Grand Convocation meets four times a year and approves what it is handed. This makes that permanent.',
    upside: 'Orders move. Nothing waits on a vote from a body that only meets four times a year anyway.',
    downside: 'Everyone can see exactly what the Convocation is for now. Legitimacy bleeds a little every day it sits idle.',
    cost: 8.0,
    daily: {
      stats: {
        legitimacy: -0.4,
      },
    },
    lossMult: {
      power: 0.7,
    },
    effects: {
      factions: {
        chorus: {
          loyalty: -8,
        },
      },
      regime: {
        repression: 10,
        personalism: 6,
      },
    },
  },
  {
    id: 'free-press-cosmetic',
    kind: 'policy',
    rarity: 'common',
    tier: 'small',
    name: 'Free the Press (On Paper)',
    seller: 'Grebs drafts a media freedom law with exactly enough teeth to quote in front of the Aureth Union.',
    upside: 'Foreign lenders see the headline and check the box. The loan terms improve a little.',
    downside: 'Loz reads the fine print and knows exactly how little it changes. So, eventually, does everyone else.',
    cost: 4.0,
    daily: {
      hidden: {
        foreign: -0.4,
        scandal: 0.3,
      },
    },
    effects: {
      regime: {
        reform: 8,
        graft: 4,
      },
    },
  },

  /* --------------------------------------------------- the run deck (§4.4)
   * These policies don't touch a stat directly — they change what the day's
   * weighted draw favours for the rest of the run, through `effects.deck`.
   * `add` puts a card id in GameState.runDeck (each copy raises that card's
   * draw weight); `remove` bans a card id outright (GameState.bannedCards).
   * Both target cards the global pool already draws unprompted — situations
   * that recur on their own, not one-off/scheduled followups — so the effect
   * is honest: buy this, and that specific situation really does come back
   * more (or stops coming back at all). */
  {
    id: 'sarran-standing-order',
    kind: 'policy',
    rarity: 'common',
    tier: 'small',
    name: 'A Standing Order to Sarran',
    seller: 'Sarran offers to keep bringing you what the Office finds, instead of waiting to be asked.',
    upside: 'She keeps a file open on someone new more often. That situation comes back around more this run.',
    downside: 'The Sable Office decides who is worth watching. You only get told after the fact.',
    cost: 3.5,
    effects: {
      deck: { add: ['sarran-file'] },
      factions: {
        sable: {
          influence: 3,
        },
      },
    },
  },
  {
    id: 'loz-standing-slot',
    kind: 'policy',
    rarity: 'common',
    tier: 'small',
    name: 'A Standing Slot on Channel Seven',
    seller: 'Loz keeps the evening segment open for whoever pays for it first, and offers you first refusal.',
    upside: 'The chance to buy the evening news comes up more often this run. Each time is still a real decision.',
    downside: 'Everyone in the newsroom knows the slot is for sale. So, eventually, does everyone watching it.',
    cost: 4.0,
    effects: {
      deck: { add: ['channel-seven'] },
      hidden: {
        leak: 2,
      },
    },
  },
  {
    id: 'piek-standing-invite',
    kind: 'policy',
    rarity: 'uncommon',
    tier: 'small',
    name: 'Piek Keeps a Chair Open',
    seller: 'Ostrene likes a government that negotiates often, Piek says, more than one that negotiates well.',
    upside: 'The lithium price-lock offer comes back to the table more often this run, each visit a fresh choice.',
    downside: 'Ostrene expects a yes eventually. Every refusal costs a little more goodwill than the last one did.',
    cost: 4.5,
    effects: {
      deck: { add: ['ostrene-lithium'] },
      characters: {
        piek: {
          trust: 4,
        },
      },
    },
  },
  {
    id: 'adamek-open-line',
    kind: 'policy',
    rarity: 'uncommon',
    tier: 'small',
    name: 'An Open Line to Adamek',
    seller: 'Adamek says a man who never sees you never gets shown the good numbers.',
    upside: 'He writes more cards. His offers turn up more often this run — each one still a real decision.',
    downside: 'The Concord gets used to being able to reach you directly, on any day it chooses.',
    cost: 5.0,
    effects: {
      deck: { add: ['adamek-card'] },
      factions: {
        concord: {
          influence: 3,
        },
      },
    },
  },
  {
    id: 'automate-payroll',
    kind: 'policy',
    rarity: 'common',
    tier: 'small',
    name: 'Automate the Payroll Reconciliation',
    seller: 'Brask says the shortfall keeps recurring because nobody owns the spreadsheet. He will own it.',
    upside: 'Payroll stops coming back as a crisis. It gets handled, quietly, before it reaches your desk.',
    downside: 'Brask\'s office now controls a number you used to see for yourself, and reports it when it chooses to.',
    cost: 6.5,
    effects: {
      deck: { remove: ['payroll-crunch'] },
      hidden: {
        corruption: 2,
      },
    },
  },
  {
    id: 'settle-with-gorsk',
    kind: 'policy',
    rarity: 'common',
    tier: 'small',
    name: 'A Standing Arrangement With Gorsk',
    seller: 'Hess offers a real contract this time, not another ten-day strike notice shaped like an argument.',
    upside: 'The strike notice out of Gorsk stops coming back. That grievance gets answered once, properly.',
    downside: 'Every other union in the Combine asks, loudly, why Gorsk got a deal and they did not.',
    cost: 5.5,
    effects: {
      deck: { remove: ['gorsk-strike-notice'] },
      factions: {
        combine: {
          loyalty: 6,
        },
      },
    },
  },
  {
    id: 'quiet-word-doran',
    kind: 'policy',
    rarity: 'common',
    tier: 'small',
    name: 'A Quiet Word With Doran',
    seller: 'She says she will stop bringing you the warning if you actually act on it once.',
    upside: 'Doran\'s recurring warning stops landing on your desk. Whatever worried her, she is handling herself now.',
    downside: 'You no longer hear about it until it has already happened.',
    cost: 3.0,
    effects: {
      deck: { remove: ['doran-warning'] },
      hidden: {
        leak: 3,
      },
    },
  },
  {
    id: 'close-free-zone-file',
    kind: 'policy',
    rarity: 'uncommon',
    tier: 'small',
    name: 'Close the Free Zone File',
    seller: 'One of Concord\'s own auditors offers to sign off on the Free Zone books, permanently, for a fee.',
    upside: 'Nobody asks you to explain the Free Zone again. The question is closed, not answered.',
    downside: 'Whatever is actually happening in the Free Zone keeps happening, and nobody is watching it now.',
    cost: 8.0,
    effects: {
      deck: { remove: ['ilvet-audit'] },
      hidden: {
        corruption: 5,
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
  {
    id: 'word-to-vel',
    kind: 'favour',
    rarity: 'uncommon',
    tier: 'small',
    name: 'A Word to Vel',
    seller: 'Not a bribe. Vel does not take those. A private conversation, off the record, that she agrees to have.',
    upside: 'Spend it any time to have the Leader of the Opposition go quiet on one specific attack.',
    downside: 'Arranging quiet conversations with your opposition is, itself, a story someone will eventually print.',
    cost: 6.0,
    effects: {
      hidden: {
        leak: 4,
      },
    },
    use: {
      label: 'Have the word',
      text: 'Vel does not mention it publicly. She also does not raise the subject again this week.',
      effects: {
        factions: {
          chorus: {
            loyalty: 6,
            patience: 8,
          },
        },
        characters: {
          vel: {
            trust: 8,
          },
        },
        hidden: {
          unrest: -6,
        },
      },
    },
  },
  {
    id: 'adamek-card',
    kind: 'favour',
    rarity: 'uncommon',
    tier: 'small',
    name: "Adamek's Card",
    seller: 'He never says a number out loud. He slides a card across the table instead. You keep it.',
    upside: 'Spend it any time and a number arrives in the account, no meeting required.',
    downside: 'Adamek does not give things away. Whatever you use this for, he now knows he can ask for something back.',
    cost: 7.0,
    effects: {
      hidden: {
        corruption: 5,
      },
    },
    use: {
      label: 'Play the card',
      text: 'The money arrives within the hour, from an account nobody can quite trace back to Ilvet.',
      effects: {
        stats: {
          treasury: 9.0,
        },
        characters: {
          adamek: {
            plotting: 6,
          },
        },
        hidden: {
          corruption: 4,
        },
      },
    },
  },
  {
    id: 'loz-seven-oclock',
    kind: 'favour',
    rarity: 'common',
    tier: 'small',
    name: 'Loz Gives You the Seven O\'Clock',
    seller: 'The whole broadcast, not a segment. Loz calls it "the full weight of the product."',
    upside: 'Spend it any time for a full news segment shaped exactly the way you want it shaped.',
    downside: 'Loz remembers exactly which favours he has given you, and to whom he has mentioned it.',
    cost: 5.0,
    effects: {
      hidden: {
        corruption: 3,
      },
    },
    use: {
      label: 'Run the segment',
      text: 'Sixty percent of the country watches it. By Thursday, most of them believe it.',
      effects: {
        stats: {
          legitimacy: 8,
          support: 7,
        },
        hidden: {
          cult: 3,
        },
      },
    },
  },
  {
    id: 'hess-owes-you',
    kind: 'favour',
    rarity: 'common',
    tier: 'small',
    name: 'Hess Owes You One',
    seller: 'He will not sit down in your office and he will not shake on it. He gives his word anyway.',
    upside: 'Spend it any time to end a strike, or stop one from starting, with one phone call from him.',
    downside: 'Hess has never had to make this call before. Calling it in tells him you needed to.',
    cost: 5.5,
    effects: {
      factions: {
        combine: {
          patience: -6,
        },
      },
    },
    use: {
      label: 'Call it in',
      text: 'Hess makes the call. The mines and the port stay open. He does not smile about it.',
      effects: {
        hidden: {
          unrest: -18,
        },
        factions: {
          combine: {
            loyalty: -4,
          },
        },
      },
    },
  },
  {
    id: 'grebs-missing-file',
    kind: 'favour',
    rarity: 'uncommon',
    tier: 'small',
    name: 'Grebs Misplaces a File',
    seller: 'She keeps copies of everything in a room only she has the key to. Some copies, she says, can go missing.',
    upside: 'Spend it any time and a specific piece of paper stops existing, along with the story it would have started.',
    downside: 'Grebs has served nine heads of state. She remembers every file she has ever misplaced, and for whom.',
    cost: 6.5,
    effects: {
      hidden: {
        corruption: 4,
      },
    },
    use: {
      label: 'Ask her to look',
      text: 'By morning the file is gone, the index is gone, and the clerk who filed it has been transferred to records in Mavro.',
      effects: {
        hidden: {
          scandal: -24,
          leak: -6,
        },
      },
    },
  },
  {
    id: 'vask-blessing',
    kind: 'favour',
    rarity: 'common',
    tier: 'small',
    name: "Vask's Blessing",
    seller: 'He never says no. He says he would want to reflect on it, which from Vask means yes.',
    upside: 'Spend it any time for a public blessing, in language vague enough that everyone reads it their own way.',
    downside: 'The countryside starts reading your government as chosen rather than elected. That cuts both ways, eventually.',
    cost: 4.0,
    effects: {
      regime: {
        personalism: 4,
      },
    },
    use: {
      label: 'Ask for the blessing',
      text: 'Vask says a few careful sentences at Sunday service. Both sides of every argument in the country quote him by Monday.',
      effects: {
        stats: {
          legitimacy: 9,
        },
        factions: {
          provinces: {
            loyalty: 7,
          },
        },
        hidden: {
          cult: 3,
        },
      },
    },
  },
  {
    id: 'ambassadors-favour',
    kind: 'favour',
    rarity: 'uncommon',
    tier: 'small',
    name: "The Ambassador's Favour",
    seller: 'Ostrene does not ask for meetings. Their ambassador schedules them. This time, he offers one instead.',
    upside: 'Spend it any time to have Ostrene quietly smooth over one specific international problem.',
    downside: 'Ostrene treats Velmorran independence as a polite fiction already. Owing them a favour does not help that.',
    cost: 6.0,
    effects: {
      regime: {
        isolation: -6,
      },
    },
    use: {
      label: 'Call the embassy',
      text: 'A single phone call from Ostrene\'s ambassador, and a problem that was going to be a problem for a week is not.',
      effects: {
        hidden: {
          foreign: -16,
        },
        stats: {
          stability: 5,
        },
      },
    },
  },
  {
    id: 'ilvet-ledger',
    kind: 'favour',
    rarity: 'uncommon',
    tier: 'small',
    name: 'The Ilvet Ledger',
    seller: 'Eleven square kilometres of banks and shell companies keep records. Somebody copied a page of them for you.',
    upside: 'Spend it any time to make one specific problem disappear, because you can now prove whose money made it.',
    downside: 'A ledger page like this is worth killing a career over. Holding one is not the same as holding it safely.',
    cost: 8.0,
    effects: {
      hidden: {
        leak: 6,
      },
    },
    use: {
      label: 'Produce the page',
      text: 'You do not have to say anything. You only have to let them see you have it.',
      effects: {
        stats: {
          power: 8,
        },
        factions: {
          concord: {
            patience: -8,
          },
        },
        hidden: {
          fear: 6,
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
    endsCommitment: 'cmt-gorsk',
    cutCost: 6.0,
    cutEffects: {
      factions: {
        concord: {
          loyalty: -6,
        },
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
      // The upside text promises "$0.30B a day from then on" — this is that
      // revenue. (Negative perDay = money coming IN, same convention as
      // second-books' reallocated-revenue commitment below.)
      commitments: [
        {
          id: 'cmt-ilvet',
          label: 'Ilvet Free Zone levy',
          perDay: -0.3,
        },
      ],
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
    endsCommitment: 'cmt-ilvet',
    cutCost: 3.0,
    cutEffects: {
      hidden: {
        scandal: 4,
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
    // Ending it before the rotation does, on purpose, looks more deliberate
    // than letting it lapse quietly — smaller cost than a permanent deal's,
    // since the arrangement was already on its way out.
    cutCost: 2.0,
    cutEffects: {
      hidden: {
        scandal: 4,
      },
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
    endsCommitment: 'cmt-ostrene',
    cutCost: 10.0,
    cutEffects: {
      hidden: {
        scandal: 5,
      },
    },
  },
  {
    id: 'salt-flats-lease',
    kind: 'deal',
    rarity: 'common',
    tier: 'small',
    name: 'Lease the Salt Flats to Sereth',
    seller: 'Sereth buys ports, stadiums and football clubs. Tonight they want the Mavro salt flats.',
    upside: 'They pay $9.0B into the account this week, no questions asked. Sereth never asks questions.',
    downside: 'Sereth never answers them either. What they want back for this arrives later, on its own schedule.',
    cost: -9.0,
    requires: (s) => !s.flags.saltFlatsLeased,
    effects: {
      flags: {
        saltFlatsLeased: 1,
      },
      commitments: [
        {
          id: 'cmt-salt-flats',
          label: 'Salt flats revenue, leased',
          perDay: 0.3,
        },
      ],
      hidden: {
        corruption: 6,
      },
      regime: {
        isolation: -4,
      },
    },
    endsCommitment: 'cmt-salt-flats',
    cutCost: 5.0,
    cutEffects: {
      hidden: {
        foreign: 5,
      },
    },
  },
  {
    id: 'aureth-loan',
    kind: 'deal',
    rarity: 'common',
    tier: 'big',
    name: 'A Loan from Aureth',
    seller: 'Cheaper than Ostrene, with conditions attached: an independent judiciary, open company records, audited defence spending.',
    upside: '$16.0B in the account, at a rate Ostrene will never match.',
    downside: 'Every condition Aureth attached is now something the Sable Office and the General Staff have to live with being audited.',
    cost: -16.0,
    requires: (s) => !s.flags.aurethLoan,
    effects: {
      flags: {
        aurethLoan: 1,
      },
      commitments: [
        {
          id: 'cmt-aureth',
          label: 'Aureth loan, debt service',
          perDay: 0.7,
        },
      ],
      factions: {
        sable: {
          loyalty: -6,
        },
        staff: {
          loyalty: -6,
        },
      },
      regime: {
        reform: 10,
        technocracy: 6,
      },
    },
    endsCommitment: 'cmt-aureth',
    cutCost: 8.0,
    cutEffects: {
      hidden: {
        foreign: 6,
      },
    },
  },
  {
    id: 'sell-council-seat',
    kind: 'deal',
    rarity: 'uncommon',
    tier: 'big',
    name: 'Sell a Seat on the Council',
    seller: 'The Council of the Republic is advisory on paper. It has removed two heads of state. Adamek wants a seat on it.',
    upside: 'Adamek pays $14.0B for a seat on the one body that can constitutionally remove you, and prefers you stay in the job that lets him keep it.',
    downside: 'You have sold a piece of the body built to remove you, to the one man in the country who buys everything.',
    cost: -14.0,
    requires: (s) => !s.flags.councilSeatSold,
    effects: {
      flags: {
        councilSeatSold: 1,
      },
      factions: {
        concord: {
          loyalty: 12,
          influence: 10,
        },
      },
      characters: {
        adamek: {
          influence: 15,
          plotting: 6,
        },
      },
      hidden: {
        corruption: 8,
      },
      regime: {
        graft: 12,
      },
    },
    cutCost: 9.0,
    cutEffects: {
      characters: {
        adamek: {
          plotting: 10,
        },
      },
      hidden: {
        corruption: 4,
      },
    },
  },
  {
    id: 'pigeon-endorsement',
    kind: 'deal',
    rarity: 'common',
    tier: 'small',
    name: 'The Pigeon Federation Endorsement',
    seller: 'The Federation has never endorsed a head of state. This season, for reasons nobody explains, they will.',
    upside: 'Support ticks up while racing season runs. It is a small thing that four hundred thousand members take very seriously.',
    downside: 'It lasts exactly as long as the season, and looks exactly as silly as it sounds once it is over.',
    cost: 3.0,
    durationDays: 4,
    requires: (s) => !s.flags.pigeonEndorsement,
    effects: {
      flags: {
        pigeonEndorsement: 1,
      },
      stats: {
        support: 4,
      },
    },
    // The season ends. The banner comes down. Someone always notices.
    expireEffects: {
      hidden: {
        scandal: 3,
      },
      news: ['Racing season closed with the traditional dinner. The Pigeon Federation declined to say whether the endorsement continues next year.'],
    },
    cutCost: 1.0,
    cutEffects: {
      hidden: {
        scandal: 2,
      },
    },
  },
  {
    id: 'drovna-understanding',
    kind: 'deal',
    rarity: 'uncommon',
    tier: 'small',
    name: 'An Understanding with Drovna',
    seller: 'A back channel to the hostile state across the Hadem border, offering a quiet pause while both sides "assess."',
    upside: 'The radio station goes quiet for a while. The border cools, for as long as the understanding holds.',
    downside: 'Nobody in the building believes it lasts. In six days, one side or the other decides whether it was ever real.',
    cost: 5.0,
    durationDays: 6,
    requires: (s) => !s.flags.drovnaUnderstanding,
    effects: {
      flags: {
        drovnaUnderstanding: 1,
      },
      hidden: {
        separatism: -8,
        foreign: -4,
      },
    },
    // It was never going to hold. The only question was how it ended.
    expireEffects: {
      hidden: {
        separatism: 6,
        foreign: 5,
      },
      news: ['The understanding with Drovna has lapsed. Both governments describe this as "expected" and blame the other.'],
    },
    cutCost: 3.0,
    cutEffects: {
      hidden: {
        foreign: 6,
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
  advisor: 'Takes one of your advisor slots. Fire them any time to free it.',
  policy: 'Changes the rules for the rest of the run.',
  favour: 'Kept in your pocket. Spend it on any day you choose.',
  deal: 'Takes one of your deal slots until you cut it, or it runs out.',
};
