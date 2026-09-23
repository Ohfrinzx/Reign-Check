import type { CardDef } from '../types';

/**
 * BALANCE SLICE A — CHARACTER REQUESTS (content only; rules in
 * src/game/characterEvents.ts).
 *
 * The third kind of private file, next to betrayals and offers. Owner
 * request: a private file every day. Betrayals and offers only fire at the
 * extremes of loyalty, so on most days nobody qualified. A request can come
 * from anyone still in post who is neither turning nor devoted: they want
 * something personal. Granting it wins them over; refusing costs you some of
 * their loyalty — which is exactly what later decides whether they bring
 * you an offer or a betrayal.
 *
 * Queued-only (`base: 0`, `weight: () => 0`), once per run, tagged
 * `character-event` + `request` so CardView draws them as a private file.
 */

const never = () => 0;
const tags = ['character-event', 'request'];

export const CHARACTER_REQUESTS: CardDef[] = [
  {
    id: 'char-request-varkov',
    title: 'Varkov Wants a Medal for Sergeant Ilić',
    category: 'person',
    actor: 'varkov',
    faction: 'staff',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'A sergeant named Ilić was killed on the Hadem border last week, pulling two conscripts out of a flooded trench. General Varkov wants him given the Order of the Republic, by you, in person, at his funeral.\n\n"The army will be watching who turns up," she says.',
    options: [
      {
        id: 'go',
        label: 'Go to the funeral and give the medal yourself.',
        hint: 'Free. It costs you a day. The army will remember it for years.',
        outcome: {
          text: 'You pin the medal on a folded flag and shake hands with Ilić\'s mother. Varkov stands next to you the whole time and says nothing, which from her is warm.',
          tone: 'good',
          effects: {
            stats: { military: 3, power: -1 },
            factions: { staff: { loyalty: 5 } },
            characters: { varkov: { loyalty: 10, trust: 6 } },
            flags: { honouredIlic: 1 },
          },
        },
      },
      {
        id: 'send',
        label: 'Award the medal, but send a minister.',
        hint: 'Free. The medal is given. Varkov notices who gave it.',
        outcome: {
          text: 'The medal is presented by the Deputy Minister of Defence, who mispronounces Ilić. Varkov corrects him in front of the family.',
          tone: 'mixed',
          effects: {
            factions: { staff: { loyalty: 1 } },
            characters: { varkov: { loyalty: 2 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Decline. Medals should go through the committee.',
        hint: 'Free. Correct procedure. Varkov will not ask you for anything personal again.',
        outcome: {
          text: '"Of course," says Varkov. The committee meets in March. Ilić will get a certificate.',
          tone: 'bad',
          effects: {
            factions: { staff: { loyalty: -4 } },
            characters: { varkov: { loyalty: -9, trust: -4 } },
            remember: [{ who: 'varkov', text: 'Would not give Sergeant Ilić his medal.', weight: -2 }],
          },
        },
      },
    ],
  },
  {
    id: 'char-request-sarran',
    title: 'Sarran Wants Her Deputy Promoted',
    category: 'person',
    actor: 'sarran',
    faction: 'sable',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Director Sarran wants her deputy, a quiet man named Orsk, promoted to run the Sable Office\'s foreign desk. It would make him the second most powerful person in the building after her.\n\n"He is loyal," she says. She does not say to whom.',
    options: [
      {
        id: 'yes',
        label: 'Promote Orsk.',
        hint: 'Free. Sarran is grateful. The Sable Office becomes even more hers.',
        outcome: {
          text: 'Orsk moves into a bigger office. Sarran\'s next report is longer and more useful than usual.',
          tone: 'good',
          effects: {
            stats: { information: 3 },
            characters: { sarran: { loyalty: 9, influence: 5 } },
          },
        },
      },
      {
        id: 'own',
        label: 'Promote someone you choose instead.',
        hint: 'Free. You get your own person inside the Sable Office. Sarran gets a spy she did not pick.',
        outcome: {
          text: 'Your choice starts on Monday. By Wednesday she has been given an office with no windows and no telephone.',
          tone: 'mixed',
          effects: {
            stats: { information: 1 },
            characters: { sarran: { loyalty: -6, trust: -5 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Leave the post empty for now.',
        hint: 'Free. Nobody gains. Sarran takes note that you hesitated.',
        outcome: {
          text: 'The post stays empty. Sarran does the job herself, which gives her even more reach.',
          tone: 'neutral',
          effects: {
            characters: { sarran: { loyalty: -4, influence: 3 } },
          },
        },
      },
    ],
  },
  {
    id: 'char-request-brask',
    title: 'Brask Wants to Publish the Real Budget',
    category: 'economy',
    actor: 'brask',
    faction: 'grey',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Brask wants to publish the budget the way it really is: every line, every hidden debt, every payment to the Free Zone. He has already written the introduction.\n\n"People will be angry for a week," he says, sweating. "Then they will trust us for a year."',
    options: [
      {
        id: 'publish',
        label: 'Publish it, all of it.',
        hint: 'Free. Honest and painful. The Elites hate having their payments printed.',
        outcome: {
          text: 'The budget goes online with every line visible. The newspapers find eleven embarrassing items by lunch. By Friday, people are quoting Brask approvingly.',
          tone: 'good',
          effects: {
            stats: { legitimacy: 5, elite: -4 },
            hidden: { corruption: -4, foreign: -3 },
            factions: { concord: { loyalty: -4 } },
            characters: { brask: { loyalty: 12, trust: 6 } },
            regime: { technocracy: 2 },
            flags: { budgetPublished: 1 },
          },
        },
      },
      {
        id: 'summary',
        label: 'Publish a summary, not the details.',
        hint: 'Free. A little more trust. Brask thinks it is a cover-up with a nice font.',
        outcome: {
          text: 'A twelve-page summary is published. It is accurate and tells nobody anything they wanted to know.',
          tone: 'mixed',
          effects: {
            stats: { legitimacy: 1 },
            characters: { brask: { loyalty: -3 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Keep the budget internal.',
        hint: 'Free. Nothing changes. Brask starts leaving his notebook at home.',
        outcome: {
          text: 'Brask puts the introduction back in his folder without a word. He looks, for the first time, like a man considering his options.',
          tone: 'bad',
          effects: {
            characters: { brask: { loyalty: -9, trust: -5 } },
            remember: [{ who: 'brask', text: 'Was not allowed to publish the real budget.', weight: -2 }],
          },
        },
      },
    ],
  },
  {
    id: 'char-request-doran',
    title: 'Doran Needs a Week Away',
    category: 'person',
    actor: 'doran',
    faction: 'grey',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Your Chief of Staff\'s mother is ill in Mavro. Doran asks, stiffly, for a week away. She has never asked for a day.\n\n"Your diary will be chaos," she says. "I would like you to tell me that is acceptable."',
    options: [
      {
        id: 'go',
        label: 'Tell her to go, for as long as she needs.',
        hint: 'Free. Your office runs worse this week. Doran will not forget this.',
        outcome: {
          text: 'She leaves that evening. The week is chaos: two meetings double-booked, one ambassador kept waiting. Doran rings every night anyway.',
          tone: 'good',
          effects: {
            stats: { power: -3 },
            characters: { doran: { loyalty: 14, trust: 8 } },
            remember: [{ who: 'doran', text: 'Was given the week with her mother without a question.', weight: 3 }],
          },
        },
      },
      {
        id: 'three',
        label: 'Give her three days.',
        hint: 'Free. A compromise. She takes it, and counts it.',
        outcome: {
          text: 'She goes for three days and comes back on the morning of the fourth, looking tired. She says thank you exactly once.',
          tone: 'mixed',
          effects: {
            stats: { power: -1 },
            characters: { doran: { loyalty: 3 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Ask her to wait until after the confidence vote.',
        hint: 'Free. The office runs smoothly. Doran adds this to the total.',
        outcome: {
          text: '"Of course," she says, and uses your title. She does not use your first name again that week.',
          tone: 'bad',
          effects: {
            characters: { doran: { loyalty: -11, trust: -6 } },
            remember: [{ who: 'doran', text: 'Was kept at her desk while her mother was ill.', weight: -3 }],
          },
        },
      },
    ],
  },
  {
    id: 'char-request-piek',
    title: 'Piek Wants a Bigger Residence in Aureth',
    category: 'foreign',
    actor: 'piek',
    faction: 'grey',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'The Foreign Minister would like the embassy residence in the Aureth capital replaced with a larger one. "Appearances matter in diplomacy," says Piek, who is wearing his eleventh identical navy suit.\n\nThe new residence costs $0.8 billion. It has a ballroom.',
    options: [
      {
        id: 'buy',
        label: 'Buy the residence.',
        hint: 'Cost: $0.8B. Piek is delighted. The ballroom will be in the newspapers.',
        outcome: {
          text: 'The residence is bought. Piek hosts a dinner for two hundred in the ballroom within a week. Aureth\'s newspapers print the menu.',
          tone: 'mixed',
          effects: {
            stats: { treasury: -0.8, legitimacy: -1 },
            hidden: { foreign: -2 },
            characters: { piek: { loyalty: 11 } },
          },
        },
      },
      {
        id: 'renovate',
        label: 'Renovate the old one instead.',
        hint: 'Cost: $0.2B. Sensible. Piek calls it "adequate" in a tone that means not.',
        outcome: {
          text: 'The old residence gets new curtains and a repainted hall. Piek describes it to everyone as "adequate".',
          tone: 'neutral',
          effects: {
            stats: { treasury: -0.2 },
            characters: { piek: { loyalty: 1 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Refuse. The country has other priorities.',
        hint: 'Free. Popular if anyone finds out. Piek will find somewhere else to feel appreciated.',
        outcome: {
          text: 'Piek accepts the refusal gracefully and spends the next three evenings at the Aureth embassy, where people appreciate him.',
          tone: 'bad',
          effects: {
            characters: { piek: { loyalty: -8, plotting: 4 } },
          },
        },
      },
    ],
  },
  {
    id: 'char-request-kostyn',
    title: 'Kostyn Wants a Fuel Discount for Farmers',
    category: 'economy',
    actor: 'kostyn',
    faction: 'provinces',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Governor Kostyn wants farm diesel in the Kordiva Basin exempted from fuel tax for the harvest. It would cost the treasury about $0.25 billion a day for six days.\n\nShe has brought a jar of honey. It is numbered.',
    options: [
      {
        id: 'yes',
        label: 'Grant the fuel exemption.',
        hint: 'Cost: $0.25B a day for 6 days. The Basin is grateful. Other regions ask why they were not included.',
        outcome: {
          text: 'The exemption is announced. The harvest goes well. Kostyn thanks you on regional television, by name, twice.',
          tone: 'good',
          effects: {
            commitments: [{ label: 'Basin farm diesel exemption', perDay: 0.25, days: 6 }],
            hidden: { separatism: -3 },
            factions: { provinces: { loyalty: 5 } },
            characters: { kostyn: { loyalty: 10 } },
          },
        },
      },
      {
        id: 'all',
        label: 'Grant it to every region, not just the Basin.',
        hint: 'Cost: $0.4B a day for 6 days. Fair and expensive. Kostyn loses the credit.',
        outcome: {
          text: 'Every farmer in the country gets cheaper diesel. Kostyn\'s announcement is lost among five others.',
          tone: 'mixed',
          effects: {
            commitments: [{ label: 'National farm diesel exemption', perDay: 0.4, days: 6 }],
            stats: { support: 3 },
            factions: { provinces: { loyalty: 4 } },
            characters: { kostyn: { loyalty: -2 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Refuse. The treasury cannot afford it.',
        hint: 'Free. Sound finances. The Basin hears that the capital said no.',
        outcome: {
          text: 'Kostyn takes her honey back. That evening, the Basin\'s radio station leads with "Capital refuses farmers".',
          tone: 'bad',
          effects: {
            hidden: { separatism: 3 },
            characters: { kostyn: { loyalty: -8 } },
          },
        },
      },
    ],
  },
  {
    id: 'char-request-adamek',
    title: 'Adamek Wants You at the Cup Final',
    category: 'person',
    actor: 'adamek',
    faction: 'concord',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Rulf Adamek\'s football club is in the cup final on Sunday. He wants you in his box, next to him, for the whole match. The cameras will be on the box at every goal.\n\nHe has not written a number on a card this time. That is almost more worrying.',
    options: [
      {
        id: 'go',
        label: 'Go and sit next to him.',
        hint: 'Free. The Elites see you as one of them. So does everyone else.',
        outcome: {
          text: 'His club wins 2–1. The photo of you both celebrating is on every front page. The business pages are delighted. The others are not.',
          tone: 'mixed',
          effects: {
            stats: { elite: 4, legitimacy: -2 },
            factions: { concord: { loyalty: 5 }, chorus: { loyalty: -3 } },
            characters: { adamek: { loyalty: 10 } },
            flags: { satWithAdamek: 1 },
          },
        },
      },
      {
        id: 'stands',
        label: 'Go, but sit in the public stands.',
        hint: 'Free. The public likes it. Adamek does not like empty seats next to him.',
        outcome: {
          text: 'You watch the match with ten thousand fans and a scarf someone gives you. The seat next to Adamek stays empty for ninety minutes.',
          tone: 'mixed',
          effects: {
            stats: { support: 3 },
            characters: { adamek: { loyalty: -4 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Decline. You have work to do.',
        hint: 'Free. Nobody sees you with him. Adamek notices you had better things to do.',
        outcome: {
          text: 'Adamek watches alone. His club wins. He does not mention you in his speech.',
          tone: 'neutral',
          effects: {
            characters: { adamek: { loyalty: -6 } },
          },
        },
      },
    ],
  },
  {
    id: 'char-request-vel',
    title: 'Vel Wants the 1961 Archive Opened',
    category: 'policy',
    actor: 'vel',
    faction: 'chorus',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Sanna Vel wants parliament\'s archive from 1961 opened to the public. That was the year the Council of the Republic last removed a head of state. The files have been sealed ever since.\n\n"History belongs to the country," she says. She also knows what is in them.',
    options: [
      {
        id: 'open',
        label: 'Open the archive.',
        hint: 'Free. A big gesture of openness. The files explain exactly how to remove a head of state.',
        outcome: {
          text: 'The archive opens. Historians are thrilled. The most-read document, by a wide margin, is the procedure for removing a head of state.',
          tone: 'mixed',
          effects: {
            stats: { legitimacy: 5 },
            hidden: { scandal: 2 },
            factions: { chorus: { loyalty: 5 } },
            characters: { vel: { loyalty: 10, trust: 6 } },
            regime: { reform: 2 },
            flags: { archiveOpened: 1 },
          },
        },
      },
      {
        id: 'part',
        label: 'Open everything except the removal papers.',
        hint: 'Free. Mostly open. Vel will tell everyone which part you kept closed.',
        outcome: {
          text: 'Most of the archive opens. Vel\'s first question at the press conference is about the part that did not.',
          tone: 'mixed',
          effects: {
            stats: { legitimacy: 1 },
            characters: { vel: { loyalty: -3 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Keep the archive sealed.',
        hint: 'Free. Nothing changes. Vel reads your refusal out on her stream.',
        outcome: {
          text: 'The archive stays sealed. Vel reads your letter aloud to two hundred thousand viewers, slowly.',
          tone: 'bad',
          effects: {
            stats: { legitimacy: -2 },
            characters: { vel: { loyalty: -8 } },
          },
        },
      },
    ],
  },
  {
    id: 'char-request-loz',
    title: 'Loz Wants an Exclusive Interview',
    category: 'opportunity',
    actor: 'loz',
    faction: 'concord',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Dmitar Loz wants an hour-long interview with you for Channel Seven, at seven o\'clock on Sunday. No other channel, no preview of the questions.\n\nHe takes the best chair in your office while he asks.',
    options: [
      {
        id: 'yes',
        label: 'Agree to the interview, no conditions.',
        hint: 'Free. A big audience. Loz controls the edit.',
        outcome: {
          text: 'The interview is tough but fair, mostly. Sixty per cent of the country watches. Loz is pleased with the ratings and, for now, with you.',
          tone: 'good',
          effects: {
            stats: { support: 3 },
            characters: { loz: { loyalty: 9 } },
          },
        },
      },
      {
        id: 'live',
        label: 'Agree, but only if it goes out live.',
        hint: 'Free. He cannot edit it. He does not like that.',
        outcome: {
          text: 'The interview goes out live. You get your answers across, word for word. Loz sulks in the studio gallery.',
          tone: 'mixed',
          effects: {
            stats: { legitimacy: 2, support: 1 },
            characters: { loz: { loyalty: -2 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Decline.',
        hint: 'Free. You avoid the risk. Channel Seven\'s coverage cools.',
        outcome: {
          text: 'Loz leaves the best chair and says, "Another time." The next week of Channel Seven coverage is noticeably colder.',
          tone: 'bad',
          effects: {
            stats: { support: -2 },
            characters: { loz: { loyalty: -7 } },
          },
        },
      },
    ],
  },
  {
    id: 'char-request-hess',
    title: 'Hess Asks You to Come to Gorsk',
    category: 'person',
    actor: 'hess',
    faction: 'combine',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Two miners died at the Number Six shaft on Monday. Hess wants you at the funeral in Gorsk on Thursday. No cameras, no speech.\n\n"Just come," he says, standing, as always.',
    options: [
      {
        id: 'go',
        label: 'Go to Gorsk. No cameras.',
        hint: 'Free. A lost day. The miners will talk about it for a long time.',
        outcome: {
          text: 'You stand at the back of a cold chapel for an hour. Nobody photographs it. Hess shakes your hand afterwards, twice, which he has never done.',
          tone: 'good',
          effects: {
            stats: { power: -1 },
            factions: { combine: { loyalty: 6 } },
            characters: { hess: { loyalty: 12, trust: 8 } },
            flags: { wentToGorsk: 1 },
          },
        },
      },
      {
        id: 'cameras',
        label: 'Go, and bring the press.',
        hint: 'Free. Good coverage. Hess asked you not to.',
        outcome: {
          text: 'The funeral is on the evening news. You look sincere. Hess looks at the cameras and then at you, and says nothing at all.',
          tone: 'mixed',
          effects: {
            stats: { support: 3 },
            characters: { hess: { loyalty: -5, trust: -6 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Send a wreath.',
        hint: 'Free. Polite. Hess notices you were not there.',
        outcome: {
          text: 'The wreath arrives on time. It is very large. Hess leaves it by the door.',
          tone: 'bad',
          effects: {
            factions: { combine: { loyalty: -3 } },
            characters: { hess: { loyalty: -8 } },
          },
        },
      },
    ],
  },
  {
    id: 'char-request-grebs',
    title: 'Grebs Needs a New Records Building',
    category: 'decision',
    actor: 'grebs',
    faction: 'grey',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Ilyana Grebs\'s famous locked room is full. She wants a proper records building: fireproof, climate-controlled, with a single key. It would cost $1.0 billion.\n\n"Every government has wanted to lose a file," she says. "I would like to make it harder."',
    options: [
      {
        id: 'build',
        label: 'Build it.',
        hint: 'Cost: $1.0B. The civil service loves it. Your own old files will be very safe.',
        outcome: {
          text: 'Work starts in a month. Grebs visits the site every morning. The civil service works noticeably faster, out of sheer goodwill.',
          tone: 'good',
          effects: {
            stats: { treasury: -1, power: 2 },
            factions: { grey: { loyalty: 6 } },
            characters: { grebs: { loyalty: 11 } },
          },
        },
      },
      {
        id: 'digital',
        label: 'Digitise the records instead.',
        hint: 'Cost: $0.4B. Cheaper and modern. Grebs does not trust anything she cannot lock.',
        outcome: {
          text: 'A contractor starts scanning. Grebs watches them with open suspicion and keeps paper copies of the scans.',
          tone: 'mixed',
          effects: {
            stats: { treasury: -0.4 },
            characters: { grebs: { loyalty: -2 } },
            regime: { technocracy: 1 },
          },
        },
      },
      {
        id: 'no',
        label: 'Not this year.',
        hint: 'Free. The money stays. The civil service gets slower.',
        outcome: {
          text: 'Grebs says "not this year" back to you, exactly, and leaves. Your next three decrees come back with questions.',
          tone: 'bad',
          effects: {
            stats: { power: -2 },
            characters: { grebs: { loyalty: -8 } },
          },
        },
      },
    ],
  },
  {
    id: 'char-request-tern',
    title: 'Tern Wants the Garrison Paid Early',
    category: 'security',
    actor: 'tern',
    faction: 'staff',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Commander Tern would like the capital garrison paid a week early, before the Dovra Day holiday, "so the men can take their families somewhere". It would cost $0.6 billion this week.\n\nHe sends a handwritten note to say thank you in advance.',
    options: [
      {
        id: 'pay',
        label: 'Pay the garrison early.',
        hint: 'Cost: $0.6B. The garrison is happy. The rest of the army asks why the capital comes first.',
        outcome: {
          text: 'The garrison gets paid on Monday. Tern sends a second note. The other regiments send a formal query.',
          tone: 'mixed',
          effects: {
            stats: { treasury: -0.6 },
            hidden: { coup: -3 },
            factions: { staff: { loyalty: 2 } },
            characters: { tern: { loyalty: 10 } },
          },
        },
      },
      {
        id: 'bonus',
        label: 'Give the whole army a small holiday bonus instead.',
        hint: 'Cost: $1.2B. Fair to everyone. Tern gets less than he asked for.',
        outcome: {
          text: 'Every soldier gets a small bonus. The army is pleased. Tern\'s note is shorter.',
          tone: 'good',
          effects: {
            stats: { treasury: -1.2, military: 3 },
            factions: { staff: { loyalty: 5 } },
            characters: { tern: { loyalty: 2 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Pay on the normal day.',
        hint: 'Free. By the book. The garrison has a quiet holiday.',
        outcome: {
          text: 'The garrison is paid on the normal day. Tern writes a note anyway. It is polite and very short.',
          tone: 'neutral',
          effects: {
            characters: { tern: { loyalty: -7 } },
          },
        },
      },
    ],
  },
  {
    id: 'char-request-vask',
    title: 'Vask Wants Communion Day Made a Holiday',
    category: 'policy',
    actor: 'vask',
    faction: 'provinces',
    tags,
    base: 0,
    weight: never,
    once: true,
    body:
      'Petru Vask would like the founding day of the Salt Communion made a national holiday. It would close offices and factories for a day and cost the economy about $0.7 billion.\n\n"I would not presume to ask," he says. He is asking.',
    options: [
      {
        id: 'yes',
        label: 'Make it a national holiday.',
        hint: 'Cost: $0.7B. The provinces are delighted. The capital calls it a day off for the church.',
        outcome: {
          text: 'The holiday is announced. The countryside celebrates. The capital\'s newspapers print the cost on the front page.',
          tone: 'mixed',
          effects: {
            stats: { treasury: -0.7, legitimacy: 2 },
            factions: { provinces: { loyalty: 6 }, chorus: { loyalty: -2 } },
            characters: { vask: { loyalty: 11 } },
          },
        },
      },
      {
        id: 'regional',
        label: 'Make it a holiday in the provinces only.',
        hint: 'Cost: $0.3B. A compromise. Vask would want to reflect on it.',
        outcome: {
          text: 'Vask reflects for a day and accepts. The provinces get their holiday. The capital works.',
          tone: 'good',
          effects: {
            stats: { treasury: -0.3 },
            factions: { provinces: { loyalty: 3 } },
            characters: { vask: { loyalty: 4 } },
          },
        },
      },
      {
        id: 'no',
        label: 'Decline. The calendar is full enough.',
        hint: 'Free. No cost. Sunday\'s sermon will mention "forgotten days".',
        outcome: {
          text: 'Sunday\'s sermon is about "the days a country forgets". Everybody in the provinces knows which one he means.',
          tone: 'bad',
          effects: {
            factions: { provinces: { loyalty: -3 } },
            characters: { vask: { loyalty: -8 } },
          },
        },
      },
    ],
  },
];

export const requestId = (character: string) => `char-request-${character}`;
