import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { SettingsProvider } from './hooks/useSettings';
import { ConfirmProvider } from './hooks/useConfirm';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1_500,
    },
  },
});

// `<base href>` in index.ejs is set by the server adapter. Read it so the
// router builds links relative to whatever path the dashboard is mounted at.
const baseHref = document.querySelector('base')?.getAttribute('href') ?? '/';
const basename = baseHref.endsWith('/') ? baseHref.slice(0, -1) : baseHref;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ConfirmProvider>
          <BrowserRouter basename={basename || undefined}>
            <App />
          </BrowserRouter>
        </ConfirmProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
