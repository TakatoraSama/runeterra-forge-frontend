'use client';

import { CSSProperties, ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { KEYWORDS } from '@/lib/KeywordDatabase';
import { VOCABS } from '@/lib/VocabDatabase';

export interface CardProps {
  name: string;
  cost: number;
  power?: number;
  subType?: string;
  skill?: string;
  levelUp?: string;
  keywords?: string[];
  regions?: string[];
  balanceValues?: Record<string, number>;
  artUrl?: string;
  isFaceDown?: boolean;
  isInDeck?: boolean;
  onClick?: () => void;
  width?: number | string;
  className?: string;
  layout?: 'full' | 'compact';
  type?: 'Champion' | 'Follower' | 'Landmark' | 'Spell';
}

// Build alias → canonical vocab key map from Typo arrays
const vocabAliasMap: Record<string, string> = {};
for (const [key, data] of Object.entries(VOCABS)) {
  for (const alias of data.Typo ?? []) {
    vocabAliasMap[alias.toLowerCase()] = key;
  }
}

function lookupDescription(name: string): string {
  if (VOCABS[name]) return VOCABS[name].Description;
  if (KEYWORDS[name]) return KEYWORDS[name].Description;
  const lower = name.toLowerCase();
  const vAlias = vocabAliasMap[lower];
  if (vAlias) return VOCABS[vAlias].Description;
  const kKey = Object.keys(KEYWORDS).find(k => k.toLowerCase() === lower);
  if (kKey) return KEYWORDS[kKey].Description;
  return '';
}

// Region name → sprite filename (no extension)
const regionSpriteMap: Record<string, string> = {
  'Demacia':       'Demacia',
  'Noxus':         'Noxus',
  'Freljord':      'Freljord',
  'Piltover':      'PiltoverZaun',
  'Piltover Zaun': 'PiltoverZaun',
  'Bilgewater':    'Bilgewater',
  'Ionia':         'Ionia',
  'Shadow Isles':  'ShadowIsles',
  'Shurima':       'Shurima',
  'Targon':        'Targon',
  'Bandle City':   'BandleCity',
  'Ixtal':         'Ixtal',
  'Void':          'Void',
  'Runeterra':     'Runeterra',
};

// Region fallback gradients
const regionGradients: Record<string, string> = {
  Demacia:        'linear-gradient(160deg, #3a4f6e 0%, #1e2e40 100%)',
  Noxus:          'linear-gradient(160deg, #5a1a1a 0%, #2e0a0a 100%)',
  Freljord:       'linear-gradient(160deg, #1a3a3a 0%, #0a2025 100%)',
  Piltover:       'linear-gradient(160deg, #4a3810 0%, #2a1e08 100%)',
  Bilgewater:     'linear-gradient(160deg, #0e3030 0%, #071a1a 100%)',
  Ionia:          'linear-gradient(160deg, #3a1a40 0%, #1e0a28 100%)',
  'Shadow Isles': 'linear-gradient(160deg, #0a2a1a 0%, #051510 100%)',
  Shurima:        'linear-gradient(160deg, #3a2a10 0%, #201508 100%)',
  Targon:         'linear-gradient(160deg, #1a1a3a 0%, #0a0a20 100%)',
  'Bandle City':  'linear-gradient(160deg, #3a2a10 0%, #1a1208 100%)',
  'Ixtal':        'linear-gradient(160deg, #1a3a10 0%, #0a2008 100%)',
  'Void':         'linear-gradient(160deg, #2a0a3a 0%, #15051e 100%)',
  'Runeterra':    'linear-gradient(160deg, #3a2810 0%, #1e1408 100%)',
};

// ─── Color helpers for spell card gradient ────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgbStr(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `rgb(${f(0)},${f(8)},${f(4)})`;
}

// Shared className for every full-card overlay PNG
const OVERLAY = "absolute inset-0 w-full h-full object-fill pointer-events-none select-none";

