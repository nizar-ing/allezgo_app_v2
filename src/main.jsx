// src/main.jsx

import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.jsx';
import GlobalCacheListener from './components/GlobalCacheListener.jsx';
import './index.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime:           1000 * 60 * 5,  // 5 minutes — matches ApiClient cache TTL
            gcTime:              1000 * 60 * 10, // 10 minutes
            retry:               0,              // ApiClient handles retries (3 attempts, exponential backoff)
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <GlobalCacheListener />
                <App />
                {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        </BrowserRouter>
    </StrictMode>
);
