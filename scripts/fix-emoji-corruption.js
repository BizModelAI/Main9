#!/usr/bin/env node

/**
 * Script to automatically fix emoji corruption in the codebase
 * Run with: node scripts/fix-emoji-corruption.js
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Corruption patterns to fix
const corruptionPatterns = [
  { pattern: /\u{FFFD}\u{FFFD}+/gu, replacement: "" },
  { pattern: /\u{FFFD}/gu, replacement: "" },
  { pattern: /\u{EF}\u{BF}\u{BD}/gu, replacement: "" },
  { pattern: /[\uD800-\uDFFF](?![\uD800-\uDFFF])/g, replacement: "" },
  { pattern: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, replacement: "" },
];

// File extensions to check
const checkExtensions = [".js", ".jsx", ".ts", ".tsx"];

// Directories to skip
const skipDirs = ["node_modules", ".git", "dist", "build", ".next"];

// Files to skip (don't modify these)
const skipFiles = ["check-emoji-corruption.js", "fix-emoji-corruption.js"];

function walkDirectory(dir, basePath = "") {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = join(basePath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!skipDirs.includes(entry)) {
        files.push(...walkDirectory(fullPath, relativePath));
      }
    } else if (
      checkExtensions.includes(extname(entry)) &&
      !skipFiles.includes(entry)
    ) {
      files.push({ path: fullPath, relative: relativePath });
    }
  }

  return files;
}

function fixFileCorruption(filePath, relativePath) {
  try {
    let content = readFileSync(filePath, "utf8");
    let modified = false;

    // Apply corruption fixes
    corruptionPatterns.forEach(({ pattern, replacement }) => {
      const originalContent = content;
      content = content.replace(pattern, replacement);
      if (content !== originalContent) {
        modified = true;
      }
    });

    // For script files, also remove emojis from console statements
    if (relativePath.startsWith("scripts/")) {
      const originalContent = content;

      // Remove emojis from console.log statements in scripts
      content = content.replace(
        /console\.(log|warn|error|info)\s*\(\s*["'`]([^"'`]*[🔍🚀📋🎉📝💡🔧📊📈🔄👋💥🗑️🧹].*?)["'`]/g,
        (match, method, message) => {
          // Remove all emojis from the message
          const cleanMessage = message
            .replace(
              /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
              "",
            )
            .trim();
          return `console.${method}("${cleanMessage}"`;
        },
      );

      if (content !== originalContent) {
        modified = true;
      }
    }

    if (modified) {
      writeFileSync(filePath, content, "utf8");
      return true;
    }

    return false;
  } catch (error) {
    console.warn(
      `Warning: Could not process file ${relativePath}:`,
      error.message,
    );
    return false;
  }
}

function main() {
  console.log("Fixing emoji corruption in codebase...\n");

  const projectRoot = join(__dirname, "..");
  const files = walkDirectory(projectRoot);

  let fixedFiles = 0;

  for (const file of files) {
    const wasFixed = fixFileCorruption(file.path, file.relative);

    if (wasFixed) {
      console.log(`Fixed: ${file.relative}`);
      fixedFiles++;
    }
  }

  if (fixedFiles === 0) {
    console.log("No files needed fixing.");
  } else {
    console.log(`\nFixed ${fixedFiles} files.`);
    console.log("\nRecommendations for preventing future corruption:");
    console.log(
      "   1. Use SAFE_EMOJIS constants from client/src/utils/emojiHelper.ts",
    );
    console.log("   2. Avoid emojis in console.log statements in scripts");
    console.log("   3. Ensure your editor saves files as UTF-8");
    console.log('   4. Run "npm run check-emoji-corruption" before commits');
  }
}

main();
