/**
 * Core type vocabulary for the Reign Check simulation (dev codename:
 * Dictator Sandbox).
 *
 * Design rule: GameState is *pure serialisable data*. All behaviour lives in
 * content modules keyed by string id, so a save file is just JSON and content
 * can be added without touching the engine.
 */

/* ------------------------------------------------------------------ stats */

export const STAT_KEYS = [
  'power',
  'legitimacy',
  'support',
  'treasury',
  'economy',
  'elite',
  'military',
  'security',
  'stability',
  'information',
] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

/** Hidden pressure variables. The player never sees the numbers, only symptoms. */
export const HIDDEN_KEYS = [
  'coup',        // appetite inside the armed forces for removing you
  'unrest',      // street temperature
  'scandal',     // unexploded ordnance in the press
  'leak',        // how much material is circulating outside the state
  'foreign',     // external patience with your government
  'fiscal',      // structural budget strain independent of treasury level
  'corruption',  // how much of the state is for sale
  'cult',        // personality-cult saturation
  'fear',        // how frightened the elite are of you personally
  'separatism',  // centrifugal force in the provinces
] as const;
export type HiddenKey = (typeof HIDDEN_KEYS)[number];
export type Hidden = Record<HiddenKey, number>;

/** Regime-character axes. Never shown as numbers; they name your regime at the end. */
export const REGIME_KEYS = [
  'repression',
  'populism',
  'graft',
  'militarism',
  'technocracy',
  'reform',
  'patronage',
  'personalism',
  'devolution',
  'isolation',
] as const;
export type RegimeKey = (typeof REGIME_KEYS)[number];
export type Regime = Record<RegimeKey, number>;

/* --------------------------------------------------------------- factions */

export type FactionId =
  | 'staff'      // General Staff — the army
  | 'sable'      // The Sable Office — security & intelligence
  | 'concord'    // The Concord — money
  | 'combine'    // Combine of Labour — organised workers
  | 'grey'       // The Grey Floor — the permanent bureaucracy
  | 'provinces'  // Provincial Bloc — governors and the countryside
  | 'chorus';    // The Chorus — press, students, urban professionals, opposition

export interface FactionDef {
  id: FactionId;
  name: string;
  short: string;
  icon: string;
  blurb: string;
  motivation: string;   // hidden-ish: revealed as you interact
  redLine: string;
  boon: string;
  threat: string;
  /** baseline relationships with other factions, -3..3 */
  relations: Partial<Record<FactionId, number>>;
}

export interface FactionState {
  id: FactionId;
  loyalty: number;    // 0..100 — will they back you
  power: number;      // 0..100 — how much they can actually do
  influence: number;  // 0..100 — reach into the rest of the state
  patience: number;   // 0..100 — drains when demands are ignored
  /** live demand, if any */
  demand?: FactionDemand;
  /** ids of memorable things you did to them */
  grudges: string[];
  favours: string[];
  revealed: number;   // 0..3 — how much of their hidden motive you've learned
}

/**
 * A live faction demand (Phase 3 step 1). `id` is a DemandDef id in
 * content/demands.ts — the words and prices live there, not in the save.
 * Rules (issuing, escalating, meeting, bribing) live in demands.ts.
 */
export interface FactionDemand {
  id: string;
  issuedDay: number;
  /** last day to act before it escalates (or, at ultimatum, runs out) */
  dueDay: number;
  /** murmur → formal → ultimatum; each stage costs more to meet */
  severity: 'murmur' | 'formal' | 'ultimatum';
  /** extensions successfully bribed so far — each makes the next one harder */
  bribes: number;
  /** a bribe was refused at the current stage; no second try until it escalates */
  bribeRefused?: boolean;
}

/**
 * Something about a demand the player has not acknowledged yet. The UI shows
 * these one at a time as pop-ups; dismissDemandNotice() removes the first.
 * `text` is only set for the kinds that have no live demand to read from.
 */
export interface DemandNotice {
  faction: FactionId;
  kind: 'issued' | 'escalated' | 'attemptFailed' | 'punished' | 'hostile';
  day: number;
  title?: string;
  text?: string;
}

