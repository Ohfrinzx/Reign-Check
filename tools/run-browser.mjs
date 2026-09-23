import { createServer } from 'vite';

// Keep the server and browser in one process tree, including isolated sandboxes.
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: true } });
try {
  await server.listen();
  const scripts = process.argv.slice(2);
  for (const name of scripts.length ? scripts : ['mandates', 'vote', 'demands', 'characters', 'crises', 'favours', 'hostile', 'consequences', 'verify', 'to-ending', 'playthrough']) {
    if (!['mandates', 'vote', 'demands', 'characters', 'crises', 'favours', 'hostile', 'consequences', 'verify', 'to-ending', 'playthrough', 'alert-shot', 'legacy', 'desktop-snap'].includes(name)) throw new Error(`Unknown check: ${name}`);
    await import(`./${name}.mjs`);
  }
} finally {
  await server.close();
}