const BBCODE_TAGS = new Set([
  'b','i','u','s','code','p','center','left','right','fill','indent',
  'url','img','font','font_size','color','bgcolor','outline_size',
  'outline_color','table','cell','ul','ol','li','hint','dropcap',
  'opentype_features','lang','br','lb','rb',
]);

function isBBCodeTag(content: string): boolean {
  let tag = content.trim();
  if (!tag) return false;
  if (tag.startsWith('/')) tag = tag.slice(1);
  const eqIdx = tag.indexOf('=');
  if (eqIdx !== -1) tag = tag.slice(0, eqIdx);
  return BBCODE_TAGS.has(tag.toLowerCase());
}

/**
 * Mirrors Godot's CardDatabase.format_card_text:
 * - {key} → substitute balance value, or render gold
 * - [CardName] → render blue
 * - [br] → line break
 * Returns an HTML string for use with dangerouslySetInnerHTML.
 */
function formatCardText(text: string, balanceValues: Record<string, number> = {}): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];

    if (c === '[') {
      const close = text.indexOf(']', i + 1);
      if (close !== -1) {
        const content = text.slice(i + 1, close);
        if (content === 'br') {
          result += '<br/>';
        } else if (isBBCodeTag(content)) {
          result += text.slice(i, close + 1);
        } else {
          result += `<span style="color:#54a5ff">${content}</span>`;
        }
        i = close + 1;
        continue;
      }
    }

    if (c === ':') {
      const close = text.indexOf(':', i + 1);
      if (close !== -1 && close > i + 1) {
        const content = text.slice(i + 1, close);
        if (/^\w+$/.test(content)) {
          const imgHtml = `<img src="/KeywordSprites/${content}.webp" alt="${content}" data-keyword="${content}" style="width:1.1em;height:1.1em;vertical-align:-0.2em;display:inline-block;margin-right:0.2em;cursor:pointer" onerror="this.style.display='none'">`;
          // Bug 2: wrap :Keyword:{Vocab} in nowrap so icon and label stay on the same line
          const nextPos = close + 1;
          if (nextPos < text.length && text[nextPos] === '{') {
            const vocabClose = text.indexOf('}', nextPos + 1);
            if (vocabClose !== -1) {
              const vocabContent = text.slice(nextPos + 1, vocabClose);
              const vocabHtml = Object.prototype.hasOwnProperty.call(balanceValues, vocabContent)
                ? String(balanceValues[vocabContent])
                : `<span data-vocab="${vocabContent}" style="color:#ffca4b;cursor:pointer">${vocabContent}</span>`;
              result += `<span style="white-space:nowrap">${imgHtml}${vocabHtml}</span>`;
              i = vocabClose + 1;
              continue;
            }
          }
          result += imgHtml;
          i = close + 1;
          continue;
        }
      }
    }

    // Bug 1: handle -{ as a combined token — keeps minus and value together, prevents line-break between them
    if (c === '-' && i + 1 < text.length && text[i + 1] === '{') {
      const closeBrace = text.indexOf('}', i + 2);
      if (closeBrace !== -1) {
        const content = text.slice(i + 2, closeBrace);
        if (result.endsWith(' ')) result = result.slice(0, -1) + '&nbsp;';
        const valueHtml = Object.prototype.hasOwnProperty.call(balanceValues, content)
          ? String(balanceValues[content])
          : `<span data-vocab="${content}" style="color:#ffca4b;cursor:pointer">${content}</span>`;
        result += `<span style="white-space:nowrap">-${valueHtml}</span>`;
        i = closeBrace + 1;
        continue;
      }
    }

    if (c === '{') {
      const close = text.indexOf('}', i + 1);
      if (close !== -1) {
        const content = text.slice(i + 1, close);
        if (Object.prototype.hasOwnProperty.call(balanceValues, content)) {
          result += String(balanceValues[content]);
        } else {
          result += `<span data-vocab="${content}" style="color:#ffca4b;cursor:pointer">${content}</span>`;
        }
        i = close + 1;
        continue;
      }
    }

    // Bug 3: prevent space collapse between adjacent spans in -webkit-box layout
    if (c === ' ') {
      const next = text[i + 1];
      if (result.endsWith('</span>') && (next === '[' || next === '{' || next === ':')) {
        result += '&nbsp;';
      } else {
        result += ' ';
      }
      i++;
      continue;
    }

    // Escape HTML entities for safety
    if (c === '&') result += '&amp;';
    else if (c === '<') result += '&lt;';
    else if (c === '>') result += '&gt;';
    else result += c;
    i++;
  }
  return result;
}