/**
 * The crisis chain currently running (Phase 3 step 3). `id` is a CrisisDef id
 * in content/crises.ts; `cardId` is the stage card most recently queued.
 * Rules live in crises.ts. How well it is going is `flags['crisis:<id>']`.
 */
export interface ActiveCrisis {
  id: string;
  /** 1..3 */
  stage: number;
  cardId: string;
  startedDay: number;
  /** the morning the next stage (or the ending) is due */
  nextDay: number;
}

/* ------------------------------------------------------------- characters */

export type CharacterId = string;

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  faction: FactionId;
  portrait: string;       // emoji/glyph stand-in
  accent: string;         // hex
  blurb: string;
  /** one line the player sees on every card: who this is, why they matter */
  why: string;
  quirk: string;
  /** starting personality — these barely move */
  ambition: number;       // 0..100
  competence: number;     // 0..100
  venality: number;       // 0..100 how purchasable
  candour: number;        // 0..100 low = lies to you
}

export interface CharacterState {
  id: CharacterId;
  loyalty: number;   // 0..100
  trust: number;     // 0..100 — do they believe what you tell them
  fear: number;      // 0..100
  influence: number; // 0..100
  alive: boolean;
  inPost: boolean;
  exiled: boolean;
  /** things they will bring up later */
  memory: CharacterMemory[];
  /** set when they have begun to move against you */
  plotting: number;  // 0..100
}

export interface CharacterMemory {
  day: number;
  text: string;
  weight: number; // -3..3, negative = grievance
}

/* ------------------------------------------------------------------ cards */

export type CardCategory =
  | 'decision'
  | 'person'
  | 'crisis'
  | 'opportunity'
  | 'policy'
  | 'scandal'
  | 'intelligence'
  | 'foreign'
  | 'economy'
  | 'security'
  | 'alert'
  | 'minigame';

export type StageKind =
  | 'briefing'
  | 'government'
  | 'politics'
  | 'development'
  | 'afternoon'
  | 'night';

export interface DelayedEffect {
  id: string;
  /** absolute day it fires */
  day: number;
  /** shown in the "pending" tray only if visible */
  visible: boolean;
  label: string;
  effects?: Effects;
  /** or queue a specific card that day */
  cardId?: string;
  /** optional guard evaluated at fire time */
  requiresFlag?: string;
}

export interface PromiseRecord {
  id: string;
  text: string;
  to: FactionId | CharacterId;
  dueDay: number;
  kept?: boolean;
  broken?: boolean;
}

export interface ProjectRecord {
  id: string;
  name: string;
  detail: string;
  daysLeft: number;
  upkeep?: number;
  onComplete?: Effects;
  /** cosmetic: shown in the legacy report */
  legacy?: string;
}

export interface ScandalRecord {
  id: string;
  name: string;
  detail: string;
  heat: number;     // 0..100, decays slowly, spikes on events
  buried: boolean;
  day: number;
}

/** Everything a choice can do to the world. All fields optional, all additive. */
export interface Effects {
  stats?: Partial<Stats>;
  hidden?: Partial<Hidden>;
  regime?: Partial<Regime>;
  factions?: Partial<
    Record<FactionId | 'all', Partial<Pick<FactionState, 'loyalty' | 'power' | 'influence' | 'patience'>>>
  >;
  characters?: Partial<
    Record<CharacterId, Partial<Pick<CharacterState, 'loyalty' | 'trust' | 'fear' | 'influence' | 'plotting'>>>
  >;
  /** characters removed from post (resigned, arrested, fled, reassigned) */
  removeFromPost?: { who: CharacterId; reason: string; exiled?: boolean }[];
  /** remember this about a character */
  remember?: { who: CharacterId; text: string; weight: number }[];
  flags?: Partial<Record<string, number>>;
  /** delayed consequences. `inDays` is relative to the day the effect resolves. */
  schedule?: ScheduleSpec[];
  promise?: PromiseSpec;
  /** Close or explicitly extend the matching promise, not just its report count. */
  resolvePromise?: { id: string; status: 'kept' | 'broken' };
  deferPromise?: { id: string; inDays: number };
  project?: ProjectSpec;
  scandal?: ScandalSpec;
  /** recurring budget lines this choice creates */
  commitments?: CommitmentSpec[];
  /** cancel a recurring budget line by id or label */
  endCommitment?: string;
  /** resolve a named scandal */
  buryScandal?: string;
  /** push a card into an upcoming day's deck */
  queueCard?: { cardId: string; inDays?: number }[];
  /**
   * The run deck (§4.4): `add` puts a card id into `GameState.runDeck`, where
   * each copy raises that card's draw weight for the rest of the run — "a
   * growing share of what you see is what you built." `remove` bans a card
   * id from the weighted draw entirely (`GameState.bannedCards`) — permanent
   * for the run, and it always wins over any copies the same id has in
   * `runDeck`. Both only ever affect ordinary weighted draws (`ALL_CARDS` in
   * engine.ts and, for `remove` only, `ALERTS`) — a card reached by
   * `schedule`/`queueCard` still arrives regardless, same as today.
   */
  deck?: { add?: string[]; remove?: string[] };
  /** headlines for the nightly bulletin */
  news?: string[];
  /** fire a named ending immediately */
  ending?: string;
}

