// Utility to handle emojis safely and prevent corruption issues

/**
 * Safe emoji constants to prevent corruption
 * Use these instead of copying emojis directly in code
 */
export const SAFE_EMOJIS = {
  // Common business/UI emojis
  money: "💰",
  chart: "📈",
  target: "🎯",
  rocket: "🚀",
  check: "✅",
  warning: "⚠️",
  lightbulb: "💡",
  tools: "🛠️",
  muscle: "💪",
  brain: "🧠",
  star: "⭐",
  trophy: "🏆",

  // Business model emojis
  laptop: "💻",
  mobile: "📱",
  briefcase: "💼",
  link: "🔗",
  video: "📹",
  home: "🏠",
  art: "🎨",
  package: "📦",

  // Status emojis
  success: "✅",
  error: "❌",
  loading: "⏳",
  info: "ℹ️",
} as const;

/**
 * Safely encode emoji for storage/transmission
 * @param emoji - The emoji to encode
 * @returns Base64 encoded emoji
 */
export function safeEncodeEmoji(emoji: string): string {
  try {
    return btoa(unescape(encodeURIComponent(emoji)));
  } catch (error) {
    console.warn("Failed to encode emoji:", emoji, error);
    return "";
  }
}

/**
 * Safely decode emoji from storage/transmission
 * @param encoded - Base64 encoded emoji
 * @returns Decoded emoji or empty string if failed
 */
export function safeDecodeEmoji(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch (error) {
    console.warn("Failed to decode emoji:", encoded, error);
    return "";
  }
}

/**
 * Validate that a string contains valid emojis
 * @param text - Text to validate
 * @returns true if emojis are valid, false if corrupted
 */
export function validateEmojis(text: string): boolean {
  // Check for common corruption patterns
  const corruptionPatterns = [
    /��+/g, // Replacement characters
    /�/g, // Single replacement character
    /\uFFFD/g, // Unicode replacement character
  ];

  return !corruptionPatterns.some((pattern) => pattern.test(text));
}

/**
 * Clean corrupted emojis from text
 * @param text - Text that may contain corrupted emojis
 * @returns Cleaned text
 */
export function cleanCorruptedEmojis(text: string): string {
  return text
    .replace(/��+/g, "") // Remove replacement character sequences
    .replace(/�/g, "") // Remove single replacement characters
    .replace(/\uFFFD/g, ""); // Remove unicode replacement characters
}

/**
 * Safely get emoji by key
 * @param key - Key from SAFE_EMOJIS
 * @returns The emoji or empty string if not found
 */
export function getSafeEmoji(key: keyof typeof SAFE_EMOJIS): string {
  return SAFE_EMOJIS[key] || "";
}
