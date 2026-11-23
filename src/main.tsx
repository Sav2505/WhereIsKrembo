import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App.tsx';

const mainRoot = createRoot(document.getElementById('root')!);

mainRoot.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
