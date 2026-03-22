/// <reference lib="webworker" />

import Fuse from 'fuse.js';
import type { FuseResult, IFuseOptions } from 'fuse.js';

type Lang = 'a' | 't' | 'h' | 'c';

interface SearchDoc {
	t: string;
	c: string;
}

interface SearchState {
	fuse: Fuse<SearchDoc>;
	docs: SearchDoc[];
}

interface RankedSearchResult {
	doc: SearchDoc;
	fuseResult?: FuseResult<SearchDoc>;
}

interface WarmupMessage {
	type: 'warmup';
	lang: Lang;
}

interface SearchMessage {
	type: 'search';
	lang: Lang;
	query: string;
	limit: number;
	requestId: number;
}

type WorkerMessage = WarmupMessage | SearchMessage;

const SEARCH_OPTIONS: IFuseOptions<SearchDoc> = {
	includeMatches: true,
	ignoreLocation: true,
	minMatchCharLength: 2,
	threshold: 0.35,
	keys: [
		{ name: 't', weight: 0.7 },
		{ name: 'c', weight: 0.3 },
	],
};

const searchStatePromises = new Map<Lang, Promise<SearchState>>();

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isLatinAlphabetQuery(query: string): boolean {
	const parts = query.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return false;
	}

	return parts.every((part) => /^\p{Script=Latin}+$/u.test(part));
}

function buildLatinWholeWordRegex(query: string): RegExp {
	const phrasePattern = query
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => escapeRegExp(part))
		.join('\\s+');

	return new RegExp(`(^|[^\\p{Script=Latin}])${phrasePattern}($|[^\\p{Script=Latin}])`, 'iu');
}

function prioritizeLatinWholeWordMatches(
	query: string,
	results: FuseResult<SearchDoc>[],
): FuseResult<SearchDoc>[] {
	if (!isLatinAlphabetQuery(query) || results.length <= 1) {
		return results;
	}

	const wholeWordMatcher = buildLatinWholeWordRegex(query);

	return results
		.map((result, index) => ({
			result,
			index,
			hasWholeWordMatch:
				wholeWordMatcher.test(result.item.t) || wholeWordMatcher.test(result.item.c),
		}))
		.sort((a, b) => {
			if (a.hasWholeWordMatch === b.hasWholeWordMatch) {
				return a.index - b.index;
			}

			return a.hasWholeWordMatch ? -1 : 1;
		})
		.map(({ result }) => result);
}

function collectLatinWholeWordDocs(
	query: string,
	docs: SearchDoc[],
	limit: number,
): SearchDoc[] {
	if (!isLatinAlphabetQuery(query) || docs.length === 0 || limit <= 0) {
		return [];
	}

	const wholeWordMatcher = buildLatinWholeWordRegex(query);
	const matches: SearchDoc[] = [];
	for (const doc of docs) {
		if (wholeWordMatcher.test(doc.t) || wholeWordMatcher.test(doc.c)) {
			matches.push(doc);
			if (matches.length >= limit) {
				break;
			}
		}
	}

	return matches;
}

function trimSnippet(content: string, start = 0, end = 90): string {
	const safeStart = Math.max(0, start);
	const safeEnd = Math.min(content.length, end);
	let snippet = content.slice(safeStart, safeEnd).trim();

	if (safeStart > 0 && snippet) {
		snippet = `…${snippet}`;
	}

	if (safeEnd < content.length && snippet) {
		snippet = `${snippet}…`;
	}

	return snippet;
}

function buildSnippet(result: FuseResult<SearchDoc>): string {
	const content = result.item.c.trim();
	if (!content) {
		return '';
	}

	const contentMatch = result.matches?.find((match) => match.key === 'c' && match.indices.length > 0);
	if (!contentMatch) {
		return trimSnippet(content);
	}

	const [matchStart, matchEnd] = contentMatch.indices[0];
	return trimSnippet(content, matchStart - 18, matchEnd + 42);
}

async function loadSearchState(lang: Lang): Promise<SearchState> {
	const response = await fetch(`/api/search-index/${lang}.json`, {
		headers: { Accept: 'application/json' },
	});

	if (!response.ok) {
		throw new Error(`全文索引讀取失敗：${response.status}`);
	}

	const docs = (await response.json()) as SearchDoc[];
	return {
		docs,
		fuse: new Fuse(docs, SEARCH_OPTIONS),
	};
}

function getSearchState(lang: Lang): Promise<SearchState> {
	const cached = searchStatePromises.get(lang);
	if (cached) {
		return cached;
	}

	const pending = loadSearchState(lang).catch((error) => {
		searchStatePromises.delete(lang);
		throw error;
	});

	searchStatePromises.set(lang, pending);
	return pending;
}

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
	const message = event.data;

	try {
		const state = await getSearchState(message.lang);

		if (message.type === 'warmup') {
			self.postMessage({ type: 'ready', lang: message.lang });
			return;
		}

		const normalizedQuery = message.query.trim();
		const latinQuery = isLatinAlphabetQuery(normalizedQuery);
		const candidateLimit = latinQuery
			? Math.min(200, Math.max(message.limit * 5, 50))
			: message.limit;
		const fuseResults = state.fuse.search(normalizedQuery, { limit: candidateLimit });
		const prioritizedFuseResults = prioritizeLatinWholeWordMatches(normalizedQuery, fuseResults);
		const rankedResults = (() => {
			if (!latinQuery) {
				return prioritizedFuseResults.slice(0, message.limit).map((fuseResult) => ({
					doc: fuseResult.item,
					fuseResult,
				}));
			}

			const wholeWordMatcher = buildLatinWholeWordRegex(normalizedQuery);
			const wholeWordFromAllDocs = collectLatinWholeWordDocs(
				normalizedQuery,
				state.docs,
				Math.min(1200, Math.max(message.limit * 8, 300)),
			);
			const mergedDocs = new Map<string, RankedSearchResult>();
			const addDoc = (ranked: RankedSearchResult) => {
				mergedDocs.set(`${ranked.doc.t}\u0000${ranked.doc.c}`, ranked);
			};

			for (const result of prioritizedFuseResults) {
				const doc = result.item;
				if (wholeWordMatcher.test(doc.t) || wholeWordMatcher.test(doc.c)) {
					addDoc({ doc, fuseResult: result });
				}
			}
			for (const doc of wholeWordFromAllDocs) {
				addDoc({ doc });
			}
			for (const result of prioritizedFuseResults) {
				addDoc({ doc: result.item, fuseResult: result });
			}

			return Array.from(mergedDocs.values()).slice(0, message.limit);
		})();
		const results = rankedResults.map((result) => ({
			title: result.doc.t,
			snippet: result.fuseResult ? buildSnippet(result.fuseResult) : trimSnippet(result.doc.c),
		}));

		self.postMessage({
			type: 'results',
			lang: message.lang,
			requestId: message.requestId,
			results,
		});
	} catch (error) {
		self.postMessage({
			type: 'error',
			lang: message.lang,
			requestId: message.type === 'search' ? message.requestId : undefined,
			message: error instanceof Error ? error.message : '全文索引載入失敗',
		});
	}
});
