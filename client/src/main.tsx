import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App';
import './index.css';

// Initialize emoji safeguards early
import { initializeEmojiSafeguards, cleanCorruptedEmojisFromStorage } from './utils/contentUtils';

// Initialize emoji corruption prevention
initializeEmojiSafeguards();

// Clean any existing corrupted emojis in localStorage
cleanCorruptedEmojisFromStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
