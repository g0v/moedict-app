export type DictionaryLang = 'a' | 't' | 'h' | 'c';

interface DictionaryResponse {
	ok: boolean;
	status: number;
	data: unknown;
}

const DICTIONARY_CACHE_LIMIT = 300;
const RESPONSE_CACHE = new Map<string, DictionaryResponse>();
const PENDING_CACHE = new Map<string, Promise<DictionaryResponse>>();

function getLangPrefix(lang: DictionaryLang): string {
	if (lang === 't') return "'";
	if (lang === 'h') return ':';
	if (lang === 'c') return '~';
	return '';
}

function normalizeWord(word: string): string {
	return String(word || '').trim();
}

function buildCacheKey(word: string, lang: DictionaryLang): string {
	return `${lang}:${word}`;
}

function writeResponseCache(cacheKey: string, value: DictionaryResponse): void {
	if (RESPONSE_CACHE.has(cacheKey)) {
		RESPONSE_CACHE.delete(cacheKey);
	}
	RESPONSE_CACHE.set(cacheKey, value);

	if (RESPONSE_CACHE.size <= DICTIONARY_CACHE_LIMIT) return;
	const oldestKey = RESPONSE_CACHE.keys().next().value as string | undefined;
	if (!oldestKey) return;
	RESPONSE_CACHE.delete(oldestKey);
}

async function requestDictionary(token: string, signal?: AbortSignal): Promise<DictionaryResponse> {
	const response = await fetch(`/api/${encodeURIComponent(token)}.json`, { signal });
	let data: unknown = {};
	try {
		data = await response.json();
	} catch {
		data = {};
	}
	return {
		ok: response.ok,
		status: response.status,
		data,
	};
}

export function readCachedDictionaryEntry(word: string, lang: DictionaryLang): DictionaryResponse | null {
	const normalized = normalizeWord(word);
	if (!normalized) return null;
	const key = buildCacheKey(normalized, lang);
	return RESPONSE_CACHE.get(key) ?? null;
}

export async function fetchDictionaryEntry(
	word: string,
	lang: DictionaryLang,
	signal?: AbortSignal
): Promise<DictionaryResponse> {
	const normalized = normalizeWord(word);
	if (!normalized) {
		throw new Error('Empty dictionary word');
	}

	const cacheKey = buildCacheKey(normalized, lang);
	const cached = RESPONSE_CACHE.get(cacheKey);
	if (cached) return cached;

	const token = `${getLangPrefix(lang)}${normalized}`;

	if (!signal) {
		const pending = PENDING_CACHE.get(cacheKey);
		if (pending) return pending;

		const request = requestDictionary(token)
			.then((result) => {
				writeResponseCache(cacheKey, result);
				return result;
			})
			.finally(() => {
				PENDING_CACHE.delete(cacheKey);
			});

		PENDING_CACHE.set(cacheKey, request);
		return request;
	}

	const result = await requestDictionary(token, signal);
	writeResponseCache(cacheKey, result);
	return result;
}

export function prefetchDictionaryEntry(word: string, lang: DictionaryLang): void {
	const normalized = normalizeWord(word);
	if (!normalized) return;
	void fetchDictionaryEntry(normalized, lang).catch(() => {
		// 預抓失敗不影響主流程
	});
}
