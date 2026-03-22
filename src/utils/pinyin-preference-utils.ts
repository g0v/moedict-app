import { PINYIN_MAP } from './pinyin-map';

type Lang = string;

function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getPreferredSystem(lang: Lang): string {
  if (lang === 'a') return readLocalStorage('pinyin_a') || 'HanYu';
  if (lang === 't') return readLocalStorage('pinyin_t') || 'TL';
  if (lang === 'h') return readLocalStorage('pinyin_h') || 'TH';
  return '';
}

export function isParallelPinyin(lang: Lang): boolean {
  const system = getPreferredSystem(lang);
  if (lang === 'a') return /^HanYu-/.test(system);
  if (lang === 't') return /^TL-/.test(system);
  return false;
}

const DT_TONES: Record<string, string> = {
  '\u0300': '\u0332',
  '\u0301': '\u0300',
  '\u0302': '\u0306',
  '\u0304': '\u0304',
  '\u0305': '\u0305',
  '\u0306': '\u0301',
  '\u0307': '\u200B',
  '\u030D': '\u200B',
};

const DT_TONES_SANDHI: Record<string, string> = {
  '\u0300': '',
  '\u0332': '\u0300',
  '\u0306': '\u0304',
  '\u0304': '\u0332',
};

const PFS_TONE_MARK_MAP: Record<string, string> = {
  '\u00B2\u2074': '\u0302',
  '\u00B9\u00B9': '\u0300',
  '\u00B3\u00B9': '\u0301',
  '\u2075\u2075': '',
  '\u00B2': '',
  '\u2075': '\u030D',
};

function toneSandhi(segment: string): string {
  if (!/\w/.test(segment)) return segment;
  if (/[aeiou]r?[hptk]/i.test(segment)) {
    return segment.replace(/([aioue])/i, '$1\u0332');
  }
  if (!/[\u0300\u0332\u0306\u0304]/.test(segment)) {
    if (!/[aioue]/i.test(segment)) {
      return segment.replace(/([nm])/i, '$1\u0304');
    }
    return segment.replace(/([aioue])/i, '$1\u0304');
  }
  if (/[aeiou]\u0304r?[ptk]/i.test(segment)) {
    return segment.replace(/\u0304/g, '');
  }
  if (/[aeiou]\u0304r?h/i.test(segment)) {
    return segment.replace(/\u0304/g, '\u0300');
  }
  return segment.replace(/([\u0300\u0332\u0306\u0304])/g, (tone) => DT_TONES_SANDHI[tone] ?? tone);
}

function tonePoj(segment: string): string {
  const toneMatch = segment.match(/([\u0300-\u0302\u0304\u0306\u0307\u030D])/);
  if (!toneMatch) return segment;

  const tone = toneMatch[1];
  let noTone = segment.replace(/[\u0300-\u0302\u0304\u0306\u0307\u030D]/g, '');
  if (/oa[inht]/i.test(noTone)) return noTone.replace(/(oa)([inht])/i, `$1${tone}$2`);
  if (/oeh/i.test(noTone)) return noTone.replace(/(oe)(h)/i, `$1${tone}$2`);
  if (/o/i.test(noTone)) return noTone.replace(/(o)/i, `$1${tone}`);
  if (/e/i.test(noTone)) return noTone.replace(/(e)/i, `$1${tone}`);
  if (/a/i.test(noTone)) return noTone.replace(/(a)/i, `$1${tone}`);
  if (/u/i.test(noTone)) return noTone.replace(/(u)/i, `$1${tone}`);
  if (/i/i.test(noTone)) return noTone.replace(/(i)/i, `$1${tone}`);
  if (/ng/i.test(noTone)) return noTone.replace(/(n)(g)/i, `$1${tone}$2`);
  if (/m/i.test(noTone)) return noTone.replace(/(m)/i, `$1${tone}`);
  noTone += tone;
  return noTone;
}

function toneToPfs(segment: string): string {
  const parts = segment.split(/([\u00B9\u00B2\u00B3\u2074\u2075]+)/);
  if (parts.length < 2) return segment;
  const syllable = parts[0];
  const tone = parts[1];
  const mark = PFS_TONE_MARK_MAP[tone];
  if (mark === undefined) return segment;

  const vowels = ['o', 'e', 'a', 'u', 'i', '\u1E73', 'n', 'm'];
  for (const vowel of vowels) {
    const pos = syllable.indexOf(vowel);
    if (pos >= 0) {
      const before = syllable.slice(0, pos + 1);
      const after = syllable.slice(pos + 1);
      return `${before}${mark}${after} `;
    }
  }
  return segment;
}

