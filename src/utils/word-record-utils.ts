export type DictionaryLang = 'a' | 't' | 'h' | 'c';

const STARRED_KEY_PREFIX = 'starred-';
const LRU_KEY_PREFIX = 'lru-';
const LAST_LANG_KEY = 'lang';
const LAST_WORD_KEY = 'prev-id';
const STARRED_SLASH = decodeURIComponent('%5C');
const STARRED_SUFFIX = `${STARRED_SLASH}n`;

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // noop
  }
}

function safeRemoveItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // noop
  }
}

function normalizeWord(word: string): string {
  if (!word) return '';
  let next = word;
  try {
    const decoded = decodeURIComponent(next);
    if (decoded) next = decoded;
  } catch {
    // noop
  }
  try {
    next = String(next).trim();
  } catch {
    return '';
  }
  return next;
}

function normalizeLang(lang: string): DictionaryLang {
  if (lang === 't' || lang === 'h' || lang === 'c') return lang;
  return 'a';
}

export function getStarredStorageKey(lang: DictionaryLang): string {
  return `${STARRED_KEY_PREFIX}${lang}`;
}

export function getLRUStorageKey(lang: DictionaryLang): string {
  return `${LRU_KEY_PREFIX}${lang}`;
}

export function buildStarKey(word: string): string {
  return `"${word}"${STARRED_SUFFIX}`;
}

function ensureStarred(lang: DictionaryLang): string {
  const key = getStarredStorageKey(lang);
  let value = safeGetItem(key);
  if (value == null) {
    safeSetItem(key, '');
    value = '';
  }
  return value;
}

export function hasStarWord(lang: DictionaryLang, rawWord: string): boolean {
  const word = normalizeWord(rawWord);
  if (!word) return false;
  const data = ensureStarred(lang) || '';
  return data.indexOf(buildStarKey(word)) >= 0;
}

export function addStarWord(lang: DictionaryLang, rawWord: string): void {
  const word = normalizeWord(rawWord);
  if (!word) return;
  const key = getStarredStorageKey(lang);
  const current = ensureStarred(lang) || '';
  if (current.indexOf(buildStarKey(word)) >= 0) return;
  safeSetItem(key, buildStarKey(word) + current);
}

export function removeStarWord(lang: DictionaryLang, rawWord: string): void {
  const word = normalizeWord(rawWord);
  if (!word) return;
  const key = getStarredStorageKey(lang);
  const current = ensureStarred(lang) || '';
  const next = current.split(buildStarKey(word)).join('');
  safeSetItem(key, next);
}

export function parseStarredWords(raw: string): string[] {
  const list: string[] = [];
  if (typeof raw !== 'string' || !raw) return list;
  const seen: Record<string, 1> = Object.create(null) as Record<string, 1>;
  const re = /"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const word = match[1];
    if (!word || seen[word]) continue;
    seen[word] = 1;
    list.push(word);
  }
  return list;
}

export function parseLRUWords(raw: string): string[] {
  const list: string[] = [];
  if (!raw) return list;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const value of parsed) {
        if (typeof value === 'string' && value) list.push(value);
      }
      return list;
    }
  } catch {
    // noop
  }

  const seen: Record<string, 1> = Object.create(null) as Record<string, 1>;
  const re = /"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const word = match[1];
    if (!word || seen[word]) continue;
    seen[word] = 1;
    list.push(word);
  }
  return list;
}

export function readStarredWords(lang: DictionaryLang): string[] {
  const raw = safeGetItem(getStarredStorageKey(lang)) || '';
  return parseStarredWords(raw);
}

export function readLRUWords(lang: DictionaryLang): string[] {
  const raw = safeGetItem(getLRUStorageKey(lang)) || '';
  return parseLRUWords(raw);
}

export function clearLRUWords(lang: DictionaryLang): void {
  safeRemoveItem(getLRUStorageKey(lang));
}

export function clearStarredWords(lang: DictionaryLang): void {
  safeRemoveItem(getStarredStorageKey(lang));
}

export function shouldRecordWord(rawWord: string): boolean {
  const word = normalizeWord(rawWord);
  if (!word) return false;
  if (word === '#') return false;
  if (word === 'about.html' || word.startsWith('about')) return false;
  if (word === '=*' || word.startsWith('=')) return false;
  if (word.includes('/')) return false;
  if (/\.(html|json|png|jpg|jpeg|gif|svg|css|js)$/i.test(word)) return false;
  return true;
}

export function addToLRU(rawWord: string, lang: DictionaryLang): void {
  if (!rawWord || rawWord === '=*') return;
  const word = normalizeWord(rawWord);
  if (!shouldRecordWord(word)) return;

  const key = getLRUStorageKey(lang);
  const raw = safeGetItem(key);
  let words: string[] = [];
  try {
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        words = parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
      }
    }
  } catch {
    words = [];
  }

  words = words.filter((existing) => {
    if (existing === word) return false;
    try {
      return decodeURIComponent(existing) !== word;
    } catch {
      return true;
    }
  });

  words.unshift(word);
  if (words.length > 50) words = words.slice(0, 50);
  safeSetItem(key, JSON.stringify(words));
}

export function writeLastLookup(rawWord: string, lang: DictionaryLang): void {
  const word = normalizeWord(rawWord);
  if (!shouldRecordWord(word)) return;
  safeSetItem(LAST_LANG_KEY, normalizeLang(lang));
  safeSetItem(LAST_WORD_KEY, word);
}

export function readLastLookup(): { lang: DictionaryLang; word: string } | null {
  const word = normalizeWord(safeGetItem(LAST_WORD_KEY) || '');
  if (!shouldRecordWord(word)) return null;
  const lang = normalizeLang(safeGetItem(LAST_LANG_KEY) || 'a');
  return { lang, word };
}