export interface ScheduleSpec {
  id?: string;
  inDays: number;
  visible?: boolean;
  label: string;
  effects?: Effects;
  cardId?: string;
  requiresFlag?: string;
}

export interface PromiseSpec {
  id?: string;
  text: string;
  to: FactionId | CharacterId;
  inDays: number;
}

export interface ProjectSpec {
  id?: string;
  name: string;
  detail: string;
  days: number;
  upkeep?: number;
  onComplete?: Effects;
  legacy?: string;
}

export interface Commitment {
  id: string;
  label: string;
  /** $bn per day. Positive = money going out. */
  perDay: number;
  /** undefined = permanent until cancelled */
  daysLeft?: number;
}

export interface CommitmentSpec {
  id?: string;
  label: string;
  perDay: number;
  days?: number;
}

/**
 * A deal you have taken and are currently holding — EVERY deal, permanent or
 * timed, occupies a slot here from the moment it is bought (see
 * `GameState.DEAL_CAP` in shop.ts) until it leaves one of two ways:
 *   - a timed deal (`daysLeft` defined) counts down to zero on its own,
 *     firing `ShopItemDef.expireEffects` once — shop.ts's tickHeldDeals()
 *   - any deal can be cut short on purpose, at a cost — engine.ts's
 *     cutDeal(), which reads `ShopItemDef.cutCost`/`cutEffects`
 * A permanent deal (`daysLeft` undefined) never ticks; it just sits here,
 * using up a slot, until you cut it. `itemId` looks up the rest (name,
 * upside, downside) in content/shop.ts's SHOP_MAP, same pattern as
 * `owned`/`heldFavours`.
 */
export interface HeldDeal {
  itemId: string;
  /** undefined = permanent, no clock running */
  daysLeft?: number;
}

/**
 * A deal that has left `heldDeals`, kept only so the "Advisors & Deals"
 * screen can say HOW it ended — ran its course on its own vs. cut short on
 * purpose — rather than showing every past deal as identically "Ongoing".
 */
export interface EndedDeal {
  itemId: string;
  reason: 'expired' | 'cut';
}

export interface ScandalSpec {
  id?: string;
  name: string;
  detail: string;
  heat: number;
}

export interface CardOutcome {
  /** prose shown after the choice resolves */
  text: string;
  effects?: Effects;
  /** optional tone for the result panel */
  tone?: 'good' | 'bad' | 'mixed' | 'neutral';
}

export interface CardOption {
  id: string;
  label: string;
  /** short telegraph of the obvious trade-off. Not the hidden maths. */
  hint?: string;
  /** hard requirement; option is shown but disabled with `lockedText` */
  enabled?: (s: GameState) => boolean;
  lockedText?: string;
  /** deterministic result, or a function for weighted/random results */
  outcome: CardOutcome | ((s: GameState, rng: Rng) => CardOutcome);
}

