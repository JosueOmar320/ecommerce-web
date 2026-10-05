import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import { i18nReady } from '@/i18n';
import { App } from './app/App';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

// Render once the visitor's language is ready (immediate for English, one small chunk otherwise).
void i18nReady.then(() => {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