function thToPfs(input: string): string {
  const normalized = input
    .replace(/t/g, 'th')
    .replace(/p/g, 'ph')
    .replace(/k/g, 'kh')
    .replace(/c/g, 'chh')
    .replace(/b/g, 'p')
    .replace(/d/g, 't')
    .replace(/g/g, 'k')
    .replace(/nk/g, 'ng')
    .replace(/j/g, 'ch')
    .replace(/q/g, 'chh')
    .replace(/x/g, 's')
    .replace(/z/g, 'ch')
    .replace(/ii/g, '\u1E73')
    .replace(/ua/g, 'oa')
    .replace(/ue/g, 'oe')
    .replace(/\bi/g, 'y')
    .replace(/\by(\b|[ptk])h?/g, 'yi$1')
    .replace(/(i[ptk])h/g, '$1')
    .replace(/y([mn])/g, 'yi$1');

  const segs = normalized.split(/([^\u00B9\u00B2\u00B3\u2074\u2075]+[\u00B9\u00B2\u00B3\u2074\u2075]+)/);
  let result = '';
  for (const seg of segs) {
    if (!seg) continue;
    result += toneToPfs(seg);
  }
  return result.trim();
}

function convertPinyinT(yin: string, isBody = true): string {
  const system = getPreferredSystem('t');
  if (system === 'TL') return yin;

  if (/DT$/.test(system)) {
    let converted = yin
      .replace(/ph(\w)/g, 'PH$1')
      .replace(/b(\w)/g, 'bh$1')
      .replace(/p(\w)/g, 'b$1')
      .replace(/PH(\w)/g, 'p$1')
      .replace(/tsh/g, 'c')
      .replace(/ts/g, 'z')
      .replace(/th(\w)/g, 'TH$1')
      .replace(/t(\w)/g, 'd$1')
      .replace(/TH(\w)/g, 't$1')
      .replace(/kh(\w)/g, 'KH$1')
      .replace(/g(\w)/g, 'gh$1')
      .replace(/k(\w)/g, 'g$1')
      .replace(/KH(\w)/g, 'k$1')
      .replace(/j/g, 'r')
      .replace(/Ph(\w)/g, 'pH$1')
      .replace(/B(\w)/g, 'Bh$1')
      .replace(/P(\w)/g, 'B$1')
      .replace(/pH(\w)/g, 'P$1')
      .replace(/Tsh/g, 'C')
      .replace(/Ts/g, 'Z')
      .replace(/Th(\w)/g, 'tH$1')
      .replace(/T(\w)/g, 'D$1')
      .replace(/tH(\w)/g, 'T$1')
      .replace(/Kh(\w)/g, 'kH$1')
      .replace(/G(\w)/g, 'Gh$1')
      .replace(/K(\w)/g, 'G$1')
      .replace(/kH(\w)/g, 'K$1')
      .replace(/J/g, 'R')
      .replace(/o([^.!?,\w\s\u2011]*)o/g, 'O$1O')
      .replace(/o([^.!?,\w\s\u2011]*)(?![^\w\s\u2011]*[knm])/g, 'o$1r')
      .replace(/O([^\w\s\u2011]*)O/g, 'o$1')
      .replace(/O([^.!?,\w\s\u2011]*)o([^.!?,\w\s\u2011]*)r?/g, 'O$1$2')
      .replace(/([\u0300-\u0302\u0304\u0307\u030D])/g, (tone) => DT_TONES[tone] ?? tone)
      .replace(/([aeiou])(r?[ptkh])/g, '$1\u0304$2')
      .replace(/\u200B/g, '')
      .replace(/[-\u2011][-\u2011]([aeiou])(?![\u0300\u0332\u0306\u0304])/g, '$1\u030A')
      .replace(/[-\u2011][-\u2011](\u0101|a\u0304)/g, '\u2011\u2011a\u030A')
      .replace(/[-\u2011][-\u2011](\u014D|o\u0304)/g, '\u2011\u2011o\u030A')
      .replace(/[-\u2011][-\u2011](\u012B|i\u0304)/g, '\u2011\u2011i\u030A')
      .replace(/[-\u2011][-\u2011](\u0113|e\u0304)/g, '\u2011\u2011e\u030A')
      .replace(/[-\u2011][-\u2011](\u016B|u\u0304)/g, '\u2011\u2011u\u030A')
      .replace(/nn($|[-\s])/g, '\u207F$1');

    if (isBody) {
      converted = converted.replace(
        /((?:[^\.,!?]*(?:\w[^-\.,!?\w\s\u2011]*)[- \u2011])+)(\w)/g,
        (_, prefix: string, tail: string) => prefix.split(/([- \u2011\.,!?])/).map((seg) => toneSandhi(seg)).join('') + tail,
      );
    } else {
      converted = converted.replace(
        /((?:\S*(?:\w[^\w\s\u2011]*)\u2011)+)(\w)/g,
        (_, prefix: string, tail: string) => prefix.split('\u2011').map((seg) => toneSandhi(seg)).join('\u2011') + tail,
      );
    }

    converted = converted.replace(/\u0332(\w*[ \u2011]a(?:[ -\u2011]|\u0300(?![-\w\u2011])))/g, '\u0304$1');
    converted = converted.replace(/\u0300(\w*[ \u2011]a(?:[ -\u2011]|\u0300(?![-\w\u2011])))/g, '$1');
    return converted;
  }

  const poj = yin
    .replace(/(o)([^.!?,\w\s\u2011]*)o/gi, '$1$2\u0358')
    .replace(/ts/g, 'ch')
    .replace(/Ts/g, 'Ch')
    .replace(/u([^\w\s\u2011.!?,-]*)a/g, 'o$1a')
    .replace(/u([^\w\s\u2011.!?,-]*)e/g, 'o$1e')
    .replace(/i([^\w\s\u2011.!?,-]*)k($|[-\u2011\s])/g, 'e$1k$2')
    .replace(/i([^\w\s\u2011.!?,-]*)ng/g, 'e$1ng')
    .replace(/nn($|[-\u2011\s])/g, '\u207F$1')
    .replace(/nnh($|[-\u2011\s])/g, 'h\u207F$1')
    .replace(/([ie])r/g, '$1\u0358')
    .replace(/\u030B/g, '\u0306');

  return poj.split(/([- \u2011\.,!?])/).map((seg) => tonePoj(seg)).join('');
}