export interface CardDef {
  id: string;
  title: string;
  category: CardCategory;
  /** who is in the room */
  actor?: CharacterId;
  faction?: FactionId;
  tags?: string[];
  body: string;
  flavor?: string;
  /** which stages this can appear in; omitted = any non-briefing stage */
  stages?: StageKind[];
  /** base draw weight; modified by `weight` */
  base?: number;
  weight?: (s: GameState) => number;
  requires?: (s: GameState) => boolean;
  /** never repeats within a run */
  once?: boolean;
  /** minimum day */
  minDay?: number;
  options: CardOption[];
  /** minigame key — when set, the card opens an interaction instead of options */
  minigame?: MinigameKey;
}

export type MinigameKey =
  | 'budget'
  | 'cabinet'
  | 'intel'
  | 'diplomacy'
  | 'media'
  | 'crisis'
  | 'address'
  | 'bargain'
  | 'loyalty';

/* ----------------------------------------------------------------- alerts */

export interface AlertDef extends Omit<CardDef, 'category' | 'stages'> {
  category?: 'alert';
  /** which hidden pressure feeds this alert; used for warning indicators */
  driver: HiddenKey | 'mixed';
  severity: 1 | 2 | 3;
}

/* ------------------------------------------------------------------ misc */

export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
  range(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(arr: readonly T[]): T;
  weighted<T>(arr: readonly T[], weight: (t: T) => number): T | undefined;
  shuffle<T>(arr: T[]): T[];
  state(): number;
}

export interface LogEntry {
  day: number;
  kind: 'decision' | 'event' | 'alert' | 'consequence' | 'system' | 'news' | 'purchase';
  title: string;
  text: string;
  tone?: 'good' | 'bad' | 'mixed' | 'neutral';
}

export interface DaySummary {
  day: number;
  headlines: string[];
  statsBefore: Stats;
  statsAfter: Stats;
  notable: string[];
  mood: string;
}

/** Frozen at the close of an act before the UI reveals parliament's result.
 *  These are the exact unrounded values used by the engine; the animation is
 *  presentation only and must never recalculate or randomise them. */
/** One faction's deputies in a confidence vote (balance slice B). */
export interface VoteBloc {
  faction: FactionId;
  seats: number;
  votesFor: number;
  /** plain-words reason for how the bloc voted, e.g. "hostile: voted against as one" */
  why: string;
}

export interface ConfidenceVoteResult {
  act: number;
  day: number;
  grip: number;
  legitimacy: number;
  /** balance slice B: the chamber votes in faction blocs */
  blocs: VoteBloc[];
  /** true when an empty treasury cost votes in every bloc */
  debtCost: boolean;
  /** votes for you, out of TOTAL_SEATS */
  score: number;
  /** votes needed to survive this act's vote */
  threshold: number;
  margin: number;
  passed: boolean;
}

export type Phase =
  | 'title'
  | 'briefing'
  | 'stage'
  | 'resolve'
  | 'alert'
  | 'alertResolve'
  | 'minigame'
  | 'vote'
  | 'night'
  | 'shop'
  | 'ended';

