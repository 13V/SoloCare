#!/usr/bin/env node
/**
 * PostToolUse Hook: Warn about console.log statements after edits
 *
 * Cross-platform (Windows, macOS, Linux).
 *
 * Scans the edited JS/TS file for console.log calls and warns with
 * line numbers so debug statements are caught before committing.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const MAX_STDIN = 1024 * 1024;
let data = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
  if (data.length < MAX_STDIN) {
    data += chunk.substring(0, MAX_STDIN - data.length);
  }
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path;

    if (filePath && /\.(ts|tsx|js|jsx)$/.test(filePath)) {
      let content;
      try {
        content = fs.readFileSync(path.resolve(filePath), 'utf8');
      } catch {
        process.stdout.write(data);
        process.exit(0);
      }

      const lines = content.split('\n');
      const matches = [];

      lines.forEach((line, idx) => {
        // Skip commented-out lines
        const trimmed = line.trim();
        if (!trimmed.startsWith('//') && !trimmed.startsWith('*') && /console\.log/.test(line)) {
          matches.push((idx + 1) + ': ' + trimmed);
        }
      });

      if (matches.length > 0) {
        console.error('[Hook] WARNING: console.log found in ' + filePath);
        matches.slice(0, 5).forEach(m => console.error(m));
        if (matches.length > 5) {
          console.error('[Hook] ... and ' + (matches.length - 5) + ' more');
        }
        console.error('[Hook] Remove console.log before committing. Use a proper logger instead.');
      }
    }
  } catch {
    // Invalid input — pass through
  }

  process.stdout.write(data);
  process.exit(0);
});
