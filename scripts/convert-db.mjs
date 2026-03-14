#!/usr/bin/env node
/**
 * convert-db.mjs
 *
 * Reads GDScript database files and regenerates their TypeScript counterparts.
 * Run whenever you update a Godot source file:
 *
 *   npm run convert-db           ← converts all 3 databases
 *   npm run convert-cards        ← converts CardDatabase only
 *   npm run convert-keywords     ← converts KeywordDatabase only
 *   npm run convert-vocabs       ← converts VocabDatabase only
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── Shared parse utilities ────────────────────────────────────────────────────

function extractBlock(content, marker) {
  const markerIdx = content.indexOf(marker);
  if (markerIdx === -1) throw new Error(`"${marker}" not found in source file`);

  let depth = 0;
  let inString = false;
  let escape = false;
  const startIdx = markerIdx + marker.length;

  for (let i = startIdx; i < content.length; i++) {
    const c = content[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (!inString) {
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) return content.slice(startIdx, i + 1); }
    }
  }
  throw new Error('Could not find closing brace of block');
}

function normalizeQuotes(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"') {
      out += c; i++;
      while (i < text.length) {
        if (text[i] === '\\') { out += text[i] + text[i + 1]; i += 2; }
        else if (text[i] === '"') { out += text[i]; i++; break; }
        else { out += text[i]; i++; }
      }
    } else if (c === "'") {
      out += '"'; i++;
      while (i < text.length) {
        if (text[i] === '\\') {
          const next = text[i + 1];
          out += next === "'" ? "'" : text[i] + next;
          i += 2;
        } else if (text[i] === "'") { out += '"'; i++; break; }
        else if (text[i] === '"') { out += '\\"'; i++; }
        else { out += text[i]; i++; }
      }
    } else {
      out += c; i++;
    }
  }
  return out;
}

function stripComments(text) {
  return text.split('\n').map(line => {
    let inStr = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inStr = !inStr;
      if (line[i] === '#' && !inStr) return line.slice(0, i).trimEnd();
    }
    return line;
  }).join('\n');
}

function removeTrailingCommas(text) {
  return text.replace(/,(\s*[}\]])/g, '$1');
}

function tsString(s) {
  if (s.includes("'")) return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  return `'${s}'`;
}

function tsValue(val) {
  if (val === null) return 'null';
  if (typeof val === 'boolean') return String(val);
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return tsString(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    return '[' + val.map(tsValue).join(', ') + ']';
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val);
    if (entries.length === 0) return '{}';
    return '{ ' + entries.map(([k, v]) => `${k}: ${tsValue(v)}`).join(', ') + ' }';
  }
  return String(val);
}

function parseGdDict(gdContent, marker, debugName) {
  let block = extractBlock(gdContent, marker);
  block = normalizeQuotes(block);
  block = stripComments(block);
  block = removeTrailingCommas(block);
  try {
    return JSON.parse(block);
  } catch (e) {
    const debugPath = join(ROOT, 'lib', `_${debugName}_debug.json`);
    writeFileSync(debugPath, block, 'utf8');
    console.error(`JSON parse error in ${debugName}: ${e.message}`);
    console.error(`Cleaned block written to lib/_${debugName}_debug.json`);
    process.exit(1);
  }
}

function buildEntries(data, transformEntry) {
  return Object.entries(data).map(([id, entry]) => {
    const transformed = transformEntry ? transformEntry(entry) : entry;
    const props = Object.entries(transformed)
      .map(([k, v]) => `    ${k}: ${tsValue(v)}`)
      .join(',\n');
    return `  ${id}: {\n${props},\n  }`;
  }).join(',\n');
}

// ── Database configurations ───────────────────────────────────────────────────

const DATABASES = {
  cards: {
    gdFile: 'lib/CardDatabase.gd',
    tsFile: 'lib/CardDatabase.ts',
    marker: 'const CARDS = ',
    dictName: 'CARDS',
    typeName: 'CardData',
    interfaceDef: `export interface CardData {
  Name: string;
  Region: string[];
  Type: 'Champion' | 'Follower' | 'Landmark';
  SubType: string;
  Collectible: boolean;
  Sprite: string;
  Level?: number;
  Cost: number;
  Power?: number;
  Keyword: string[];
  Skill: string;
  LevelUp?: string;
  LevelUpTo?: string | null;
  AbilityType?: string;
  BalanceValues?: Record<string, number>;
  PreviewTooltip?: string[];
}`,
    helpers: `
// ── Helpers ───────────────────────────────────────────────────────────────────

export type CollectibleCard = { id: string } & CardData;

export function getCollectibleCards(): CollectibleCard[] {
  return Object.entries(CARDS)
    .filter(([, data]) => data.Collectible)
    .map(([id, data]) => ({ id, ...data }));
}

export function getAllRegions(): string[] {
  const regions = new Set<string>();
  for (const card of Object.values(CARDS)) {
    for (const r of card.Region) regions.add(r);
  }
  return Array.from(regions).sort();
}

/** Convert Godot asset path to web public path */
export function toWebSpritePath(godotPath: string): string {
  return godotPath.replace('res://Assets/', '/');
}

