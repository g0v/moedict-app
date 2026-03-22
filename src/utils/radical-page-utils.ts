export type RadicalLang = 'a' | 'c';

export interface DictionaryDefinition {
  type?: string;
  def?: string;
}

export interface DictionaryHeteronym {
  bopomofo?: string;
  pinyin?: string;
  trs?: string;
  alt?: string;
  definitions?: DictionaryDefinition[];
}

export interface DictionaryEntryResponse {
  title?: string;
  heteronyms?: DictionaryHeteronym[];
}

function decodeSafe(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripTags(input: string): string {
  return String(input || '').replace(/<[^>]*>/g, '');
}

export function normalizeRadicalVariant(input: string): string {
  return input === '靑' ? '青' : input;
}

export function normalizeRows(raw: unknown): string[][] {
  try {
    if (!raw) return [];

    if (typeof raw === 'object' && !Array.isArray(raw)) {
      const obj = raw as Record<string, unknown>;
      const keys = Object.keys(obj)
        .filter((key) => /^\d+$/.test(key))
        .map((key) => Number.parseInt(key, 10));
      const max = keys.length > 0 ? Math.max(...keys) : -1;
      const rows: string[][] = [];
      for (let i = 0; i <= max; i += 1) {
        const row = obj[String(i)];
        rows[i] = Array.isArray(row)
          ? row.filter(Boolean).map((item) => normalizeRadicalVariant(String(item)))
          : [];
      }
      return rows;
    }

    if (Array.isArray(raw) && raw.every((row) => Array.isArray(row) || row == null)) {
      return raw.map((row) =>
        Array.isArray(row) ? row.filter(Boolean).map((item) => normalizeRadicalVariant(String(item))) : []
      );
    }

    if (Array.isArray(raw)) {
      return [raw.filter(Boolean).map((item) => normalizeRadicalVariant(String(item)))];
    }

    return [];
  } catch {
    return [];
  }
}

export function normalizeTooltipId(rawId: string): string {
  const decoded = decodeSafe(String(rawId || ''));
  const normalized = decoded
    .replace(/^\.(?:\/)?/, '')
    .replace(/^\//, '')
    .replace(/^#/, '')
    .trim();
  return normalized.replace(/^([~':!]?)[`]+/, '$1').replace(/~+$/, '');
}

export function getTokenByLang(lang: RadicalLang, token: string): string {
  return lang === 'c' ? `~${token}` : token;
}

export async function fetchJsonByToken<T>(token: string): Promise<T | null> {
  const safeToken = String(token || '').trim();
  if (!safeToken) return null;
  const response = await fetch(`/api/${encodeURIComponent(safeToken)}.json`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function fetchRadicalRows(lang: RadicalLang, token: '@' | `@${string}`): Promise<string[][]> {
  const apiToken = getTokenByLang(lang, token);
  const raw = await fetchJsonByToken<unknown>(apiToken);
  return normalizeRows(raw);
}
