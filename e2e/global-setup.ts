import { execSync } from 'node:child_process';
import { API_URL } from './env';

/**
 * Resets the API's database to its deterministic seed before the run, then waits until the API
 * reports ready. The seed command differs per environment:
 *   - local:  npm --prefix ../ecommerce-api run db:seed   (default)
 *   - CI:     docker compose ... --profile seed run --rm seed   (set E2E_SEED_COMMAND)
 * Set E2E_SKIP_SEED=1 to run against the current data.
 */
export default async function globalSetup() {
  if (!process.env.E2E_SKIP_SEED) {
    const command = process.env.E2E_SEED_COMMAND ?? 'npm --prefix ../ecommerce-api run db:seed';
    console.log(`[e2e] seeding: ${command}`);
    execSync(command, { stdio: 'inherit' });
  }

  const deadline = Date.now() + 60_000;
  for (;;) {
    try {
      const response = await fetch(`${API_URL}/health/ready`);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) throw new Error(`[e2e] API not ready at ${API_URL}/health/ready`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