function convertPinyinH(yin: string): string {
  const system = getPreferredSystem('h');
  if (system === 'PFS') return thToPfs(yin);
  return yin;
}

function convertPinyinA(yin: string): string {
  const system = getPreferredSystem('a');
  const mapName = system.replace(/^HanYu-/, '');
  const map = PINYIN_MAP[mapName as keyof typeof PINYIN_MAP];
  if (!map) return yin;
  if (/\s/.test(yin)) {
    return yin
      .split(/\s+/)
      .map((token) => convertPinyinA(token))
      .join(' ');
  }

  let tone = 5;
  if (/[āōēīūǖ]/.test(yin)) tone = 1;
  if (/[áóéíúǘ]/.test(yin)) tone = 2;
  if (/[ǎǒěǐǔǚ]/.test(yin)) tone = 3;
  if (/[àòèìùǜ]/.test(yin)) tone = 4;

  let base = yin
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ūúǔù]/g, 'u')
    .replace(/[üǖǘǚǜ]/g, 'v');

  let rSuffix = '';
  if (/^[^eēéěè].*r/.test(base)) {
    rSuffix = 'r';
    base = base.replace(/r$/, '');
  }

  base = map[base.replace(/\u200B/g, '') as keyof typeof map] || base;

  if (/a/.test(base)) base = base.replace(/a/, 'aāáǎàa'[tone]);
  else if (/o/.test(base)) base = base.replace(/o/, 'oōóǒòo'[tone]);
  else if (/e/.test(base)) base = base.replace(/e/, 'eēéěèe'[tone]);
  else if (/ui/.test(base)) base = base.replace(/i/, 'iīíǐìi'[tone]);
  else if (/u/.test(base)) base = base.replace(/u/, 'uūúǔùu'[tone]);
  else if (/ü/.test(base)) base = base.replace(/ü/, 'üǖǘǚǜü'[tone]);
  else if (/i/.test(base)) base = base.replace(/i/, 'iīíǐìi'[tone]);

  return `${base}${rSuffix}`;
}

