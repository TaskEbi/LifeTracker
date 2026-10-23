import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/instrument.css';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { applyTheme } from './app/theme';

document.body.classList.add('lt');
applyTheme();

createRoot(document.getElementById('root')!).render(<App />);

// Offline app shell + share target. Not in dev, where it would cache stale code.
if (import.meta.env.PROD && 'serviceWorker' in navigator) registerSW({ immediate: true });
