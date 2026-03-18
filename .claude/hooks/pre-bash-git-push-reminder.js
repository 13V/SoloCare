#!/usr/bin/env node
/**
 * PreToolUse Hook: Remind to review changes before git push
 *
 * Cross-platform (Windows, macOS, Linux).
 *
 * Intercepts Bash tool calls containing `git push` and prints a reminder
 * to review the diff first. Does NOT block the push (exit 0).
 */

'use strict';

const MAX_STDIN = 1024 * 1024;
let raw = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (raw.length < MAX_STDIN) {
    raw += chunk.substring(0, MAX_STDIN - raw.length);
  }
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const cmd = String(input.tool_input?.command || '');

    if (/\bgit\s+push\b/.test(cmd)) {
      console.error('[Hook] Review changes before push:');
      console.error('[Hook]   git diff origin/main...HEAD');
      console.error('[Hook] Proceeding with push...');
    }
  } catch {
    // Ignore parse errors and pass through
  }

  process.stdout.write(raw);
});
