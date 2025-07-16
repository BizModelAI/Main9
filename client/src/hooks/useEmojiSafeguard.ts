import { useMemo } from 'react';
import { 
  fixCorruptedEmoji, 
  getSafeEmoji, 
  isValidEmoji,
  BUSINESS_MODEL_EMOJIS 
} from '../utils/emojiHelper';

/**
 * Hook to safely handle emojis in React components
 */
export function useEmojiSafeguard() {
  const safeEmojis = useMemo(() => {
    // Create a safe version of the emoji mappings
    const safe: Record<string, string> = {};
    
    Object.entries(BUSINESS_MODEL_EMOJIS).forEach(([id, emoji]) => {
      safe[id] = fixCorruptedEmoji(emoji, id);
    });
    
    return safe;
  }, []);

  const getSafeEmojiForBusiness = (businessId: string): string => {
    return safeEmojis[businessId] || getSafeEmoji(businessId);
  };

  const validateAndFixEmoji = (emoji: string, businessId?: string): string => {
    return fixCorruptedEmoji(emoji, businessId);
  };

  const isEmojiValid = (emoji: string): boolean => {
    return isValidEmoji(emoji);
  };

  return {
    getSafeEmojiForBusiness,
    validateAndFixEmoji,
    isEmojiValid,
    safeEmojis,
  };
}

/**
 * Hook to safely handle emojis for a specific business model
 */
export function useBusinessEmoji(businessId: string) {
  const { getSafeEmojiForBusiness, validateAndFixEmoji } = useEmojiSafeguard();
  
  const safeEmoji = useMemo(() => {
    return getSafeEmojiForBusiness(businessId);
  }, [businessId, getSafeEmojiForBusiness]);

  const getEmojiWithFallback = (customEmoji?: string): string => {
    if (customEmoji) {
      return validateAndFixEmoji(customEmoji, businessId);
    }
    return safeEmoji;
  };

  return {
    emoji: safeEmoji,
    getEmojiWithFallback,
    validateEmoji: (emoji: string) => validateAndFixEmoji(emoji, businessId),
  };
} 