export function convertPinyinByLang(lang: Lang, source: string, isBody = true): string {
  const yin = String(source || '').replace(/-/g, '\u2011');
  if (!yin) return '';
  if (lang === 't') return convertPinyinT(yin, isBody);
  if (lang === 'h') return convertPinyinH(yin);
  if (lang === 'a') return convertPinyinA(yin);
  return yin;
}

const TAIWANESE_CONSONANTS: Record<string, string> = {
  p: 'ㄅ', b: 'ㆠ', ph: 'ㄆ', m: 'ㄇ',
  t: 'ㄉ', th: 'ㄊ', n: 'ㄋ', l: 'ㄌ',
  k: 'ㄍ', g: 'ㆣ', kh: 'ㄎ', ng: 'ㄫ',
  h: 'ㄏ', tsi: 'ㄐ', ji: 'ㆢ', tshi: 'ㄑ',
  si: 'ㄒ', ts: 'ㄗ', j: 'ㆡ', tsh: 'ㄘ', s: 'ㄙ',
};

const TAIWANESE_VOWELS: Record<string, string> = {
  a: 'ㄚ', an: 'ㄢ', ang: 'ㄤ', ann: 'ㆩ',
  oo: 'ㆦ', onn: 'ㆧ', o: 'ㄜ', e: 'ㆤ',
  enn: 'ㆥ', ai: 'ㄞ', ainn: 'ㆮ', au: 'ㄠ',
  aunn: 'ㆯ', am: 'ㆰ', om: 'ㆱ', m: 'ㆬ',
  ong: 'ㆲ', ng: 'ㆭ', i: 'ㄧ', inn: 'ㆪ',
  u: 'ㄨ', unn: 'ㆫ', ing: 'ㄧㄥ', in: 'ㄧㄣ', un: 'ㄨㄣ',
};

const TAIWANESE_TONES: Record<string, string> = {
  p: 'ㆴ', t: 'ㆵ', k: 'ㆶ', h: 'ㆷ',
  'p$': 'ㆴ\u0358', 't$': 'ㆵ\u0358', 'k$': 'ㆶ\u0358', 'h$': 'ㆷ\u0358',
  '\u0300': '˪', '\u0301': 'ˋ', '\u0302': 'ˊ', '\u0304': '˫', '\u030D': '$',
};

const V_RE = new RegExp(Object.keys(TAIWANESE_VOWELS).sort((a, b) => b.length - a.length).join('|'), 'g');
const CV_RE = new RegExp(`^(${Object.keys(TAIWANESE_CONSONANTS).sort((a, b) => b.length - a.length).join('|')})((?:${Object.keys(TAIWANESE_VOWELS).sort((a, b) => b.length - a.length).join('|')})+[ptkh]?)$`);

export function trsToBpmf(lang: Lang, trs: string): string {
  if (lang === 'h') return ' ';
  if (lang === 'a' || lang === 'c') return trs;

  return String(trs || '')
    .replace(/[A-Za-z\u0300-\u030D]+/g, (chunk) => {
      let tone = '';
      let token = chunk.toLowerCase();
      token = token.replace(/([\u0300-\u0302\u0304\u030D])/g, (mark) => {
        tone = TAIWANESE_TONES[mark] || tone;
        return '';
      });
      token = token.replace(/^(tsh?|[sj])i/, '$1ii');
      token = token.replace(/ok$/, 'ook');
      token = token.replace(CV_RE, (_, consonant: string, rest: string) => `${TAIWANESE_CONSONANTS[consonant] || consonant}${rest}`);
      token = token.replace(/[ptkh]$/, (ending) => {
        tone = TAIWANESE_TONES[`${ending}${tone}`] || tone;
        return '';
      });
      token = token.replace(V_RE, (vowel) => TAIWANESE_VOWELS[vowel] || vowel);
      return token + (tone || '\uFFFD');
    })
    .replace(/[- ]/g, '')
    .replace(/\uFFFD/g, ' ')
    .replace(/[.?!,] ?/g, '');
}
