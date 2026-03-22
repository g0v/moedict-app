/**
 * 注音和拼音處理工具函數
 * 依原專案 decorate-ruby 流程移植。
 */

import { convertPinyinByLang, isParallelPinyin, trsToBpmf } from './pinyin-preference-utils';

export interface BopomofoPinyinData {
  ruby: string;
  youyin: string;
  bAlt: string;
  pAlt: string;
  cnSpecific: string;
  pinyin: string;
  bopomofo: string;
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, '&#39;');
}

function buildRubyBases(titleHtml: string): string {
  try {
    if (typeof DOMParser === 'undefined') {
      throw new Error('DOMParser unavailable');
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div id="wrap">${titleHtml}</div>`, 'text/html');
    const wrap = doc.getElementById('wrap');
    if (!wrap) return '';

    const out: string[] = [];
    wrap.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || '').replace(/\s+/g, '');
        for (const ch of Array.from(text)) {
          out.push(`<rb><a href="./#${encodeURIComponent(ch)}">${escapeHtml(ch)}</a></rb>`);
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const element = node as HTMLElement;
      if (element.tagName.toLowerCase() === 'a') {
        const href = element.getAttribute('href') || '';
        const text = (element.textContent || '').replace(/\s+/g, '');
        for (const ch of Array.from(text)) {
          out.push(`<rb><a href="${escapeAttr(href)}">${escapeHtml(ch)}</a></rb>`);
        }
        return;
      }

      const text = (element.textContent || '').replace(/\s+/g, '');
      for (const ch of Array.from(text)) {
        out.push(`<rb>${escapeHtml(ch)}</rb>`);
      }
    });
    return out.join('');
  } catch {
    const plain = String(titleHtml || '').replace(/<[^>]*>/g, '');
    return Array.from(plain).map((ch) => `<rb>${escapeHtml(ch)}</rb>`).join('');
  }
}

export function decorateRuby(params: {
  LANG: string;
  title?: string;
  bopomofo?: string;
  py?: string;
  pinyin?: string;
  trs?: string;
}): BopomofoPinyinData {
  const { LANG, title = '', bopomofo, py, pinyin = py, trs } = params;
  const rawPinyin = pinyin || trs || '';

  let processedPinyin = rawPinyin;
  let processedBopomofo = bopomofo || trsToBpmf(LANG, rawPinyin) || '';

  if (LANG !== 'c') {
    processedPinyin = processedPinyin.replace(/<[^>]*>/g, '').replace(/（.*）/, '');
    processedBopomofo = processedBopomofo.replace(/<[^>]*>/g, '');
  }

  processedPinyin = processedPinyin
    .replace(/ɡ/g, 'g')
    .replace(/ɑ/g, 'a')
    .replace(/，/g, ', ');

  let youyin = '';
  if (processedBopomofo.match(/^（[語|讀|又]音）/)) {
    youyin = processedBopomofo.replace(/（([語|讀|又]音)）.*/, '$1');
  }

  let bAlt = '';
  if (processedBopomofo.match(/[變|/]/)) {
    bAlt = processedBopomofo.replace(/.*[(變)\u200B|/](.*)/, '$1');
  } else if (processedBopomofo.match(/.+（又音）.+/)) {
    bAlt = processedBopomofo.replace(/.+（又音）/, '');
  }
  bAlt = bAlt.replace(/ /g, '\u3000').replace(/([ˇˊˋ])\u3000/g, '$1 ');

  let pAlt = '';
  if (processedPinyin.match(/[變|/]/)) {
    pAlt = processedPinyin.replace(/.*[(變)\u200B|/](.*)/, '$1');
  } else if (processedBopomofo.match(/.+（又音）.+/)) {
    const pyArray = processedPinyin.split(' ');
    for (let i = 0; i < pyArray.length / 2 - 1; i += 1) {
      pyArray.shift();
    }
    pAlt = pyArray.join(' ');
  }

  processedBopomofo = processedBopomofo
    .replace(/([^ ])(ㄦ)/g, '$1 $2')
    .replace(/([ ]?[\u3000][ ]?)/g, ' ')
    .replace(/([ˇˊˋ˪˫])[ ]?/g, '$1 ')
    .replace(/([ㆴㆵㆶㆷ][̍͘]?)/g, '$1 ');

  let cnSpecific = '';
  if (processedBopomofo.match(/陸/)) {
    cnSpecific = 'cn-specific';
  }

  let b = processedBopomofo
    .replace(/\s?[，、；！。－—,.;]\s?/g, ' ')
    .replace(/（[語|讀|又]音）[\u200B]?/, '')
    .replace(/\(變\)\u200B\/.*/, '')
    .replace(/\/.*/, '');

  let cnSpecificBpmf = '';
  if (b.match(/<br>陸/)) {
    cnSpecificBpmf = b.replace(/.*<br>陸./, '');
  }
  b = b.replace(/<br>(.*)/, '').replace(/.\u20DF/g, '');

  let ruby = buildRubyBases(title);

  const p = processedPinyin
    .replace(/\(變\)\u200B.*/, '')
    .replace(/\/.*/, '')
    .replace(/<br>.*/, '');

  const convertedP = convertPinyinByLang(LANG, p, false);
  const pArray = convertedP.replace(/[,.;，、；！。－—]\s?/g, ' ').split(' ');
  const originalPArray = p.replace(/[,.;，、；！。－—]\s?/g, ' ').split(' ');

  const pUpper: string[] = [];
  const isParallel = isParallelPinyin(LANG);

  for (let idx = 0; idx < pArray.length; idx += 1) {
    const yin = pArray[idx];
    let span = '';

    if (LANG === 't' && yin.match(/[-\u2011]/g)) {
      const matches = yin.match(/[-\u2011]+/g);
      span = ` rbspan="${(matches ? matches.length : 0) + 1}"`;
    } else if (LANG !== 't' && yin.match(/^[^eēéěè].*r\d?$/) && !yin.match(/^(j|ch|sh)r$/)) {
      if (cnSpecificBpmf) {
        const cns = cnSpecificBpmf.split(/\s+/);
        const tws = b.split(/\s+/);
        tws[tws.length - 2] = cns[cns.length - 2];
        bAlt = b.replace(/ /g, '\u3000').replace(/\sㄦ$/, 'ㄦ');
        b = tws.join(' ');
      }
      span = ' rbspan="2"';
    } else if (LANG !== 't' && yin.match(/[aāáǎàeēéěèiīíǐìoōóǒòuūúǔùüǖǘǚǜ]+/g)) {
      const matches = yin.match(/[aāáǎàeēéěèiīíǐìoōóǒòuūúǔùüǖǘǚǜ]+/g);
      span = ` rbspan="${matches ? matches.length : 1}"`;
    }

    pUpper[idx] = isParallel ? `<rt${span}>${originalPArray[idx]}</rt>` : '';
    pArray[idx] = `<rt${span}>${yin}</rt>`;
  }

  ruby += `<rtc class="zhuyin" hidden="hidden"><rt>${b.replace(/[ ]+/g, '</rt><rt>')}</rt></rtc>`;
  ruby += '<rtc class="romanization" hidden="hidden">';
  ruby += pArray.join('');
  ruby += '</rtc>';

  if (isParallel) {
    ruby += '<rtc class="romanization" hidden="hidden">';
    ruby += pUpper.join('');
    ruby += '</rtc>';
  }

  if (LANG === 'c') {
    if (processedBopomofo.match(/<br>/)) {
      processedPinyin = processedPinyin.replace(/.*<br>/, '').replace(/陸./, '').replace(/\s?([,.;])\s?/g, '$1 ');
      processedBopomofo = processedBopomofo.replace(/.*<br>/, '').replace(/陸./, '').replace(/\s?([，！。；])\s?/g, '$1');
      processedBopomofo = processedBopomofo.replace(/ /g, '\u3000').replace(/([ˇˊˋ])\u3000/g, '$1 ');
    } else {
      processedPinyin = '';
      processedBopomofo = '';
    }
  } else if (LANG === 'h') {
    processedBopomofo = '';
  }

  return {
    ruby,
    youyin,
    bAlt,
    pAlt,
    cnSpecific,
    pinyin: processedPinyin,
    bopomofo: processedBopomofo,
  };
}

export function formatBopomofo(bopomofo: string): string {
  if (!bopomofo) return '';
  return bopomofo.replace(/([ˇˊˋ˪˫])/g, '<span class="tone">$1</span>');
}

export function formatPinyin(pinyin: string): string {
  if (!pinyin) return '';
  return pinyin.replace(/([āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ])/g, '<span class="tone">$1</span>');
}

// 去除注音符號
export function removeBopomofo(str: string) {
  return str.replace(/[\u3105-\u312F\u31A0-\u31BF\u02D9\u02CA\u02C7\u02CB]/g, '');
}