// Utility functions for cleaning up expired data
// Separated from aiService to avoid circular dependencies

export const cleanupExpiredAIContent = (): void => {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    // Find all AI content keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("ai_content_")) {
        try {
          const storedData = localStorage.getItem(key);
          if (storedData) {
            const parsedData = JSON.parse(storedData);

            // Check if expired
            if (parsedData.expiresAt && now > parsedData.expiresAt) {
              keysToRemove.push(key);
              const expiresKey = `${key}_expires`;
              if (localStorage.getItem(expiresKey)) {
                keysToRemove.push(expiresKey);
              }
            }
          }
        } catch (parseError) {
          // If we can't parse it, remove it
          keysToRemove.push(key);
        }
      }
    }

    // Remove expired content
    if (keysToRemove.length > 0) {
      console.log(
        `Cleaning up ${keysToRemove.length} expired AI content items from localStorage`,
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error(
      "Error cleaning up expired AI content from localStorage:",
      error,
    );
  }
}; 