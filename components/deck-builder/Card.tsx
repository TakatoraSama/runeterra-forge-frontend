'use client';

import { CSSProperties, ReactNode, useState, useRef } from 'react';
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
};

// Shared className for every full-card overlay PNG
const OVERLAY = "absolute inset-0 w-full h-full object-fill pointer-events-none select-none";
const KEYWORD_BG = "absolute inset-0 w-full h-full object-fill pointer-events-none select-none";
const KEYWORD_ICON = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[57%] h-[57%] object-contain pointer-events-none select-none";

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
          result += `<img src="/KeywordSprites/${content}.webp" alt="${content}" data-keyword="${content}" style="width:1.1em;height:1.1em;vertical-align:-0.2em;display:inline-block;margin-right:0.2em;cursor:pointer" onerror="this.style.display='none'">`;
          i = close + 1;
          continue;
        }
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
      parts.push(<span key={key++} style={{ color: 'var(--color-gold-mid)' }}>{word}</span>);
    } else if (token.startsWith(':')) {
      const word = token.slice(1, -1);
      parts.push(
        <span key={key++} style={{ display: 'inline', color: 'var(--color-gold-mid)' }}>
          <img src={`/KeywordSprites/${word}.webp`} alt={word} style={{ width: '1em', height: '1em', verticalAlign: '-0.15em', display: 'inline-block', marginRight: '0.1em' }} />
          {word}
        </span>
      );
    } else {
      const word = token.slice(1, -1);
      parts.push(<span key={key++} style={{ color: '#54a5ff' }}>{word}</span>);
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
}: CardProps) {
  // Only truly dynamic / non-Tailwind values remain here
  const containerStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    cursor: onClick ? 'pointer' : undefined,
    opacity: isInDeck ? 'var(--card-opacity-in-deck)' : undefined,
    // Container query: enables cqw font units inside
    containerType: 'inline-size',
  };

  // ─── FACE DOWN ──────────────────────────────────────────────────────────────
  if (isFaceDown) {
    return (
      <div style={containerStyle} className={`card-base aspect-63/88 shrink-0 ${className}`} onClick={onClick}>
        <img src="/CardComponent/card_back.png" alt="Card back" className={OVERLAY} draggable={false} />
      </div>
    );
  }

  const artGradient = regionGradients[regions[0]] ?? 'linear-gradient(160deg, #2e2318 0%, #1a1410 100%)';
  const hasSubType = !!subType;
  const hasPower = power !== undefined;

  // ─── Tooltip state ────────────────────────────────────────────────────────
  const [tooltip, setTooltip] = useState<{ name: string; description: string; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      style={containerStyle}
      className={`card-base aspect-63/88 shrink-0 ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* ── Layer 1: Card base frame (full-card overlay) ──────────────────────── */}
      <img src="/CardComponent/card_base.png" alt="" aria-hidden className={OVERLAY} style={{ zIndex: 1 }} draggable={false} />

      {/* ── Layer 2: Character art (rendered above frame, clipped by frame alpha mask) ── */}
      <div
        className="absolute inset-0 z-3 overflow-hidden"
        style={{
          WebkitMaskImage: 'url(/CardComponent/card_sprite.png)',
          WebkitMaskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskImage: 'url(/CardComponent/card_sprite.png)',
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

      {/* ── Layer 3: Art frame source/mask reference (kept under art layer) ───── */}
      <img src="/CardComponent/card_sprite.png" alt="" aria-hidden className={OVERLAY} style={{ zIndex: 2 }} draggable={false} />

      {/* ── Layer 4: Shadow overlay (full-card PNG) ───────────────────────────── */}
      <img src="/CardComponent/card_shadow.png" alt="" aria-hidden className={OVERLAY} style={{ zIndex: 4 }} draggable={false} />

      {/* ── Layer 5a: SubType banner (full-card PNG, only when subType present) ── */}
      {hasSubType && (
        <img src="/CardComponent/card_subtype.png" alt="" aria-hidden className={OVERLAY} style={{ zIndex: 5 }} draggable={false} />
      )}

      {/* ── Layer 5b: Mana badge (full-card PNG) ─────────────────────────────── */}
      <img src="/CardComponent/card_mana.png" alt="" aria-hidden className={OVERLAY} style={{ zIndex: 5 }} draggable={false} />

      {/* ── Layer 5c: Power badge (full-card PNG, only when power present) ──────── */}
      {hasPower && (
        <img src="/CardComponent/card_power.png" alt="" aria-hidden className={OVERLAY} style={{ zIndex: 5 }} draggable={false} />
      )}

      {/* ── Layer 6: Text overlays (cqw = % of card container width) ─────────── */}

      {/* Cost — top-left, inside mana badge */}
      <div
        className="absolute z-6 flex items-center justify-center select-none"
        style={{
          top: '-2cqw', left: '1cqw',
          width: '22cqw', height: '22cqw',
          fontFamily: 'var(--font-display)',
          fontSize: '11cqw',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          lineHeight: 1,
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
        }}
      >
        {cost}
      </div>

      {/* Power — top-right, inside power badge */}
      {hasPower && (
        <div
          className="absolute z-6 flex items-center justify-center select-none"
          style={{
            top: '-2cqw', right: '1cqw',
            width: '22cqw', height: '22cqw',
            fontFamily: 'var(--font-display)',
            fontSize: '11cqw',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1,
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          }}
        >
          {power}
        </div>
      )}

      {/* SubType — center-top, inside subtype banner */}
      {hasSubType && (
        <div
          className="absolute z-6 flex items-center justify-center overflow-hidden whitespace-nowrap text-ellipsis uppercase select-none"
          style={{
            top: '2.5cqw', left: '22cqw', right: '22cqw',
            height: '8cqw',
            fontFamily: "'UniversCnRg', sans-serif",
            fontSize: '4.5cqw',
            fontWeight: 400,
            color: '#979382',
            letterSpacing: '0.05em',
          }}
        >
          {subType}
        </div>
      )}

      {/* ── Layer 7: Bottom text block ────────────────────────────────────────── */}
      <div
        className="absolute z-6 bottom-0 flex flex-col items-center pb-[3%] space-y-[2%]"
        style={{ left: '6%', right: '6%', gap: '0.5cqw' }}
      >
        {/* Card name */}
        <div
          className="w-full text-center select-none uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '10cqw',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.1,
            textShadow: '0 0 8px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,0.9)',
          }}
        >
          {name}
        </div>

        {/* Keyword badges — full layout only */}
        {layout === 'full' && keywords && keywords.length > 0 && (
          <div className="flex flex-wrap justify-center" style={{ gap: '10cqw' }}>
            {keywords.map(kw => (
              <div
                key={kw}
                className="relative shrink-0"
                style={{ width: '13cqw', aspectRatio: '84/72', cursor: 'pointer' }}
                onMouseEnter={(e) => { const d = resolveTooltipData(e.currentTarget); if (d) showTooltipFor(d.name, d.description, e.clientX, e.clientY); }}
                onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => setTooltip(null)}
                onTouchStart={(e) => { const t = e.changedTouches[0]; const d = resolveTooltipData(e.currentTarget); if (d) startLongPress(d.name, d.description, t.clientX, t.clientY); }}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                data-keyword={kw}
              >
                <img src="/CardComponent/card_keyword.png" alt="" aria-hidden className={KEYWORD_BG} draggable={false} />
                <img
                  src={`/KeywordSprites/${kw}.webp`}
                  alt={kw}
                  className={KEYWORD_ICON}
                  draggable={false}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Skill text — full layout only */}
        {layout === 'full' && skill && (
          <div
            className="w-full h-fit text-center"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '5.5cqw',
              color: 'var(--color-text-primary)',
              lineHeight: 1.25,
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              display: '-webkit-box',
              // WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
            onMouseOver={(e) => { const el = (e.target as HTMLElement).closest('[data-keyword],[data-vocab]') as HTMLElement | null; const d = el ? resolveTooltipData(el) : null; if (d) showTooltipFor(d.name, d.description, e.clientX, e.clientY); else setTooltip(null); }}
            onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
            onMouseLeave={() => setTooltip(null)}
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
              className="w-full overflow-hidden text-center select-none"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '5.5cqw',
                color: 'rgb(255, 162, 100)',
                lineHeight: 1.25,
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                display: '-webkit-box',
                // WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
              onMouseOver={(e) => { const el = (e.target as HTMLElement).closest('[data-keyword],[data-vocab]') as HTMLElement | null; const d = el ? resolveTooltipData(el) : null; if (d) showTooltipFor(d.name, d.description, e.clientX, e.clientY); else setTooltip(null); }}
              onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => setTooltip(null)}
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
                  className="object-contain select-none opacity-70"
                  style={{ width: '16cqw', height: '16cqw' }}
                  draggable={false}
                />
              ) : (
                <span key={region} className="uppercase select-none whitespace-nowrap" style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '8cqw',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.06em',
                }}>
                  {region}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tooltip portal (rendered to document.body to escape card overflow/containment) ── */}
      {typeof document !== 'undefined' && tooltip && createPortal(
        <div
          style={{
            position: 'fixed',
            left: tooltipLeft,
            top: tooltipTop,
            transform: tooltipNearBottom ? 'translateY(-100%)' : undefined,
            zIndex: 9999,
            width: TWIDTH,
            background: 'var(--color-bg-panel)',
            border: '1px solid var(--color-border-dark)',
            borderRadius: 'var(--radius-panel)',
            boxShadow: 'var(--shadow-panel)',
            padding: '8px 10px',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--color-gold-mid)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            lineHeight: 1.2,
          }}>
            {tooltip.name}
          </div>
          {tooltip.description ? (
            <>
              <div style={{ height: '1px', background: 'var(--color-border-dark)', margin: '5px 0' }} />
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.4,
              }}>
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
