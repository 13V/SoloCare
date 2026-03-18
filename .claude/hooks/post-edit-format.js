#!/usr/bin/env node
/**
 * PostToolUse Hook: Auto-format JS/TS files after edits
 *
 * Detects Biome or Prettier and formats the edited file.
 * Cross-platform (Windows, macOS, Linux).
 */

'use strict';

const { execFileSync } = require('child_process');
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

    if (filePath && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) {
      const resolvedPath = path.resolve(filePath);
      if (!fs.existsSync(resolvedPath)) {
        process.stdout.write(data);
        process.exit(0);
      }

      // Find project root (where package.json lives)
      let dir = path.dirname(resolvedPath);
      const root = path.parse(dir).root;
      let depth = 0;
      while (dir !== root && depth < 20 && !fs.existsSync(path.join(dir, 'package.json'))) {
        dir = path.dirname(dir);
        depth++;
      }

      const isWin = process.platform === 'win32';

      // Prefer Biome if config exists
      const biomeConfig = fs.existsSync(path.join(dir, 'biome.json')) || fs.existsSync(path.join(dir, 'biome.jsonc'));
      const biomeBin = path.join(dir, 'node_modules', '.bin', isWin ? 'biome.cmd' : 'biome');
      const prettierBin = path.join(dir, 'node_modules', '.bin', isWin ? 'prettier.cmd' : 'prettier');

      if (biomeConfig && fs.existsSync(biomeBin)) {
        execFileSync(biomeBin, ['check', '--write', resolvedPath], {
          cwd: dir, stdio: 'ignore', timeout: 15000, shell: false,
        });
      } else if (fs.existsSync(prettierBin)) {
        execFileSync(prettierBin, ['--write', resolvedPath], {
          cwd: dir, stdio: 'ignore', timeout: 15000, shell: false,
        });
      } else {
        // Fallback: npx prettier
        const npxBin = isWin ? 'npx.cmd' : 'npx';
        execFileSync(npxBin, ['prettier', '--write', resolvedPath], {
          cwd: dir, stdio: 'ignore', timeout: 15000, shell: false,
        });
      }
    }
  } catch {
    // Formatting failure is non-fatal — pass through
  }

  process.stdout.write(data);
  process.exit(0);
});