/**
 * Returns all cards related to the given card (excluding the card itself).
 * Related = other levels in the champion chain (via LevelUpTo) + PreviewTooltip cards.
 * Ordered: champion levels by chain order, then PreviewTooltip extras.
 */
export function getRelatedCards(cardId: string): CollectibleCard[] {
  const card = CARDS[cardId];
  if (!card) return [];

  const related: CollectibleCard[] = [];
  const seen = new Set<string>([cardId]);

  // Find root of the champion level chain by walking backward
  let root = cardId;
  const visited = new Set<string>([cardId]);
  for (const [id, data] of Object.entries(CARDS)) {
    if (data.LevelUpTo === cardId && !visited.has(id)) {
      let cur = id;
      while (true) {
        const predecessor = Object.entries(CARDS).find(([pid, pd]) => pd.LevelUpTo === cur && !visited.has(pid));
        if (!predecessor) { root = cur; break; }
        visited.add(predecessor[0]);
        cur = predecessor[0];
      }
      break;
    }
  }

  // Walk forward from root via LevelUpTo
  const chain: string[] = [root];
  let cur: string | null = root;
  while (cur) {
    const next: string | null = CARDS[cur]?.LevelUpTo ?? null;
    if (!next || seen.has(next)) break;
    chain.push(next);
    seen.add(next);
    cur = next;
  }

  // Add all chain members except the queried card
  for (const id of chain) {
    if (id !== cardId && CARDS[id]) {
      related.push({ id, ...CARDS[id] });
    }
  }

  // Add PreviewTooltip cards not already included
  for (const tooltipId of card.PreviewTooltip ?? []) {
    if (!seen.has(tooltipId) && CARDS[tooltipId]) {
      seen.add(tooltipId);
      related.push({ id: tooltipId, ...CARDS[tooltipId] });
    }
  }

  return related;
}`,
  },

  keywords: {
    gdFile: 'lib/KeywordDatabase.gd',
    tsFile: 'lib/KeywordDatabase.ts',
    marker: 'const KEYWORDS = ',
    dictName: 'KEYWORDS',
    typeName: 'KeywordData',
    interfaceDef: `export interface KeywordData {
  Description: string;
  Sprite: string;
  Stackable: boolean;
  Generatable: boolean;
  Transferable: boolean;
  Positive: boolean;
}`,
    // Convert Godot asset path to web path at generation time
    transformEntry: (entry) => ({
      ...entry,
      Sprite: entry.Sprite.replace('res://Assets/', '/'),
    }),
    helpers: '',
  },

  vocabs: {
    gdFile: 'lib/VocabDatabase.gd',
    tsFile: 'lib/VocabDatabase.ts',
    marker: 'const VOCABS = ',
    dictName: 'VOCABS',
    typeName: 'VocabData',
    interfaceDef: `export interface VocabData {
  Description: string;
  Typo?: string[];
}`,
    helpers: '',
  },
};

// ── Runner ────────────────────────────────────────────────────────────────────

const onlyArg = process.argv.indexOf('--only');
const targets = onlyArg !== -1
  ? [process.argv[onlyArg + 1]]
  : Object.keys(DATABASES);

for (const name of targets) {
  const db = DATABASES[name];
  if (!db) {
    console.error(`Unknown database: "${name}". Valid names: ${Object.keys(DATABASES).join(', ')}`);
    process.exit(1);
  }

  const gdPath = join(ROOT, db.gdFile);
  const tsPath = join(ROOT, db.tsFile);
  const gdContent = readFileSync(gdPath, 'utf8');

  const data = parseGdDict(gdContent, db.marker, name);
  const entries = buildEntries(data, db.transformEntry);

  const output =
    `${db.interfaceDef}\n\nexport const ${db.dictName}: Record<string, ${db.typeName}> = {\n${entries},\n};`
    + (db.helpers ? `\n${db.helpers}\n` : '\n');

  writeFileSync(tsPath, output, 'utf8');
  console.log(`✓ ${db.tsFile} regenerated from ${db.gdFile} (${Object.keys(data).length} entries)`);
}
