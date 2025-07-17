// Import emoji safeguarding utilities
import { cleanCorruptedEmojisFromStorage } from './emojiHelper';
import { businessModelService } from './businessModelService';

export function clearAllCaches() {
  console.log("🧹 Clearing all caches and localStorage data...");
  
  // Clear all localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear any cached data in memory
  if (window.caches) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  // Clear any service worker caches
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
  
  console.log("✅ All caches cleared successfully");
}

export function clearQuizRelatedCache() {
  console.log("🧹 Clearing quiz-related cache...");
  
  // Clear quiz-specific localStorage items
  const quizKeys = [
    'quizData',
    'quizDataTimestamp', 
    'quizDataExpires',
    'userEmail',
    'loadedReportData',
    'congratulationsShown',
    'aiContentCache',
    'businessModelScores'
  ];
  
  quizKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear in-memory business model cache
  businessModelService.clearCache();
  
  console.log("✅ Quiz-related cache cleared");
}

export function clearAIContentCache() {
  console.log("🧹 Clearing AI content cache...");
  
  // Clear AI-related localStorage items
  const aiKeys = [
    'aiContentCache',
    'aiReportData',
    'aiAnalysisData',
    'aiInsightsData'
  ];
  
  aiKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log("✅ AI content cache cleared");
}

export function clearBusinessModelScores() {
  console.log("🧹 Clearing business model scores...");
  
  localStorage.removeItem('businessModelScores');
  
  console.log("✅ Business model scores cleared");
}

export function cleanAndOptimizeStorage() {
  console.log("🧹 Cleaning and optimizing storage...");
  
  // Clean corrupted emojis
  cleanCorruptedEmojisFromStorage();
  
  // Clear expired data
  const now = Date.now();
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const data = JSON.parse(value);
        
        // Check for expiration timestamps
        if (data.expiresAt && data.expiresAt < now) {
          localStorage.removeItem(key);
          console.log(`🗑️ Removed expired data: ${key}`);
        }
        
        // Check for old timestamps (older than 30 days)
        if (data.timestamp && (now - data.timestamp) > (30 * 24 * 60 * 60 * 1000)) {
          localStorage.removeItem(key);
          console.log(`🗑️ Removed old data: ${key}`);
        }
      }
    } catch (e) {
      // Not JSON, skip
    }
  });
  
  console.log("✅ Storage cleaned and optimized");
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearAllCaches = clearAllCaches;
  (window as any).clearQuizRelatedCache = clearQuizRelatedCache;
  (window as any).clearAIContentCache = clearAIContentCache;
  (window as any).clearBusinessModelScores = clearBusinessModelScores;
  (window as any).cleanAndOptimizeStorage = cleanAndOptimizeStorage;
}
