import type { CardOutcome, ConsequenceKind } from '../types';

/**
 * BALANCE SLICE C — CONSEQUENCES (content only; the rules live in
 * src/game/consequences.ts).
 *
 * Owner goal: "make sure that certain decisions can trigger and influence
 * certain choice options and outcomes." A MARK is left by a decision
 * (`setBy` = card id + option id). Later cards react to it:
 *   unlock — a new option appears, only because of what you did;
 *   lock   — an option is shown but blocked, with the reason;
 *   change — an option's hint and outcome are different.
 * Every reaction is shown to the player as "Because you <because> (day N)".
 *
 * Everything is keyed by string id, so no card file needs editing and adding
 * a mark or a reaction needs no engine change (ground rule 5). A card must
 * never have all of its options locked — a test checks this.
 */
export interface MarkDef {
  id: string;
  /** finishes the sentence "Because you …" — past tense, plain words */
  because: string;
  setBy: { card: string; option: string }[];
}

export interface ConsequenceDef {
  mark: string;
  card: string;
  kind: ConsequenceKind;
  /** the option it acts on (lock/change), or the new option's id (unlock) */
  option: string;
  /** unlock only */
  label?: string;
  /** unlock: the new hint; change: replaces the hint (optional) */
  hint?: string;
  /** unlock and change */
  outcome?: CardOutcome;
  /** lock only: why it is off the table, after "Because you …:" */
  lockedText?: string;
}

export const MARKS: MarkDef[] = [
  { id: 'bought-news', because: 'paid Loz $5 billion for Channel Seven\'s coverage', setBy: [{ card: 'channel-seven', option: 'buy' }] },
  { id: 'threatened-loz', because: 'threatened Loz\'s broadcast licence', setBy: [{ card: 'channel-seven', option: 'threaten' }] },
  { id: 'arrested-vel', because: 'had Sanna Vel arrested live on air', setBy: [{ card: 'student-petition', option: 'arrest' }] },
  { id: 'repealed-19', because: 'repealed Article 19', setBy: [{ card: 'student-petition', option: 'repeal' }] },
  { id: 'audited-ilvet', because: 'ordered the Free Zone audit', setBy: [{ card: 'ilvet-audit', option: 'audit' }] },
  {
    id: 'walked-dovra',
    because: 'walked the Dovra kilometre in the rain',
    setBy: [{ card: 'saint-dovra', option: 'walk' }, { card: 'saint-dovra', option: 'expand' }, { card: 'dovra-day-weather', option: 'walk' }],
  },
  { id: 'car-dovra', because: 'took the car on Dovra Day', setBy: [{ card: 'saint-dovra', option: 'car' }, { card: 'dovra-day-weather', option: 'car' }] },
  { id: 'built-road', because: 'built the third Hadem road', setBy: [{ card: 'hadem-road', option: 'build' }] },
  { id: 'troops-hadem', because: 'sent troops to Hadem instead of a road', setBy: [{ card: 'hadem-road', option: 'garrison' }] },
  { id: 'asked-widow', because: 'let Krast\'s widow decide his funeral', setBy: [{ card: 'state-funeral', option: 'ask-widow' }] },
  { id: 'blamed-prisoner', because: 'blamed a man in custody for the stairwell', setBy: [{ card: 'stairwell-question', option: 'blame' }] },
  { id: 'sold-port', because: 'sold forty per cent of the Mavro port to Sereth', setBy: [{ card: 'sereth-offer', option: 'all' }] },
  { id: 'refused-miners', because: 'quoted the strike law at Hess', setBy: [{ card: 'gorsk-strike-notice', option: 'refuse' }] },
  { id: 'soldiers-gorsk', because: 'sent soldiers to the Gorsk mines', setBy: [{ card: 'strike-begins', option: 'soldiers' }] },
  {
    id: 'paid-miners',
    because: 'met the miners\' wage claim',
    setBy: [{ card: 'gorsk-strike-notice', option: 'meet-wages' }, { card: 'strike-begins', option: 'concede' }],
  },
  { id: 'told-truth', because: 'told the country you did not have a plan yet', setBy: [{ card: 'first-address', option: 'honest' }] },
  { id: 'burned-file', because: 'told Sarran to destroy her file', setBy: [{ card: 'sarran-file', option: 'refuse' }] },
  { id: 'went-gorsk', because: 'went to the Gorsk funeral without cameras', setBy: [{ card: 'char-request-hess', option: 'go' }] },
];

