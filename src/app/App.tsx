import { env } from '@/config/env';

export function App() {
  return (
    <main>
      <h1>Northwind Supply</h1>
      <p>API: {env.VITE_API_URL}</p>
    </main>
  );
}
