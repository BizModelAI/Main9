#!/usr/bin/env node

/**
 * Script to detect emoji corruption in the codebase
 * Run with: node scripts/check-emoji-corruption.js
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Corruption patterns to detect
const corruptionPatterns = [
  /\u{FFFD}\u{FFFD}+/gu, // Replacement characters
  /\u{FFFD}/gu, // Single replacement character
  /\u{EF}\u{BF}\u{BD}/gu, // UTF-8 replacement sequence
  /[\uD800-\uDFFF](?![\uD800-\uDFFF])/g, // Unpaired surrogates
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, // Control characters
];

// File extensions to check
const checkExtensions = [".js", ".jsx", ".ts", ".tsx", ".json", ".md"];

// Directories to skip
const skipDirs = ["node_modules", ".git", "dist", "build", ".next"];

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
    } else if (checkExtensions.includes(extname(entry))) {
      files.push({ path: fullPath, relative: relativePath });
    }
  }

  return files;
}

function checkFileForCorruption(filePath, relativePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const issues = [];

    const lines = content.split("\n");
    lines.forEach((line, lineNumber) => {
      corruptionPatterns.forEach((pattern, patternIndex) => {
        const matches = [...line.matchAll(pattern)];
        matches.forEach((match) => {
          issues.push({
            line: lineNumber + 1,
            column: match.index + 1,
            pattern: patternIndex,
            match: match[0],
            context: line.trim(),
          });
        });
      });
    });

    return issues;
  } catch (error) {
    console.warn(
      `Warning: Could not read file ${relativePath}:`,
      error.message,
    );
    return [];
  }
}

function main() {
  console.log("🔍 Checking for emoji corruption in codebase...\n");

  const projectRoot = join(__dirname, "..");
  const files = walkDirectory(projectRoot);

  let totalIssues = 0;
  const corruptedFiles = [];

  for (const file of files) {
    const issues = checkFileForCorruption(file.path, file.relative);

    if (issues.length > 0) {
      corruptedFiles.push({ file: file.relative, issues });
      totalIssues += issues.length;
    }
  }

  if (totalIssues === 0) {
    console.log("✅ No emoji corruption detected!");
    console.log(`Checked ${files.length} files.`);
  } else {
    console.log(
      `❌ Found ${totalIssues} emoji corruption issues in ${corruptedFiles.length} files:\n`,
    );

    corruptedFiles.forEach(({ file, issues }) => {
      console.log(`📄 ${file}:`);
      issues.forEach((issue) => {
        const patternNames = [
          "Multiple replacement chars",
          "Single replacement char",
          "UTF-8 replacement sequence",
          "Unpaired surrogate",
          "Control character",
        ];

        console.log(
          `  Line ${issue.line}:${issue.column} - ${patternNames[issue.pattern]}`,
        );
        console.log(`    Context: ${issue.context}`);
        console.log(`    Corrupted: "${issue.match}"`);
      });
      console.log("");
    });

    console.log("💡 Recommendations:");
    console.log(
      "   1. Use SAFE_EMOJIS constants from client/src/utils/emojiHelper.ts",
    );
    console.log("   2. Run autoFixCorruptedEmojis() on corrupted strings");
    console.log("   3. Ensure your editor saves files as UTF-8");
    console.log(
      "   4. Use the safeEmoji template literal tag for string literals",
    );

    process.exit(1);
  }
}

main();