/** Parses tooltip description text and highlights {Vocab}, :Keyword:, and [CardName] tokens. */
function parseDescription(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\{[^}]+\}|:[^:]+:|\[[^\]]+\])/g;
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(regex)) {
    if (match.index! > last) parts.push(text.slice(last, match.index));
    const token = match[1];
    if (token.startsWith('{')) {
      const word = token.slice(1, -1);
      parts.push(<span key={key++} className="text-gold-mid">{word}</span>);
    } else if (token.startsWith(':')) {
      const word = token.slice(1, -1);
      parts.push(
        <span key={key++} className="inline text-gold-mid">
          <img src={`/KeywordSprites/${word}.webp`} alt={word} className="w-[1em] h-[1em] align-[-0.15em] inline-block mr-[0.1em]" />
          {word}
        </span>
      );
    } else {
      const word = token.slice(1, -1);
      parts.push(<span key={key++} className="text-[#54a5ff]">{word}</span>);
    }
    last = match.index! + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Card({
  name,
  cost,
  power,
  subType,
  skill,
  levelUp,
  regions = [],
  keywords = [],
  balanceValues = {},
  artUrl,
  isFaceDown = false,
  isInDeck = false,
  onClick,
  width = '100%',
  className = '',
  layout = 'full',
  type,
}: CardProps) {
  const isSpell = type === 'Spell';
  const isLandmark = type === 'Landmark';
  // Only truly dynamic / non-Tailwind values remain here
  const containerStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    opacity: isInDeck ? 'var(--card-opacity-in-deck)' : undefined,
  };

  // ─── FACE DOWN ──────────────────────────────────────────────────────────────
  if (isFaceDown) {
    return (
      <div style={containerStyle} className={`card-base aspect-63/88 shrink-0 @container ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
        <img src="/CardComponent/card_back.png" alt="Card back" className={OVERLAY} draggable={false} />
      </div>
    );
  }

  const artGradient = regionGradients[regions[0]] ?? 'linear-gradient(160deg, #2e2318 0%, #1a1410 100%)';
  const hasSubType = !!subType;
  const hasPower = power !== undefined;

  // ─── Spell card auto-shrink refs ─────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const nameSpellRef = useRef<HTMLDivElement>(null);
  const skillSpellRef = useRef<HTMLDivElement>(null);
  const nameUnitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSpell) return;
    const el = nameSpellRef.current;
    if (!el) return;
    const adjust = () => {
      el.style.fontSize = `${(containerRef.current?.clientWidth ?? 200) * 0.08}px`;
      while (el.scrollWidth > el.clientWidth) {
        const cur = parseFloat(getComputedStyle(el).fontSize);
        if (cur <= 8) break;
        el.style.fontSize = `${cur - 0.5}px`;
      }
    };
    adjust();
    const ro = new ResizeObserver(adjust);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isSpell, name]);

  useEffect(() => {
    if (isSpell) return;
    const el = nameUnitRef.current;
    if (!el) return;
    const adjust = () => {
      el.style.fontSize = `${(containerRef.current?.clientWidth ?? 200) * 0.08}px`;
      while (el.scrollWidth > el.clientWidth) {
        const cur = parseFloat(getComputedStyle(el).fontSize);
        if (cur <= 8) break;
        el.style.fontSize = `${cur - 0.5}px`;
      }
    };
    adjust();
    const ro = new ResizeObserver(adjust);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isSpell, name]);

  useEffect(() => {
    if (!isSpell) return;
    const el = skillSpellRef.current;
    if (!el) return;
    const adjust = () => {
      el.style.fontSize = `${(containerRef.current?.clientWidth ?? 200) * 0.045}px`;
      while (el.scrollHeight > el.clientHeight) {
        const cur = parseFloat(getComputedStyle(el).fontSize);
        if (cur <= 8) break;
        el.style.fontSize = `${cur - 0.5}px`;
      }
    };
    adjust();
    const ro = new ResizeObserver(adjust);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isSpell, skill, keywords]);

  // ─── Spell gradient (color extracted from art) ────────────────────────────
  const [spellGradient, setSpellGradient] = useState<string | null>(null);

  useEffect(() => {
    if (!isSpell || !artUrl) { setSpellGradient(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const { getPaletteSync } = await import('colorthief');
        const palette = getPaletteSync(img, { colorCount: 2 });
        if (!palette || palette.length < 2) { setSpellGradient(null); return; }
        const hexToRgb = (hex: string): [number, number, number] => {
          const n = parseInt(hex.replace('#', ''), 16);
          return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        };
        const [h1, s1, l1] = rgbToHsl(...hexToRgb(palette[0].hex()));
        const [h2, s2, l2] = rgbToHsl(...hexToRgb(palette[1].hex()));
        const dark  = hslToRgbStr(h1, s1, Math.max(5,  l1 - 40));
        const light = hslToRgbStr(h2, s2, Math.min(85, l2));
        setSpellGradient(`linear-gradient(to right, ${dark}, ${light}, ${dark})`);
      } catch {
        setSpellGradient(null);
      }
    };
    img.onerror = () => setSpellGradient(null);
    img.src = artUrl;
  }, [isSpell, artUrl]);

  // ─── Tooltip state ────────────────────────────────────────────────────────
  const [tooltip, setTooltip] = useState<{ name: string; description: string; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTarget = useRef<string | null>(null);

  function resolveTooltipData(el: HTMLElement): { name: string; description: string } | null {
    const kw = el.dataset.keyword;
    const vb = el.dataset.vocab;
    if (kw) return { name: kw, description: lookupDescription(kw) };
    if (vb) return { name: vb, description: lookupDescription(vb) };
    return null;
  }

  function showTooltipFor(name: string, description: string, x: number, y: number) {
    setTooltip({ name, description, x, y });
  }

  function startHover(name: string, description: string, x: number, y: number) {
    if (hoverTarget.current === name) return;
    cancelHover();
    hoverTarget.current = name;
    hoverTimer.current = setTimeout(() => showTooltipFor(name, description, x, y), 500);
  }

  function cancelHover() {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    hoverTarget.current = null;
    setTooltip(null);
  }

  function startLongPress(name: string, description: string, x: number, y: number) {
    cancelLongPress();
    longPressTimer.current = setTimeout(() => showTooltipFor(name, description, x, y), 500);
  }

  function cancelLongPress() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    setTooltip(null);
  }

  // Tooltip positioning: flip left if near right edge, flip up if near bottom
  const TGAP = 14;
  const TWIDTH = 230;
  const tooltipLeft = tooltip
    ? (typeof window !== 'undefined' && tooltip.x + TGAP + TWIDTH > window.innerWidth
        ? tooltip.x - TGAP - TWIDTH : tooltip.x + TGAP)
    : 0;
  const tooltipNearBottom = tooltip
    ? (typeof window !== 'undefined' && tooltip.y + TGAP + 130 > window.innerHeight)
    : false;
  const tooltipTop = tooltip ? (tooltipNearBottom ? tooltip.y - TGAP : tooltip.y + TGAP) : 0;

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={`card-base aspect-63/88 shrink-0 @container ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {isSpell ? (
        <>
          {/* ── Spell Layer 1: Base overlays ─────────────────────────────────── */}
          <img src="/CardComponent/card_text_spell.png" alt="" aria-hidden className={`${OVERLAY} z-1`} draggable={false} />
          <img src="/CardComponent/card_text_shadow_spell.png" alt="" aria-hidden className={`${OVERLAY} z-1`} draggable={false} />
          <img src="/CardComponent/card_sprite_shadow_spell.png" alt="" aria-hidden className={`${OVERLAY} z-3`} draggable={false} />

          {/* ── Spell gradient: text area overlay masked by card_text_spell ─── */}
          {spellGradient && (
            <div
              className="absolute inset-0 z-2 pointer-events-none select-none"
              style={{
                background: spellGradient,
                WebkitMaskImage: 'url(/CardComponent/card_text_spell.png)',
                WebkitMaskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskImage: 'url(/CardComponent/card_text_spell.png)',
                maskSize: '100% 100%',
                maskRepeat: 'no-repeat',
                opacity: 0.6,
              }}
            />
          )}

          {/* ── Spell Layer 2: Art mask reference ────────────────────────────── */}
          <img src="/CardComponent/card_sprite_spell.png" alt="" aria-hidden className={`${OVERLAY} z-3`} draggable={false} />

          {/* ── Spell Layer 3: Character art (clipped by spell sprite mask) ───── */}
          <div
            className="absolute inset-0 z-3 overflow-hidden"
            style={{
              WebkitMaskImage: 'url(/CardComponent/card_sprite_spell.png)',
              WebkitMaskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
              maskImage: 'url(/CardComponent/card_sprite_spell.png)',
              maskSize: '100% 100%',
              maskRepeat: 'no-repeat',
            }}
          >
            {artUrl ? (
              <img
                src={artUrl}
                alt={name}
                className="w-full h-full object-cover object-center"
                draggable={false}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full" style={{ background: artGradient }} />
            )}
          </div>

          {/* ── Spell Layer 4: Shadow overlay ─────────────────────────────────── */}
          <img src="/CardComponent/card_shadow_spell.png" alt="" aria-hidden className={`${OVERLAY} z-1`} draggable={false} />

          {/* ── Spell Layer 5: Mana badge ─────────────────────────────────────── */}
          <img src="/CardComponent/card_mana.png" alt="" aria-hidden className={`${OVERLAY} z-5`} draggable={false} />
        </>
      ) : (
        <>
          {/* ── Layer 1: Card base frame (full-card overlay) ──────────────────── */}
          <img src={isLandmark ? "/CardComponent/card_base_landmark.png" : "/CardComponent/card_base.png"} alt="" aria-hidden className={`${OVERLAY} z-1`} draggable={false} />

          {/* ── Layer 2: Character art (clipped by frame alpha mask) ───────────── */}
          <div
            className="absolute inset-0 z-3 overflow-hidden"
            style={{
              WebkitMaskImage: `url(/CardComponent/${isLandmark ? 'card_sprite_landmark' : 'card_sprite'}.png)`,
              WebkitMaskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
              maskImage: `url(/CardComponent/${isLandmark ? 'card_sprite_landmark' : 'card_sprite'}.png)`,
              maskSize: '100% 100%',
              maskRepeat: 'no-repeat',
            }}
          >
            {artUrl ? (
              <img
                src={artUrl}
                alt={name}
                className="w-full h-full object-cover object-center"
                draggable={false}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full" style={{ background: artGradient }} />
            )}
          </div>

          {/* ── Layer 3: Art mask reference ───────────────────────────────────── */}
          <img src={isLandmark ? "/CardComponent/card_sprite_landmark.png" : "/CardComponent/card_sprite.png"} alt="" aria-hidden className={`${OVERLAY} z-2`} draggable={false} />

          {/* ── Layer 4: Shadow overlay ───────────────────────────────────────── */}
          <img src={isLandmark ? "/CardComponent/card_shadow_landmark.png" : "/CardComponent/card_shadow.png"} alt="" aria-hidden className={`${OVERLAY} z-4`} draggable={false} />

          {/* ── Layer 5a: SubType banner (only when subType present) ───────────── */}
          {hasSubType && (
            <img src="/CardComponent/card_subtype.png" alt="" aria-hidden className={`${OVERLAY} z-5`} draggable={false} />
          )}

          {/* ── Layer 5b: Mana badge ──────────────────────────────────────────── */}
          <img src="/CardComponent/card_mana.png" alt="" aria-hidden className={`${OVERLAY} z-5`} draggable={false} />

          {/* ── Layer 5c: Power badge (only when power present) ───────────────── */}
          {hasPower && (
            <img src="/CardComponent/card_power.png" alt="" aria-hidden className={`${OVERLAY} z-5`} draggable={false} />
          )}
        </>
      )}

      {/* ── Layer 6: Text overlays (cqw = % of card container width) ─────────── */}

      {/* Cost — top-left, inside mana badge */}
      <div
        className="absolute z-6 flex items-center justify-center select-none font-display font-bold text-cq-xl text-text-primary leading-none"
        style={{
          top: '-1cqw', left: '2cqw',
          width: '22cqw', height: '22cqw',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
        }}
      >
        {cost}
      </div>

      {/* Power — top-right, inside power badge */}
      {hasPower && (
        <div
          className="absolute z-6 flex items-center justify-center select-none font-display font-bold text-cq-xl text-text-primary leading-none"
          style={{
            top: '-1cqw', right: '2cqw',
            width: '22cqw', height: '22cqw',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          }}
        >
          {power}
        </div>
      )}

      {/* SubType — center-top, inside subtype banner */}
      {hasSubType && (
        <div
          className="absolute z-6 flex items-center justify-center overflow-hidden whitespace-nowrap text-ellipsis uppercase select-none text-cq-sm font-normal tracking-[0.05em] text-[#979382]"
          style={{
            top: '3cqw', left: '22cqw', right: '22cqw',
            height: '8cqw',
            fontFamily: "'UniversCnRg', sans-serif",
          }}
        >
          {subType}
        </div>
      )}

      {/* ── Layer 7a: Regular card bottom text block ──────────────────────────── */}
      {!isSpell && (
        <div
          className="absolute z-6 bottom-0 flex flex-col items-center pb-[3%] space-y-[2%]"
          style={{ left: '6%', right: '6%', gap: '0.5cqw' }}
        >
          {/* Card name */}
          <div
            ref={nameUnitRef}
            className="w-full text-center select-none uppercase font-display font-bold text-text-primary leading-[1.1]"
            style={{
              fontSize: '8cqw',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textShadow: '0 0 8px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,0.9)',
            }}
          >
            {name}
          </div>

          {/* Keyword badges — full layout only */}
          {layout === 'full' && keywords && keywords.length > 0 && (
            <div className="flex flex-wrap justify-center" style={{ gap: '3cqw' }}>
              {keywords.map(kw => (
                <div
                  key={kw}
                  className="shrink-0 inline-flex items-center h-[10cqw] gap-[1.5cqw] px-[1cqw] cursor-pointer border-solid border-[2cqw] border-transparent"
                  style={{ borderImage: "url('/CardComponent/card_keyword.png') 8 fill / 1.5cqw / 0 stretch" }}
                  onMouseEnter={(e) => { const d = resolveTooltipData(e.currentTarget); if (d) startHover(d.name, d.description, e.clientX, e.clientY); }}
                  onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => cancelHover()}
                  onTouchStart={(e) => { const t = e.changedTouches[0]; const d = resolveTooltipData(e.currentTarget); if (d) startLongPress(d.name, d.description, t.clientX, t.clientY); }}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  data-keyword={kw}
                >
                  <img
                    src={`/KeywordSprites/${kw}.webp`}
                    alt={kw}
                    className="h-[5.5cqw] aspect-square object-contain"
                    draggable={false}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="font-display font-bold text-cq-sm text-keyword uppercase tracking-[0.06em] whitespace-nowrap leading-none pointer-events-none select-none">
                    {kw}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Skill text — full layout only */}
          {layout === 'full' && skill && (
            <div
              className="w-full h-fit text-center font-body text-cq-base text-text-primary leading-tight"
              style={{
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                display: '-webkit-box',
                // WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
              onMouseOver={(e) => { const el = (e.target as HTMLElement).closest('[data-keyword],[data-vocab]') as HTMLElement | null; const d = el ? resolveTooltipData(el) : null; if (d) startHover(d.name, d.description, e.clientX, e.clientY); else cancelHover(); }}
              onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => cancelHover()}
              onTouchStart={(e) => { const t = e.changedTouches[0]; const raw = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null; const el = raw?.closest('[data-keyword],[data-vocab]') as HTMLElement | null ?? raw; const d = el ? resolveTooltipData(el) : null; if (d) startLongPress(d.name, d.description, t.clientX, t.clientY); }}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              dangerouslySetInnerHTML={{ __html: formatCardText(skill, balanceValues) }}
            />
          )}

          {/* Level-up separator + text — full layout only */}
          {layout === 'full' && levelUp && (
            <>
              <img
                src="/CardComponent/card_levelup.png"
                alt=""
                aria-hidden
                className="w-full h-auto object-contain pointer-events-none"
                draggable={false}
              />
              <div
                className="w-full overflow-hidden text-center select-none font-body text-cq-base leading-tight text-[rgb(255,162,100)]"
                style={{
                  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                  display: '-webkit-box',
                  // WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
                onMouseOver={(e) => { const el = (e.target as HTMLElement).closest('[data-keyword],[data-vocab]') as HTMLElement | null; const d = el ? resolveTooltipData(el) : null; if (d) startHover(d.name, d.description, e.clientX, e.clientY); else cancelHover(); }}
                onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => cancelHover()}
                onTouchStart={(e) => { const t = e.changedTouches[0]; const raw = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null; const el = raw?.closest('[data-keyword],[data-vocab]') as HTMLElement | null ?? raw; const d = el ? resolveTooltipData(el) : null; if (d) startLongPress(d.name, d.description, t.clientX, t.clientY); }}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                dangerouslySetInnerHTML={{ __html: formatCardText(levelUp, balanceValues) }}
              />
            </>
          )}

          {/* Region icons — full layout only */}
          {layout === 'full' && regions.length > 0 && (
            <div className="flex items-center justify-center" style={{ gap: '1cqw' }}>
              {regions.map(region => {
                const sprite = regionSpriteMap[region];
                return sprite ? (
                  <img
                    key={region}
                    src={`/RegionSprites/${sprite}.webp`}
                    alt={region}
                    title={region}
                    className="object-contain select-none opacity-65 mb-[1cqw]"
                    style={{ width: '16cqw', height: '16cqw' }}
                    draggable={false}
                  />
                ) : (
                  <span key={region} className="uppercase select-none whitespace-nowrap font-body text-cq-md text-text-muted tracking-[0.06em]">
                    {region}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Layer 7b: Spell card text block (top-aligned, regions pinned bottom) ── */}
      {isSpell && (
        <div
          className="absolute z-6 flex flex-col items-center space-y-[2%]"
          style={{ top: '59%', bottom: '1%', left: '6%', right: '6%'}}
        >
          {/* Card name — single line, auto-shrinks to fit */}
          <div
            ref={nameSpellRef}
            className="w-full text-center select-none uppercase font-display font-bold text-text-primary leading-none"
            style={{
              fontSize: '8cqw',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textShadow: '0 0 8px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,0.9)',
            }}
          >
            {name}
          </div>

          {/* Keyword badges — full layout only */}
          {layout === 'full' && keywords && keywords.length > 0 && (
            <div className="flex flex-wrap justify-center" style={{ gap: '3cqw' }}>
              {keywords.map(kw => (
                <div
                  key={kw}
                  className="shrink-0 inline-flex items-center h-[10cqw] gap-[1.5cqw] px-[1cqw] cursor-pointer border-solid border-[2cqw] border-transparent"
                  style={{ borderImage: "url('/CardComponent/card_keyword.png') 8 fill / 1.5cqw / 0 stretch" }}
                  onMouseEnter={(e) => { const d = resolveTooltipData(e.currentTarget); if (d) startHover(d.name, d.description, e.clientX, e.clientY); }}
                  onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => cancelHover()}
                  onTouchStart={(e) => { const t = e.changedTouches[0]; const d = resolveTooltipData(e.currentTarget); if (d) startLongPress(d.name, d.description, t.clientX, t.clientY); }}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  data-keyword={kw}
                >
                  <img
                    src={`/KeywordSprites/${kw}.webp`}
                    alt={kw}
                    className="h-[5.5cqw] aspect-square object-contain"
                    draggable={false}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="font-display font-bold text-cq-sm text-keyword uppercase tracking-[0.06em] whitespace-nowrap leading-none pointer-events-none select-none">
                    {kw}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Skill text — auto-shrinks font to avoid overflowing into regions */}
          {layout === 'full' && skill ? (
            <div className="w-full flex-1 min-h-0 overflow-hidden">
              <div
                ref={skillSpellRef}
                className="w-full h-full overflow-hidden text-center font-body text-text-primary leading-tight"
                style={{ fontSize: '4.5cqw', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                onMouseOver={(e) => { const el = (e.target as HTMLElement).closest('[data-keyword],[data-vocab]') as HTMLElement | null; const d = el ? resolveTooltipData(el) : null; if (d) startHover(d.name, d.description, e.clientX, e.clientY); else cancelHover(); }}
                onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => cancelHover()}
                onTouchStart={(e) => { const t = e.changedTouches[0]; const raw = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null; const el = raw?.closest('[data-keyword],[data-vocab]') as HTMLElement | null ?? raw; const d = el ? resolveTooltipData(el) : null; if (d) startLongPress(d.name, d.description, t.clientX, t.clientY); }}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                dangerouslySetInnerHTML={{ __html: formatCardText(skill, balanceValues) }}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Region icons — always pinned to bottom */}
          {layout === 'full' && regions.length > 0 && (
            <div className="flex items-center justify-center mb-[3cqw]" style={{ gap: '1cqw', marginTop: 'auto' }}>
              {regions.map(region => {
                const sprite = regionSpriteMap[region];
                return sprite ? (
                  <img
                    key={region}
                    src={`/RegionSprites/${sprite}.webp`}
                    alt={region}
                    title={region}
                    className="object-contain select-none opacity-65"
                    style={{ width: '16cqw', height: '16cqw' }}
                    draggable={false}
                  />
                ) : (
                  <span key={region} className="uppercase select-none whitespace-nowrap font-body text-cq-md text-text-muted tracking-[0.06em]">
                    {region}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tooltip portal (rendered to document.body to escape card overflow/containment) ── */}
      {typeof document !== 'undefined' && tooltip && createPortal(
        <div
          className="fixed z-9999 w-57.5 bg-bg-panel border border-border-dark py-2 px-2.5 pointer-events-none select-none"
          style={{
            left: tooltipLeft,
            top: tooltipTop,
            transform: tooltipNearBottom ? 'translateY(-100%)' : undefined,
            borderRadius: 'var(--radius-panel)',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <div className="font-display font-bold text-[12px] text-gold-mid uppercase tracking-[0.06em] leading-[1.2]">
            {tooltip.name}
          </div>
          {tooltip.description ? (
            <>
              <div className="h-px bg-border-dark my-1.25" />
              <div className="font-body text-[11px] text-text-muted leading-[1.4]">
                {parseDescription(tooltip.description)}
              </div>
            </>
          ) : null}
        </div>,
        document.body,
      )}
    </div>
  );
}
