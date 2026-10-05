/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const REQUIRED_ENV = ['VITE_API_URL', 'VITE_SITE_URL'] as const;

export default defineConfig(({ command, mode }) => {
  // Fail the production build early and loudly instead of shipping a broken bundle.
  if (command === 'build') {
    const loaded = loadEnv(mode, process.cwd(), 'VITE_');
    const missing = REQUIRED_ENV.filter((name) => !loaded[name]);
    if (missing.length > 0) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
    test: {
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
      css: false,
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/**/*.d.ts', 'src/api/schema.ts'],
        reporter: ['text', 'html', 'json-summary'],
      },
    },
  };
});
