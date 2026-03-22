import { useEffect } from 'react';
import {
  escapeHtml,
  fetchJsonByToken,
  normalizeRows,
  normalizeTooltipId,
  stripTags,
  type DictionaryDefinition,
  type DictionaryEntryResponse,
} from '../utils/radical-page-utils';
import { rightAngle } from '../utils/ruby2hruby';
import { decorateRuby, formatBopomofo, formatPinyin } from '../utils/bopomofo-pinyin-utils';

const ATTR = 'data-radical-id';
const RESULT_LINK_SELECTOR = '.result a[href]:not(.xref)';
const LOADING_HTML = '<div class="entry"><div class="entry-item"><div class="def">載入中…</div></div></div>';
const EMPTY_HTML = '<div class="entry"><div class="entry-item"><div class="def">找不到內容</div></div></div>';

function previewDebugText(input: string, max = 120): string {
  const normalized = String(input || '').replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function buildTitleSection(label: string, href: string): string {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);
  return `<div class="title" data-title="${safeLabel}"><span class="h1"><a href="${safeHref}">${safeLabel}</a></span></div>`;
}

function normalizeEntryTitleToken(token: string): string {
  let value = token.replace(/^\//, '').trim();
  if (!value) return '';
  if (value.startsWith('\\')) {
    value = value.slice(1);
  }
  if (/^['!:~]/.test(value)) {
    value = value.slice(1);
  }
  return value;
}

function groupDefinitions(definitions: DictionaryDefinition[]): Map<string, DictionaryDefinition[]> {
  const grouped = new Map<string, DictionaryDefinition[]>();
  for (const definition of definitions) {
    const key = String(definition.type || '').trim();
    const existing = grouped.get(key) || [];
    existing.push(definition);
    grouped.set(key, existing);
  }
  return grouped;
}

function renderPartOfSpeech(typeText: string): string {
  if (!typeText) return '';
  return typeText
    .split(',')
    .map((tag) => stripTags(tag).trim())
    .filter(Boolean)
    .map((tag) => `<span class="part-of-speech">${escapeHtml(tag)}</span>`)
    .join('');
}

function getLangFromToken(token: string): 'a' | 't' | 'h' | 'c' {
  if (token.startsWith("'") || token.startsWith('!')) return 't';
  if (token.startsWith(':')) return 'h';
  if (token.startsWith('~')) return 'c';
  return 'a';
}

async function buildRadicalTooltipHTML(rawId: string): Promise<string> {
  const id = normalizeTooltipId(rawId);
  if (!id) return EMPTY_HTML;

  if (id === '@' || id === '~@') {
    const isCrossStrait = id.startsWith('~');
    const data = normalizeRows(await fetchJsonByToken<unknown>(id));
    if (data.length === 0) return EMPTY_HTML;
    const prefix = isCrossStrait ? '/~@' : '/@';

    let html = `${buildTitleSection('部首表', prefix)}<div class="entry"><div class="entry-item"><div style="max-height: 300px; overflow-y: auto;">`;
    for (let stroke = 0; stroke < data.length; stroke += 1) {
      const radicals = data[stroke] || [];
      if (radicals.length === 0) continue;
      html += `<div><span class="stroke-count">${stroke}</span><span class="stroke-list">`;
      for (const radical of radicals) {
        html += `<a href="${prefix}${encodeURIComponent(radical)}" class="stroke-char">${escapeHtml(radical)}</a>`;
      }
      html += '</span></div>';
    }
    html += '</div></div></div>';
    return html;
  }

  const isCrossStrait = id.startsWith('~@');
  const match = isCrossStrait ? id.match(/^~@(.+)$/) : id.match(/^@(.+)$/);
  const radical = match?.[1] ? decodeURIComponent(match[1]) : '';
  if (!radical) return EMPTY_HTML;

  const token = isCrossStrait ? `~@${radical}` : `@${radical}`;
  const data = normalizeRows(await fetchJsonByToken<unknown>(token));
  if (data.length === 0) return EMPTY_HTML;

  const prefix = isCrossStrait ? '/~' : '/';
  const bucketHref = `${isCrossStrait ? '/~@' : '/@'}${encodeURIComponent(radical)}`;
  let html = `${buildTitleSection(`${radical} 部`, bucketHref)}<div class="entry"><div class="entry-item"><div style="max-height: 300px; overflow-y: auto;">`;
  for (let stroke = 0; stroke < Math.min(data.length, 8); stroke += 1) {
    const chars = data[stroke] || [];
    if (chars.length === 0) continue;
    html += `<div><span class="stroke-count">${stroke}</span><span class="stroke-list">`;
    for (const char of chars.slice(0, 15)) {
      html += `<a href="${prefix}${encodeURIComponent(char)}" class="stroke-char">${escapeHtml(char)}</a>`;
    }
    if (chars.length > 15) {
      html += `<span style="color:#666;">（還有 ${chars.length - 15} 個字）</span>`;
    }
    html += '</span></div>';
  }
  html += '</div></div></div>';
  return html;
}

async function buildEntryTooltipHTML(rawToken: string): Promise<string> {
  const token = normalizeTooltipId(rawToken).replace(/^\//, '');
  if (!token) return EMPTY_HTML;
  const lang = getLangFromToken(token);
  console.debug('[tooltip-entry] token resolved', {
    rawToken,
    normalizedToken: token,
    lang,
  });

  const entry = await fetchJsonByToken<DictionaryEntryResponse>(token);
  if (!entry) {
    const label = normalizeEntryTitleToken(token) || token;
    return `${buildTitleSection(label, `/${token}`)}${EMPTY_HTML}`;
  }

  const title = stripTags(String(entry.title || normalizeEntryTitleToken(token) || token));
  const heteronym = Array.isArray(entry.heteronyms) ? entry.heteronyms[0] : undefined;
  const definitions = Array.isArray(heteronym?.definitions) ? heteronym.definitions : [];
  const grouped = groupDefinitions(definitions);
  const rubyData = decorateRuby({
    LANG: lang,
    title,
    bopomofo: heteronym?.bopomofo,
    pinyin: heteronym?.pinyin,
    trs: heteronym?.trs,
  });

  const itemsHtml = Array.from(grouped.entries())
    .slice(0, 4)
    .map(([type, items]) => {
      const partOfSpeech = renderPartOfSpeech(type);
      const listHtml = items
        .slice(0, 6)
        .map((item) => `<li><p class="definition"><span class="def">${escapeHtml(stripTags(String(item.def || '')))}</span></p></li>`)
        .join('');
      if (!listHtml) {
        return '';
      }
      return `<div class="entry-item">${partOfSpeech}<ol>${listHtml}</ol></div>`;
    })
    .join('');

  let titleHtml = '';
  if (lang === 'h') {
    const safeTitle = escapeHtml(title);
    titleHtml = `<span class="h1"><a href="./#:${safeTitle}">${safeTitle}</a></span>`;
  } else if (rubyData.ruby) {
    const hruby = rightAngle(rubyData.ruby);
    titleHtml = `<span class="h1">${hruby}</span>`;
  } else {
    const safeTitle = escapeHtml(title);
    titleHtml = `<span class="h1"><a href="./#${safeTitle}">${safeTitle}</a></span>`;
  }
  const youyinHtml = rubyData.youyin ? `<small class="youyin">${escapeHtml(stripTags(rubyData.youyin))}</small>` : '';

  const showPinyin = lang !== 'h';
  let pronunciationHtml = '';
  if (showPinyin && (heteronym?.bopomofo || heteronym?.pinyin || rubyData.bAlt || rubyData.pAlt)) {
    const cnClass = rubyData.cnSpecific ? ` ${rubyData.cnSpecific}` : '';
    const altCnBlock =
      rubyData.cnSpecific && rubyData.pinyin && rubyData.bopomofo
        ? `<small class="alternative cn-specific">${showPinyin ? `<span class="pinyin">${formatPinyin(rubyData.pinyin)}</span>` : ''}<span class="bopomofo">${formatBopomofo(rubyData.bopomofo)}</span></small>`
        : '';
    const mainBpmf = heteronym?.bopomofo ? `<span class="bopomofo">${formatBopomofo(heteronym.bopomofo)}</span>` : '';
    const mainPinyin = showPinyin && (heteronym?.pinyin || heteronym?.trs)
      ? `<span class="pinyin">${formatPinyin(heteronym.pinyin || heteronym.trs || '')}</span>`
      : '';
    const altBlock =
      rubyData.bAlt || rubyData.pAlt
        ? `<small class="alternative">${showPinyin && rubyData.pAlt ? `<span class="pinyin">${formatPinyin(rubyData.pAlt)}</span>` : ''}${rubyData.bAlt ? `<span class="bopomofo">${formatBopomofo(rubyData.bAlt)}</span>` : ''}</small>`
        : '';
    pronunciationHtml = `<div class="bopomofo${cnClass}">${altCnBlock}<div class="main-pronunciation">${mainBpmf}${mainPinyin}</div>${altBlock}</div>`;
    console.debug('[tooltip-entry] pronunciation decision', {
      token,
      lang,
      showPinyin,
      hasBopomofo: Boolean(heteronym?.bopomofo),
      hasPinyin: Boolean(heteronym?.pinyin || heteronym?.trs),
      pronunciationPreview: previewDebugText(pronunciationHtml),
    });
  }

  const content = itemsHtml || '<div class="entry-item"><div class="def">找不到內容</div></div>';
  return `<div class="title" data-title="${escapeHtml(title)}">${titleHtml}${youyinHtml}</div>${pronunciationHtml}<div class="entry">${content}</div>`;
}

function resolveTooltipIdFromHref(rawHref: string | null): string {
  const href = String(rawHref || '').trim();
  if (!href) return '';
  if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) return '';
  return normalizeTooltipId(href);
}

function shouldUseRadicalTooltip(id: string): boolean {
  return id === '@' || id === '~@' || id.startsWith('@') || id.startsWith('~@');
}

interface TooltipTarget {
  anchor: HTMLAnchorElement;
  id: string;
}

function resolveTooltipTarget(target: EventTarget | null): TooltipTarget | null {
  if (!(target instanceof Element)) return null;
  if (target.closest('.single-char-stroke-trigger')) return null;

  const customAnchor = target.closest(`[${ATTR}]`);
  if (customAnchor instanceof HTMLAnchorElement) {
    const id = String(customAnchor.getAttribute(ATTR) || '').trim();
    if (!id) return null;
    return { anchor: customAnchor, id };
  }

  const fallbackAnchor = target.closest(RESULT_LINK_SELECTOR);
  if (!(fallbackAnchor instanceof HTMLAnchorElement)) return null;
  const id = resolveTooltipIdFromHref(fallbackAnchor.getAttribute('href'));
  if (!id) return null;
  return { anchor: fallbackAnchor, id };
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function useRadicalTooltip(): void {
  useEffect(() => {
    // 觸控裝置不顯示 tooltip（無法關閉）
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    let tooltipEl: HTMLDivElement | null = null;
    let showTimer: number | null = null;
    let hideTimer: number | null = null;
    let currentId = '';
    let currentAnchor: HTMLAnchorElement | null = null;
    const cache = new Map<string, string>();

    const clearShowTimer = () => {
      if (showTimer != null) {
        window.clearTimeout(showTimer);
        showTimer = null;
      }
    };

    const clearHideTimer = () => {
      if (hideTimer != null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const createTooltip = (): HTMLDivElement => {
      if (tooltipEl) return tooltipEl;
      const element = document.createElement('div');
      element.className = 'ui-tooltip prefer-pinyin-true';
      element.style.position = 'absolute';
      element.style.display = 'none';
      element.style.zIndex = '9999';
      element.innerHTML = EMPTY_HTML;
      element.addEventListener('mouseenter', clearHideTimer);
      element.addEventListener('mouseleave', () => {
        clearHideTimer();
        hideTimer = window.setTimeout(() => {
          if (tooltipEl) {
            tooltipEl.style.display = 'none';
          }
          currentId = '';
          currentAnchor = null;
        }, 50);
      });
      document.body.appendChild(element);
      tooltipEl = element;
      return element;
    };

    const positionTooltip = (anchor: HTMLAnchorElement) => {
      const element = createTooltip();
      const rect = anchor.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      const tooltipWidth = element.offsetWidth || 240;
      const tooltipHeight = element.offsetHeight || 160;

      const minX = scrollX + 8;
      let maxX = scrollX + Math.max(viewportWidth - tooltipWidth - 8, 8);
      if (maxX < minX) maxX = minX;

      const minY = scrollY + 8;
      let maxY = scrollY + Math.max(viewportHeight - tooltipHeight - 8, 8);
      if (maxY < minY) maxY = minY;

      const desiredX = scrollX + rect.left + rect.width / 2 - tooltipWidth / 2;
      const desiredY = scrollY + rect.bottom + 12;

      element.style.left = `${clamp(desiredX, minX, maxX)}px`;
      element.style.top = `${clamp(desiredY, minY, maxY)}px`;
    };

    const showTooltip = async (anchor: HTMLAnchorElement, rawId: string) => {
      const id = String(rawId || '').trim();
      if (!id) return;

      currentId = id;
      currentAnchor = anchor;
      const element = createTooltip();
      element.innerHTML = LOADING_HTML;
      element.style.display = 'block';
      positionTooltip(anchor);

      const cacheKey = id;
      let html = cache.get(cacheKey);
      if (!html) {
        if (id.startsWith('entry:')) {
          const entryTarget = id.slice(6).trim() || anchor.getAttribute('href') || '';
          console.debug('[tooltip-entry] entry route', {
            id,
            entryTarget,
            anchorHref: anchor.getAttribute('href') || '',
          });
          html = await buildEntryTooltipHTML(entryTarget);
        } else if (shouldUseRadicalTooltip(id)) {
          html = await buildRadicalTooltipHTML(id);
        } else {
          html = await buildEntryTooltipHTML(id);
        }
        cache.set(cacheKey, html || EMPTY_HTML);
      }

      if (!tooltipEl || currentId !== id) return;
      tooltipEl.innerHTML = html || EMPTY_HTML;
      tooltipEl.style.display = 'block';
      if (currentAnchor) {
        positionTooltip(currentAnchor);
      }
    };

    const hideTooltip = () => {
      if (!tooltipEl) return;
      tooltipEl.style.display = 'none';
      currentId = '';
      currentAnchor = null;
    };

    const onMouseOver = (event: MouseEvent) => {
      const target = resolveTooltipTarget(event.target);
      if (!target) return;

      clearHideTimer();
      clearShowTimer();
      showTimer = window.setTimeout(() => {
        showTooltip(target.anchor, target.id).catch(() => {
          if (tooltipEl) {
            tooltipEl.innerHTML = EMPTY_HTML;
            tooltipEl.style.display = 'block';
          }
        });
      }, 120);
    };

    const onMouseOut = (event: MouseEvent) => {
      if (!resolveTooltipTarget(event.target)) return;
      clearShowTimer();

      const related = event.relatedTarget;
      if (related instanceof Element && related.closest('.ui-tooltip')) {
        return;
      }

      clearHideTimer();
      hideTimer = window.setTimeout(hideTooltip, 150);
    };

    const refreshPosition = () => {
      if (!tooltipEl || tooltipEl.style.display !== 'block' || !currentAnchor || !currentId) {
        return;
      }
      positionTooltip(currentAnchor);
    };

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('scroll', refreshPosition, true);
    window.addEventListener('resize', refreshPosition);

    return () => {
      clearShowTimer();
      clearHideTimer();
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('scroll', refreshPosition, true);
      window.removeEventListener('resize', refreshPosition);
      if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
      }
    };
  }, []);
}
