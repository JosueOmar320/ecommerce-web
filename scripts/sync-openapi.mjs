/**
 * Copies the backend's OpenAPI contract into this repo.
 *
 *   npm run api:sync                       # from ../ecommerce-api/openapi.json (sibling checkout)
 *   npm run api:sync -- <path-or-url>      # any file path, or a running API: http://localhost:3000/api/docs/json
 *
 * Then `npm run api:generate` turns it into TypeScript types (src/api/schema.ts).
 * Both files are committed: API changes show up in code review, and CI fails if they drift.
 */
import { readFile, writeFile } from 'node:fs/promises';

const source = process.argv[2] ?? '../ecommerce-api/openapi.json';
const raw = /^https?:\/\//.test(source)
  ? await fetch(source).then((res) => {
      if (!res.ok) throw new Error(`GET ${source} → ${res.status}`);
      return res.text();
    })
  : await readFile(source, 'utf8');

const spec = JSON.parse(raw);
if (!String(spec.openapi).startsWith('3.')) throw new Error('Not an OpenAPI 3 document');
await writeFile('openapi/openapi.json', `${JSON.stringify(spec, null, 2)}\n`);
console.log(
  `openapi/openapi.json updated from ${source} (${Object.keys(spec.paths).length} paths)`,
);
