/** Reproducible strategy measurements without running the unit suite.
 * node tools/strategy-runner.mjs --n=400 --skill=.9 --policies=adaptive --out=/tmp/baseline.json
 * node tools/strategy-runner.mjs --n=400 --skill=.5 --offset=10000 --policies=adaptive,random
 * Add --management=false for a purchases/favours/demands ablation.
 * Add --aftermath=stress for synthetic harsh Budget losses and score70
 * Ambassador wins; this is a sensitivity assumption, not human data.
 */
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=');
  return [key, value.join('=')];
}));
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { strategyProbe, STRATEGY_POLICIES } = await server.ssrLoadModule('/src/game/__tests__/strategy.probe.ts');
  const { MANDATES } = await server.ssrLoadModule('/src/game/content/mandates.ts');
  const n = Number(args.n ?? 400);
  const skill = Number(args.skill ?? .9);
  const offset = Number(args.offset ?? 0);
  const aftermath = args.aftermath ?? 'standard';
  if (!['standard', 'stress'].includes(aftermath)) throw new Error('Unknown aftermath setting');
  if (!Number.isInteger(n) || n < 1 || !Number.isInteger(offset) || offset < 0 || skill < 0 || skill > 1) throw new Error('Invalid n, skill or offset');
  const policies = args.policies?.split(',') ?? STRATEGY_POLICIES;
  const mandates = args.mandates?.split(',') ?? MANDATES.map((m) => m.id);
  if (policies.some((p) => !STRATEGY_POLICIES.includes(p))) throw new Error('Unknown policy');
  if (mandates.some((id) => !MANDATES.some((m) => m.id === id))) throw new Error('Unknown mandate');
  const report = {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    generatedAt: new Date().toISOString(),
    note: aftermath === 'stress'
      ? 'Synthetic sensitivity assumption, NOT measured human performance: Budget losses have two day/act-rotating walkouts $4B short each, wins have neutral jars; Ambassador wins score70, losses0. Scripted learned policies, full catalogue unlocked; fixed expected outcome samples, pressure warning bands, no future run RNG; skills are Bernoulli macro outcomes.'
      : 'Scripted learned policies, full catalogue unlocked; fixed expected outcome samples, pressure warning bands, no future run RNG. Legacy-careful retains the old oracle. Skill is a Bernoulli result approximation, not actual minigame play: generic wins omit Budget Night jar aftermath and Ambassador price-tier flags.',
    results: [],
  };
  for (const mandateId of mandates) {
    for (const policy of policies) {
      const result = strategyProbe({ n, mandateId, policy, minigameSkill: skill, seedOffset: offset, management: args.management !== 'false', aftermath });
      report.results.push(result);
      console.log(JSON.stringify({ ...result, choices: undefined, purchases: undefined }));
      // Checkpoint after each cell: large matrices survive interruption.
      if (args.out) writeFileSync(args.out, `${JSON.stringify(report, null, 2)}\n`);
    }
  }
} finally {
  await server.close();
}