export interface PendingCard {
  cardId: string;
  isAlert: boolean;
}

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  leaderName: string;
  leaderTitle: string;
  /** how people in the room address you: "sir", "ma'am", "chair" */
  honorific: string;
  startedAt: number;
  /** Origin chosen or rolled at the start; rules live in content/mandates.ts. */
  mandateId: string;

  day: number;
  maxDays: number;
  /** which of the 3 acts you are in — see ACT_LENGTH/NUM_ACTS in state.ts */
  act: number;
  phase: Phase;
  /** Present once an act-boundary result has been frozen for reveal. */
  confidenceVote?: ConfidenceVoteResult;

  /** stages planned for today */
  agenda: StageKind[];
  stageIndex: number;

  stats: Stats;
  statsAtDayStart: Stats;
  trend: Partial<Stats>;
  hidden: Hidden;
  regime: Regime;

  factions: Record<FactionId, FactionState>;
  characters: Record<CharacterId, CharacterState>;

  flags: Record<string, number>;
  scheduled: DelayedEffect[];
  promises: PromiseRecord[];
  projects: ProjectRecord[];
  scandals: ScandalRecord[];
  /** recurring budget lines created by your decisions */
  commitments: Commitment[];

  /** cards drawn today, in order */
  todayDeck: string[];
  /** explicitly queued cards by absolute day */
  queued: { cardId: string; day: number }[];
  seenOnce: string[];

  /* --------------------------------------------------------- the run deck
   * §4.4: shop items add to and remove from what the weighted draw favours.
   * Plain string-id arrays, same pattern as the Back Room's owned/heldFavours
   * (ground rules 1 and 5) — a new deck-affecting item needs no engine change. */
  /** card ids added this run; each occurrence boosts that card's draw weight */
  runDeck: string[];
  /** card ids banned from the weighted draw for the rest of the run */
  bannedCards: string[];

  /**
   * §4.5 step 2 (meta-progression): shop item ids eligible for tonight's
   * stock, evaluated once at `createGame()` time from `meta.ts`'s
   * `isShopItemUnlocked()` against cross-run history — a snapshot, not
   * re-checked mid-run (see meta.ts's header for why). Defaults to every
   * item's id when no unlock history is supplied (`state.ts`), so existing
   * saves/tests that never pass meta stay exactly as unrestricted as before
   * this field existed.
   */
  unlockedShopItemIds: string[];

  current?: PendingCard;
  lastOutcome?: CardOutcome & { cardTitle: string; optionLabel: string; deltas: Partial<Stats> };

  /** Phase 3 step 1: demand pop-ups not yet dismissed, oldest first */
  demandNotices: DemandNotice[];
  /** Phase 3 step 3: the crisis chain running now, if any */
  crisis?: ActiveCrisis;
  /** crisis chain ids already played this run (each runs once) */
  crisesDone: string[];

  /** breaking-alert bookkeeping */
  alertsToday: number;
  lastAlertDay: number;

  /* ------------------------------------------------- the Back Room (shop)
   * All four are plain string-id arrays, so the save stays JSON and adding a
   * new shop item needs no engine change (ground rules 1 and 5). Definitions
   * live in content/shop.ts; the logic that reads them is in shop.ts. */
  /** ids on offer in tonight's Back Room */
  shopStock: string[];
  /** advisors and policies you own — their `daily`/`lossMult` rules are live */
  owned: string[];
  /** favours bought and not yet used */
  heldFavours: string[];
  /** every shop id bought this run, for `once` gating and the legacy report */
  shopBought: string[];
  /** rolling window of recently offered ids, so stock does not repeat nightly */
  shopRecent: string[];
  /** purchases made in tonight's room — the nightly room allows exactly one */
  shopBuysTonight: number;
  /** every deal you currently hold — permanent or still counting down; see HeldDeal */
  heldDeals: HeldDeal[];
  /** deals that have left heldDeals, and how — see EndedDeal */
  endedDeals: EndedDeal[];

  log: LogEntry[];
  history: DaySummary[];
  newsQueue: string[];

  ending?: EndingResult;

  /** run statistics for the legacy report */
  stat: RunStats;
}

export interface RunStats {
  decisions: number;
  /** purchases made in the Back Room */
  dealsStruck: number;
  alertsSurvived: number;
  moneySpent: number;
  moneyTaken: number;
  peopleJailed: number;
  peoplePromoted: number;
  protestsCrushed: number;
  protestsAppeased: number;
  liesTold: number;
  promisesKept: number;
  promisesBroken: number;
  coupAttempts: number;
  ministersLost: number;
  projectsBuilt: string[];
  bigMoments: { day: number; text: string }[];
}

export interface EndingDef {
  id: string;
  title: string;
  kind: 'coup' | 'revolt' | 'collapse' | 'foreign' | 'elite' | 'assassination' | 'exit' | 'survival' | 'fracture' | 'noConfidence';
  /** checked at end of day; higher priority wins ties */
  priority: number;
  check?: (s: GameState) => boolean;
  epitaph: (s: GameState) => string;
}

export interface EndingResult {
  id: string;
  title: string;
  kind: EndingDef['kind'];
  epitaph: string;
  day: number;
  regimeLabel: string;
  verdict: string;
}
