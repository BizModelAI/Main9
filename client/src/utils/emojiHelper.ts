// Utility to handle emojis safely and prevent corruption issues

/**
 * Safe emoji constants to prevent corruption
 * Use these instead of copying emojis directly in code
 */
export const SAFE_EMOJIS = {
  // Common business/UI emojis
  money: "�",
  chart: "�",
  target: "�",
  rocket: "�",
  check: "✅",
  warning: "⚠️",
  lightbulb: "�",
  tools: "�️",
  muscle: "�",
  brain: "�",
  star: "⭐",
  trophy: "�",

  // Business model emojis
  laptop: "�",
  mobile: "�",
  briefcase: "�",
  link: "�",
  video: "�",
  home: "�",
  art: "�",
  package: "�",

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
    /\uFFFD\uFFFD+/g, // Replacement characters
    /\uFFFD/g, // Single replacement character
    /\uFFFD/g, // Unicode replacement character
    /\u00EF\u00BF\u00BD/g, // UTF-8 replacement character sequence
    /[\uD800-\uDFFF](?![\uD800-\uDFFF])/g, // Unpaired surrogates
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, // Control characters
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
    .replace(/\uFFFD\uFFFD+/g, "") // Remove replacement character sequences
    .replace(/\uFFFD/g, "") // Remove single replacement characters
    .replace(/\uFFFD/g, "") // Remove unicode replacement characters
    .replace(/\u00EF\u00BF\u00BD/g, "") // Remove UTF-8 replacement sequence
    .replace(/[\uD800-\uDFFF](?![\uD800-\uDFFF])/g, "") // Remove unpaired surrogates
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .trim(); // Remove any resulting whitespace
}

/**
 * Safely get emoji by key
 * @param key - Key from SAFE_EMOJIS
 * @returns The emoji or empty string if not found
 */
export function getSafeEmoji(key: keyof typeof SAFE_EMOJIS): string {
  return SAFE_EMOJIS[key] || "";
}

/**
 * Automatically detect and fix corrupted emojis in text
 * @param text - Text that may contain corrupted emojis
 * @param fallbackEmoji - Emoji to use as replacement for corrupted ones
 * @returns Text with corrupted emojis fixed
 */
export function autoFixCorruptedEmojis(
  text: string,
  fallbackEmoji = "",
): string {
  if (validateEmojis(text)) {
    return text; // No corruption detected
  }

  // Log corruption for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.warn("Emoji corruption detected and fixed:", {
      original: text,
      cleaned: cleanCorruptedEmojis(text),
    });
  }

  const cleaned = cleanCorruptedEmojis(text);
  return fallbackEmoji && cleaned !== text ? cleaned + fallbackEmoji : cleaned;
}

/**
 * Check if the current environment supports proper emoji encoding
 * @returns true if environment is properly configured for emojis
 */
export function checkEmojiSupport(): boolean {
  try {
    // Test basic emoji encoding/decoding
    const testEmoji = "�";
    const encoded = JSON.stringify(testEmoji);
    const decoded = JSON.parse(encoded);

    // Test if emoji survives round-trip
    return decoded === testEmoji && testEmoji.length === 2; // Most emojis are 2 code units
  } catch (error) {
    console.warn("Emoji encoding test failed:", error);
    return false;
  }
}

/**
 * Safe emoji template literal tag for preventing corruption
 * @param strings - Template literal strings
 * @param values - Template literal values
 * @returns Safely processed string with validated emojis
 */
export function safeEmoji(
  strings: TemplateStringsArray,
  ...values: any[]
): string {
  let result = "";

  for (let i = 0; i < strings.length; i++) {
    result += autoFixCorruptedEmojis(strings[i]);
    if (i < values.length) {
      const value = values[i];
      result +=
        typeof value === "string"
          ? autoFixCorruptedEmojis(value)
          : String(value);
    }
  }

  return result;
}

/**
 * Initialize emoji corruption prevention system
 * Call this once in your app initialization
 */
export function initializeEmojiSafeguards(): void {
  // Check environment support
  if (!checkEmojiSupport()) {
    console.warn(
      "Environment may not properly support emoji encoding. Corruption may occur.",
    );
  }

  // Set up global error handler for emoji-related issues
  if (typeof window !== "undefined") {
    const originalConsoleWarn = console.warn;
    console.warn = function (...args) {
      const message = args.join(" ");
      if (message.includes("") || message.includes("\uFFFD")) {
        originalConsoleWarn("[EMOJI CORRUPTION DETECTED]", ...args);
        originalConsoleWarn(
          "Consider using SAFE_EMOJIS constants or autoFixCorruptedEmojis()",
        );
      } else {
        originalConsoleWarn(...args);
      }
    };
  }

  // Log initialization
  if (process.env.NODE_ENV === "development") {
    console.log(
      "Emoji safeguards initialized. Use SAFE_EMOJIS constants to prevent corruption.",
    );
  }
}