export const CONSEQUENCES: ConsequenceDef[] = [
  /* ---------------------------------------------- the stairwell question */
  {
    mark: 'bought-news',
    card: 'stairwell-question',
    kind: 'unlock',
    option: 'channel-seven-first',
    label: 'Have Channel Seven run your version first.',
    hint: 'Free. Loz\'s eleven minutes finally earn their price. You still will not know the truth.',
    outcome: {
      text: 'By seven o\'clock Channel Seven has a four-minute segment on "the questions the Chair has already answered". The young reporter\'s clip runs after it, and looks like old news.\n\nIt works. It also means the country\'s most-watched programme is now part of the story.',
      tone: 'mixed',
      effects: {
        stats: { support: 5, legitimacy: -2, information: -4 },
        hidden: { scandal: -6, cult: 4 },
        characters: { loz: { loyalty: 3 } },
        flags: { liesTold: 1 },
      },
    },
  },
  {
    mark: 'asked-widow',
    card: 'stairwell-question',
    kind: 'unlock',
    option: 'family',
    label: '"His family asked for quiet. I have respected that."',
    hint: 'Free. True, and it works, as long as nobody asks the widow what she meant.',
    outcome: {
      text: 'The room accepts it. It is hard to argue with a widow\'s wish, and everyone remembers the funeral was hers.\n\nThe question does not go away. It goes quiet, which in this building is nearly the same thing.',
      tone: 'good',
      effects: {
        stats: { legitimacy: 4, support: 3 },
        hidden: { scandal: -5 },
        factions: { chorus: { loyalty: 3 } },
      },
    },
  },

  /* --------------------------------------------------- Vel and the debate */
  {
    mark: 'told-truth',
    card: 'vel-debate',
    kind: 'change',
    option: 'accept',
    hint: 'Free. You already told the country you had no plan. She cannot catch you pretending.',
    outcome: {
      text: 'Vel\'s best line is ready: "The Chair has no plan." You agree with her in the first five minutes, and the line is gone.\n\nFor the next eighty-five minutes you argue about what the plan should be. It is the first time in nineteen years a head of state has done that on television.',
      tone: 'good',
      effects: {
        stats: { legitimacy: 9, support: 6 },
        hidden: { unrest: -5 },
        factions: { chorus: { loyalty: 10 } },
        characters: { vel: { trust: 6, influence: -4 } },
      },
    },
  },
  {
    mark: 'arrested-vel',
    card: 'vel-debate',
    kind: 'lock',
    option: 'accept',
    lockedText: 'she is in a Sable Office cell. You cannot debate someone you are holding.',
  },
  {
    mark: 'arrested-vel',
    card: 'vel-debate',
    kind: 'lock',
    option: 'conditions',
    lockedText: 'she is in a Sable Office cell. There is nobody to agree conditions with.',
  },
  {
    mark: 'arrested-vel',
    card: 'vel-debate',
    kind: 'unlock',
    option: 'release-and-debate',
    label: 'Release her tonight. Debate her tomorrow.',
    hint: 'Free. Undoes some of the damage. Everyone will know why you changed your mind.',
    outcome: {
      text: 'She walks out of the Sable Office at midnight, still in the clothes she was arrested in, and asks the cameras for a chair and a glass of water.\n\nThe debate is the most-watched broadcast in the country\'s history. You lose it on points. You win something else: people saw you let her go.',
      tone: 'mixed',
      effects: {
        stats: { legitimacy: 8, support: 4, power: -4 },
        hidden: { unrest: -10, fear: -6 },
        regime: { reform: 6 },
        factions: { chorus: { loyalty: 10 }, sable: { loyalty: -8 } },
        characters: { vel: { loyalty: 4, influence: 6 }, sarran: { loyalty: -5 } },
      },
    },
  },
  {
    mark: 'arrested-vel',
    card: 'vel-debate',
    kind: 'change',
    option: 'decline',
    hint: 'Free. She is debating you from a cell. Declining looks like you are afraid of a prisoner.',
    outcome: {
      text: 'Her lawyer reads her answers into a microphone in front of the Sable Office, one question at a time, for ninety minutes.\n\nThe empty chair on the stage has your name on it. The one outside the Sable Office has hers.',
      tone: 'bad',
      effects: {
        stats: { legitimacy: -10, support: -8 },
        hidden: { unrest: 12 },
        factions: { chorus: { loyalty: -12 } },
        characters: { vel: { influence: 16 } },
      },
    },
  },
  {
    mark: 'told-truth',
    card: 'vel-debate-challenge',
    kind: 'change',
    option: 'accept',
    hint: 'Free. You told the country you had no plan yet. Honesty is hard to trap.',
    outcome: {
      text: 'She has notes on everything you have said since your first address. None of it contradicts itself, because you told them on day one what you did not know.\n\nThe papers call it a draw. For a head of state against Sanna Vel, a draw is a win.',
      tone: 'good',
      effects: {
        stats: { legitimacy: 7, support: 5 },
        factions: { chorus: { loyalty: 8 } },
        characters: { vel: { trust: 5 } },
      },
    },
  },
  {
    mark: 'arrested-vel',
    card: 'alert-square',
    kind: 'unlock',
    option: 'release-vel',
    label: 'Release Sanna Vel. Tonight, on camera.',
    hint: 'Free. It is the one thing everyone in the square agrees on. Sarran will not forgive it.',
    outcome: {
      text: 'She comes out of the Sable Office at eleven and walks to the square. She does not make a speech. She asks people to go home, and a lot of them do.\n\nThe square is half empty by two in the morning. Sarran sends you a one-line note: "Noted."',
      tone: 'mixed',
      effects: {
        stats: { legitimacy: 6, support: 6, power: -4 },
        hidden: { unrest: -20, fear: -8 },
        factions: { chorus: { loyalty: 12 }, sable: { loyalty: -10 } },
        characters: { vel: { influence: 10 }, sarran: { loyalty: -6 } },
      },
    },
  },
  {
    mark: 'arrested-vel',
    card: 'chorus-street-mural',
    kind: 'change',
    option: 'remove',
    hint: 'Costs $0.3B. With Vel in a cell, painting over a joke looks like the next arrest.',
    outcome: {
      text: 'The crew arrives at noon. By two, three thousand people are standing in front of the wall, and the photographs are of them, not the mural.\n\nThe wall is white by evening. The same picture is painted on four more walls by morning.',
      tone: 'bad',
      effects: {
        stats: { treasury: -0.3, legitimacy: -5, support: -3 },
        hidden: { unrest: 7 },
        factions: { chorus: { loyalty: -7 } },
      },
    },
  },
  {
    mark: 'repealed-19',
    card: 'chorus-street-mural',
    kind: 'unlock',
    option: 'plaque',
    label: 'Leave it up, and put a small plaque under it.',
    hint: 'Free. You repealed Article 19. This is what that looks like in practice.',
    outcome: {
      text: 'The plaque says "Painted without permission. Kept without complaint." It is photographed more than the mural.\n\nThe artist sends an unsigned note to your office. It says "Fair."',
      tone: 'good',
      effects: {
        stats: { support: 4, legitimacy: 3 },
        hidden: { unrest: -3 },
        regime: { reform: 3 },
        factions: { chorus: { loyalty: 6 } },
      },
    },
  },
  {
    mark: 'repealed-19',
    card: 'university-grant',
    kind: 'change',
    option: 'letpublish',
    hint: 'Free. After Article 19, nobody expects you to bury a study. They expect you to answer it.',
    outcome: {
      text: 'The study runs on the front page next to a photograph of the Article 19 repeal. The story writes itself: a government that lets its universities speak.\n\nThe Free Zone\'s lawyers are unhappy. Everyone else is interested.',
      tone: 'good',
      effects: {
        stats: { legitimacy: 8, information: 4 },
        hidden: { scandal: -4 },
        factions: { chorus: { loyalty: 9 }, concord: { loyalty: -6 } },
      },
    },
  },
  {
    mark: 'threatened-loz',
    card: 'university-grant',
    kind: 'change',
    option: 'ignore',
    hint: 'Free. Loz still remembers the licence. Channel Seven will not let this land quietly.',
    outcome: {
      text: 'Channel Seven leads with the study for three nights running, with a graphic. Loz introduces it himself, which he has not done in six years.\n\nHe does not mention the licence. He does not need to.',
      tone: 'bad',
      effects: {
        stats: { legitimacy: -5, support: -3 },
        hidden: { scandal: 14, leak: 4 },
        factions: { concord: { loyalty: -3 } },
      },
    },
  },
  {
    mark: 'threatened-loz',
    card: 'char-request-loz',
    kind: 'change',
    option: 'yes',
    hint: 'Free. Loz controls the edit, and he remembers the licence.',
    outcome: {
      text: 'The interview is an hour long. The broadcast is fourteen minutes, and every minute of it is you pausing before an answer.\n\nLoz sends a thank-you note. It is very polite.',
      tone: 'bad',
      effects: {
        stats: { support: -4, legitimacy: -3 },
        characters: { loz: { loyalty: 2 } },
      },
    },
  },
  {
    mark: 'bought-news',
    card: 'alert-leak',
    kind: 'change',
    option: 'get-ahead',
    hint: 'Free. Channel Seven will carry your statement first. You are finally getting the airtime you paid for.',
    outcome: {
      text: 'The 900 pages go on the government website at nine. Channel Seven leads with your statement at nine-oh-one, and frames the pages as "the Chair\'s open-files policy".\n\nThe reporter\'s story runs the next day. It reads like a follow-up.',
      tone: 'good',
      effects: {
        stats: { legitimacy: 8, information: 5, support: 2, power: -2 },
        hidden: { leak: -20, scandal: -14 },
        regime: { reform: 8 },
        factions: { chorus: { loyalty: 5 }, grey: { loyalty: -4 } },
      },
    },
  },

  /* ----------------------------------------------------- the Free Zone */
  {
    mark: 'audited-ilvet',
    card: 'ilvet-casino-license',
    kind: 'unlock',
    option: 'after-audit',
    label: 'Hold the licence until the audit reports on Ilvet Instruments.',
    hint: 'Free. Your audit gets teeth. Adamek gets a queue.',
    outcome: {
      text: 'Grebs adds Ilvet Instruments to the audit\'s first list, and the licence application to the back of a very long drawer.\n\nAdamek calls it "a pause". Grebs calls it "procedure". The Aureth Union\'s next communiqué uses the word "encouraging".',
      tone: 'good',
      effects: {
        stats: { legitimacy: 4 },
        hidden: { corruption: -4, foreign: -2 },
        factions: { grey: { loyalty: 7 }, concord: { loyalty: -4 } },
        characters: { adamek: { loyalty: -4 }, grebs: { trust: 6 } },
      },
    },
  },
  {
    mark: 'audited-ilvet',
    card: 'alert-ledger-leak',
    kind: 'change',
    option: 'confirm-deny',
    hint: 'Slow and careful, and your own audit already covers most of these numbers.',
    outcome: {
      text: 'Grebs\'s audit team has already traced half the ledger. The rebuttal goes out at midnight with sources for every line.\n\nThe forty per cent that is false is shown to be false. The sixty per cent that is true turns out to be what the audit was already finding.',
      tone: 'good',
      effects: {
        stats: { legitimacy: 6, information: 3 },
        hidden: { scandal: -10 },
        factions: { grey: { loyalty: 4 } },
      },
    },
  },

  /* --------------------------------------------------------- Dovra Day */
  {
    mark: 'walked-dovra',
    card: 'kostyn-road-inspection',
    kind: 'change',
    option: 'walk',
    hint: 'Free. The Basin remembers you walked Dovra Day in the rain. This walk is yours as much as hers.',
    outcome: {
      text: 'Halfway along, somebody in the crowd shouts "It isn\'t even raining!" and the whole road laughs.\n\nKostyn gives her speech. The footage everyone shares is of you and the woman who shouted, still laughing.',
      tone: 'good',
      effects: {
        stats: { support: 6 },
        factions: { provinces: { loyalty: 12 } },
        characters: { kostyn: { loyalty: 10 } },
      },
    },
  },
  {
    mark: 'car-dovra',
    card: 'kostyn-road-inspection',
    kind: 'change',
    option: 'decline',
    hint: 'Free. After the Dovra car, the Basin will read this as the same thing again.',
    outcome: {
      text: 'The minister walks the road. The Basin\'s radio station plays a clip from Dovra Day of your motorcade, and then a clip of the empty road.\n\nKostyn does not say anything unkind. She does not have to.',
      tone: 'bad',
      effects: {
        stats: { support: -4 },
        factions: { provinces: { loyalty: -10, patience: -6 } },
        characters: { kostyn: { loyalty: -8 } },
      },
    },
  },
  {
    mark: 'walked-dovra',
    card: 'salt-communion-blessing',
    kind: 'change',
    option: 'ask',
    hint: 'Free. Vask watched you walk in the rain. So did the whole Basin.',
    outcome: {
      text: 'Vask blesses the government and then, unscripted, "the one who walked". The shrine applauds, which it has not done since 1961.\n\nSarnica still finds it medieval. Sarnica is not where the votes are this week.',
      tone: 'good',
      effects: {
        stats: { legitimacy: 5, support: 4 },
        factions: { provinces: { loyalty: 12 }, chorus: { loyalty: -2 } },
        characters: { vask: { loyalty: 9, trust: 5 } },
      },
    },
  },

  /* --------------------------------------------------------- Hadem */
  {
    mark: 'built-road',
    card: 'hadem-census',
    kind: 'change',
    option: 'ask',
    hint: 'Free. The councils have a new road and a reason to trust the count.',
    outcome: {
      text: 'The number comes back large, as everyone expected. The Hadem councils publish it with a photograph of the new road on the cover.\n\nThe headline in the border papers is not "Count us" but "Counted, at last". It reads like a region joining, not leaving.',
      tone: 'good',
      effects: {
        stats: { legitimacy: 6, information: 6 },
        hidden: { separatism: -8 },
        factions: { provinces: { loyalty: 8 }, chorus: { loyalty: 3 } },
      },
    },
  },
  {
    mark: 'troops-hadem',
    card: 'hadem-census',
    kind: 'change',
    option: 'ask',
    hint: 'Free. With soldiers on their roads, the councils will treat the count as a list.',
    outcome: {
      text: 'The census takers arrive in the border region a week after the soldiers did. Doors do not open.\n\nThe official count is low and nobody believes it. Drovnan radio reads out its own number every evening.',
      tone: 'bad',
      effects: {
        stats: { legitimacy: -3, information: -3 },
        hidden: { separatism: 12, foreign: 5 },
        factions: { provinces: { loyalty: -6 } },
      },
    },
  },
  {
    mark: 'built-road',
    card: 'drovna-radio-jamming',
    kind: 'change',
    option: 'counter-station',
    hint: 'Costs $2.0B. The new road gives your station a studio in the hills and something true to talk about.',
    outcome: {
      text: 'The station broadcasts from a hut at the end of the new road. Its first programme is the old woman from the Hadem delegation reading the date from her notebook, and then the date the road opened.\n\nDrovnan radio has no answer to that.',
      tone: 'good',
      effects: {
        stats: { treasury: -2, legitimacy: 2 },
        hidden: { separatism: -9 },
        factions: { provinces: { loyalty: 9 }, chorus: { loyalty: 2 } },
      },
    },
  },
  {
    mark: 'troops-hadem',
    card: 'drovna-radio-jamming',
    kind: 'change',
    option: 'jam',
    hint: 'Free. With your troops on the border, jamming the station looks like exactly what Drovna says it is.',
    outcome: {
      text: 'The station goes to static. Drovna\'s foreign ministry holds a press conference with a map, a photograph of your soldiers, and a recording of the static.\n\nThree foreign papers run the map.',
      tone: 'bad',
      effects: {
        stats: { security: 3, legitimacy: -3 },
        hidden: { separatism: 4, foreign: 8 },
        factions: { provinces: { loyalty: -6 }, sable: { loyalty: 4 } },
      },
    },
  },
  {
    mark: 'built-road',
    card: 'crisis-referendum-1',
    kind: 'unlock',
    option: 'road',
    label: 'Go to Kordiva and remind them who built the Hadem road.',
    hint: 'Free. Proof that this government keeps its promises to the regions.',
    outcome: {
      text: 'You speak in the Basin\'s main square with the Hadem road on a screen behind you. "Fifty-seven years late. But built."\n\nKostyn stands beside you and claps. The referendum is still on the calendar. It looks less necessary.',
      tone: 'good',
      effects: {
        stats: { legitimacy: 3 },
        hidden: { separatism: -6 },
        factions: { provinces: { loyalty: 6 } },
        flags: { 'crisis:referendum': 2 },
      },
    },
  },

  /* ----------------------------------------------- the funeral, the tapes */
  {
    mark: 'asked-widow',
    card: 'crisis-tapes-1',
    kind: 'unlock',
    option: 'widow',
    label: 'Ask Krast\'s widow to speak to Holl.',
    hint: 'Free. She remembers who let her bury her husband quietly. Holl trusts her more than you.',
    outcome: {
      text: 'The widow meets Holl for an hour. Nobody knows what she says. Holl postpones the story "to check some things".\n\nThe widow sends you nothing afterwards, not even a note. You understand that this is the note.',
      tone: 'good',
      effects: {
        stats: { legitimacy: 3 },
        hidden: { scandal: -6 },
        flags: { 'crisis:tapes': 2 },
      },
    },
  },
  {
    mark: 'blamed-prisoner',
    card: 'crisis-tapes-1',
    kind: 'change',
    option: 'sarran',
    hint: 'Free. She will find it. After the convenient confession, she will also know what it proves.',
    outcome: {
      text: 'Sarran finds the tape in two days. She tells you, in her flattest voice, that the man you named was not in the stairwell. He is audible on the tape, in a different building.\n\nShe keeps the copy. You both know why.',
      tone: 'bad',
      effects: {
        stats: { power: -3 },
        hidden: { scandal: 8, fear: 4 },
        characters: { sarran: { influence: 10 } },
        flags: { 'crisis:tapes': -1 },
      },
    },
  },

  /* ------------------------------------------------------------ the port */
  {
    mark: 'sold-port',
    card: 'port-crane-deal',
    kind: 'lock',
    option: 'sign',
    lockedText: 'their two-page contract gives Sereth a veto on the cranes.',
  },

  /* ------------------------------------------------------------- Gorsk */
  {
    mark: 'paid-miners',
    card: 'alert-gorsk-accident',
    kind: 'unlock',
    option: 'hess-rescue',
    label: 'Call Hess. Ask him to run the rescue with you.',
    hint: 'Free. You met his wage claim. This is how he repays it.',
    outcome: {
      text: 'Hess meets you at the pithead and takes the rescue in hand without asking anyone. Seven of the eight come up alive.\n\nThe photograph on every front page is Hess and you, filthy, at five in the morning. He has not smiled in it. He does not need to.',
      tone: 'good',
      effects: {
        stats: { support: 8, legitimacy: 6, stability: 4 },
        hidden: { unrest: -10 },
        factions: { combine: { loyalty: 10 } },
        characters: { hess: { loyalty: 8, trust: 6 } },
      },
    },
  },
  {
    mark: 'went-gorsk',
    card: 'alert-gorsk-accident',
    kind: 'change',
    option: 'go',
    hint: 'Cancels everything else today. They know your face at the pithead. You stood in their chapel.',
    outcome: {
      text: 'Nobody at the pithead is surprised to see you. A woman you stood beside at the funeral brings you coffee and tells you which families to speak to first.\n\nYou stay until the last man is brought up. The miners talk about it for a long time.',
      tone: 'good',
      effects: {
        stats: { support: 7, legitimacy: 5 },
        hidden: { unrest: -8 },
        factions: { combine: { loyalty: 9 } },
        characters: { hess: { loyalty: 6 } },
      },
    },
  },
  {
    mark: 'soldiers-gorsk',
    card: 'alert-gorsk-accident',
    kind: 'change',
    option: 'statement',
    hint: 'Correct on paper. The miners remember whose soldiers sat on the Gorsk road.',
    outcome: {
      text: 'The statement is read out at the pithead by a union steward, slowly, in front of the soldiers\' old checkpoint.\n\nThe 7pm news runs the statement and the checkpoint side by side. Hess does not comment. He does not need to.',
      tone: 'bad',
      effects: {
        stats: { support: -12, legitimacy: -8 },
        hidden: { unrest: 16, scandal: 5 },
        factions: { combine: { loyalty: -16, patience: -12 } },
        characters: { hess: { loyalty: -10, influence: 10 } },
      },
    },
  },
  {
    mark: 'soldiers-gorsk',
    card: 'char-request-hess',
    kind: 'lock',
    option: 'go',
    lockedText: 'the families have asked that nobody from the government attend. Your soldiers were on their road.',
  },
  {
    mark: 'soldiers-gorsk',
    card: 'honours-list',
    kind: 'lock',
    option: 'hess',
    lockedText: 'he has said on the radio that he would hand it back on live television.',
  },
  {
    mark: 'refused-miners',
    card: 'honours-list',
    kind: 'lock',
    option: 'hess',
    lockedText: 'he has said he will not take a medal from the government that quoted the strike law at him.',
  },

  /* ------------------------------------------------------------ Sarran */
  {
    mark: 'burned-file',
    card: 'doran-warning',
    kind: 'change',
    option: 'sable',
    hint: 'More thorough. Sarran knows where your limit is, and she works inside it.',
    outcome: {
      text: 'Sarran does it quietly, in four days, without a single interview room. She hands you one name and a two-page note.\n\n"You told me once to destroy a file," she says. "I took it as instructions for how you like things done." Doran is still hurt it was not her.',
      tone: 'mixed',
      effects: {
        stats: { security: 6, information: 6 },
        hidden: { fear: 3 },
        factions: { sable: { loyalty: 5 } },
        characters: { sarran: { trust: 5 }, doran: { loyalty: -4, trust: -4 } },
      },
    },
  },
  {
    mark: 'burned-file',
    card: 'alert-leak',
    kind: 'unlock',
    option: 'ask-sarran',
    label: 'Ask Sarran who had copies of those pages.',
    hint: 'Free. She tells you, because you once told her to burn a file. Publication still goes ahead.',
    outcome: {
      text: 'Sarran gives you a list of four names in twenty minutes. She does not ask what you will do with it.\n\nThe story runs at eleven. The next one does not, because now you know which drawer it would have come from.',
      tone: 'mixed',
      effects: {
        stats: { information: 5 },
        hidden: { leak: -10, scandal: 4 },
        factions: { sable: { loyalty: 4 } },
        characters: { sarran: { trust: 5 } },
      },
    },
  },
];
