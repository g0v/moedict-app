import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type Lang = 'a' | 't' | 'h' | 'c';

interface FullTextSearchProps {
	currentLang: Lang;
}

interface SearchResultItem {
	title: string;
	snippet: string;
}

type WorkerReadyMessage = {
	type: 'ready';
	lang: Lang;
};

type WorkerResultsMessage = {
	type: 'results';
	lang: Lang;
	requestId: number;
	results: SearchResultItem[];
};

type WorkerErrorMessage = {
	type: 'error';
	lang: Lang;
	requestId?: number;
	message: string;
};

type SearchWorkerMessage = WorkerReadyMessage | WorkerResultsMessage | WorkerErrorMessage;

const MIN_QUERY_LENGTH = 2;
const SEARCH_RESULT_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 180;

let sharedWorker: Worker | null = null;

function getSearchWorker(): Worker | null {
	if (typeof window === 'undefined') {
		return null;
	}

	if (!sharedWorker) {
		sharedWorker = new Worker(new URL('../workers/full-text-search.worker.ts', import.meta.url), {
			type: 'module',
		});
	}

	return sharedWorker;
}

function formatSearchPath(term: string, lang: Lang): string {
	const prefix = lang === 'a' ? '' : lang === 't' ? "'" : lang === 'h' ? ':' : '~';
	return `/${prefix}${term.trim()}`;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedText(text: string, keyword: string): ReactNode {
	const trimmedKeyword = keyword.trim();
	if (!trimmedKeyword || text.length === 0) {
		return text;
	}

	const matcher = new RegExp(`(${escapeRegExp(trimmedKeyword)})`, 'gi');
	const segments = text.split(matcher);
	if (segments.length <= 1) {
		return text;
	}

	return segments.map((segment, index) => {
		if (segment.toLocaleLowerCase() === trimmedKeyword.toLocaleLowerCase()) {
			return (
				<mark key={`${segment}-${index}`} className="fulltext-search-highlight">
					{segment}
				</mark>
			);
		}
		return <span key={`${segment}-${index}`}>{segment}</span>;
	});
}

export function FullTextSearch({ currentLang }: FullTextSearchProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const containerRef = useRef<HTMLDivElement | null>(null);
	const latestRequestIdRef = useRef(0);
	const readyLangsRef = useRef<Set<Lang>>(new Set());
	const debounceTimerRef = useRef<number | null>(null);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResultItem[]>([]);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const isLangReady = readyLangsRef.current.has(currentLang);

	const openResult = useCallback(
		(result: SearchResultItem | undefined) => {
			if (!result) return;
			setIsOpen(false);
			navigate(formatSearchPath(result.title, currentLang));
		},
		[currentLang, navigate]
	);

	const requestWarmup = useCallback(() => {
		if (readyLangsRef.current.has(currentLang)) {
			return;
		}

		const worker = getSearchWorker();
		if (!worker) return;

		setIsLoading(true);
		setErrorMessage('');
		worker.postMessage({ type: 'warmup', lang: currentLang });
	}, [currentLang]);

	useEffect(() => {
		const worker = getSearchWorker();
		if (!worker) return;

		const handleMessage = (event: MessageEvent<SearchWorkerMessage>) => {
			const message = event.data;

			if (message.lang !== currentLang) {
				if (message.type === 'ready') {
					readyLangsRef.current.add(message.lang);
				}
				return;
			}

			if (message.type === 'ready') {
				readyLangsRef.current.add(message.lang);
				setIsLoading(false);
				setErrorMessage('');
				return;
			}

			if (message.type === 'error') {
				if (message.requestId && message.requestId !== latestRequestIdRef.current) {
					return;
				}

				setIsLoading(false);
				setResults([]);
				setActiveIndex(-1);
				setErrorMessage(message.message);
				return;
			}

			if (message.requestId !== latestRequestIdRef.current) {
				return;
			}

			setIsLoading(false);
			setErrorMessage('');
			setResults(message.results);
			setActiveIndex(message.results.length > 0 ? 0 : -1);
		};

		worker.addEventListener('message', handleMessage);
		return () => {
			worker.removeEventListener('message', handleMessage);
		};
	}, [currentLang]);

	useEffect(() => {
		setIsOpen(false);
		setResults([]);
		setActiveIndex(-1);
		setErrorMessage('');
	}, [location.pathname]);

	useEffect(() => {
		setQuery('');
		setResults([]);
		setActiveIndex(-1);
		setIsOpen(false);
		setIsLoading(false);
		setErrorMessage('');
	}, [currentLang]);

	useEffect(() => {
		const handlePointerDown = (event: PointerEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('pointerdown', handlePointerDown);
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
		};
	}, []);

	useEffect(() => {
		if (debounceTimerRef.current) {
			window.clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}

		const trimmedQuery = query.trim();
		if (!isOpen || trimmedQuery.length < MIN_QUERY_LENGTH) {
			setResults([]);
			setActiveIndex(-1);
			setErrorMessage('');
			setIsLoading(!isLangReady && isOpen);
			return;
		}

		const worker = getSearchWorker();
		if (!worker) return;

		setIsLoading(true);
		setErrorMessage('');
		debounceTimerRef.current = window.setTimeout(() => {
			latestRequestIdRef.current += 1;
			worker.postMessage({
				type: 'search',
				lang: currentLang,
				query: trimmedQuery,
				limit: SEARCH_RESULT_LIMIT,
				requestId: latestRequestIdRef.current,
			});
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			if (debounceTimerRef.current) {
				window.clearTimeout(debounceTimerRef.current);
				debounceTimerRef.current = null;
			}
		};
	}, [currentLang, isLangReady, isOpen, query]);

	const handleInputFocus = useCallback(() => {
		setIsOpen(true);
		requestWarmup();
	}, [requestWarmup]);

	const handleInputKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key === 'ArrowDown') {
				if (results.length === 0) return;
				event.preventDefault();
				setIsOpen(true);
				setActiveIndex((current) => (current >= results.length - 1 ? 0 : current + 1));
				return;
			}

			if (event.key === 'ArrowUp') {
				if (results.length === 0) return;
				event.preventDefault();
				setIsOpen(true);
				setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
				return;
			}

			if (event.key === 'Enter') {
				if (!isOpen || results.length === 0) return;
				event.preventDefault();
				openResult(results[activeIndex] || results[0]);
				return;
			}

			if (event.key === 'Escape') {
				setIsOpen(false);
			}
		},
		[activeIndex, isOpen, openResult, results]
	);

	let panelContent: ReactNode = null;
	if (errorMessage) {
		panelContent = <div className="fulltext-search-status">{errorMessage}</div>;
	} else if (!isLangReady && isLoading) {
		panelContent = <div className="fulltext-search-status">載入全文索引中…</div>;
	} else if (query.trim().length < MIN_QUERY_LENGTH) {
		panelContent = <div className="fulltext-search-status">輸入至少 2 字開始全文檢索</div>;
	} else if (isLoading) {
		panelContent = <div className="fulltext-search-status">搜尋中…</div>;
	} else if (results.length === 0) {
		panelContent = <div className="fulltext-search-status">找不到相符結果</div>;
	} else {
		panelContent = (
			<ul className="fulltext-search-results" role="listbox" aria-label="全文檢索結果">
				{results.map((result, index) => (
					<li key={`${result.title}-${index}`}>
						<button
							type="button"
							className={`fulltext-search-result${index === activeIndex ? ' is-active' : ''}`}
							role="option"
							aria-selected={index === activeIndex}
							onMouseDown={(event) => event.preventDefault()}
							onMouseEnter={() => setActiveIndex(index)}
							onClick={() => openResult(result)}
						>
							<span className="fulltext-search-result-title">
								{renderHighlightedText(result.title, query)}
							</span>
							{result.snippet && (
								<span className="fulltext-search-result-snippet">
									{renderHighlightedText(result.snippet, query)}
								</span>
							)}
						</button>
					</li>
				))}
			</ul>
		);
	}

	return (
		<div ref={containerRef} className={`fulltext-search${isOpen ? ' is-open' : ''}`}>
			<label htmlFor="nav-fulltext-search" className="sr-only">
				全文檢索
			</label>
			<span className="fulltext-search-icon" aria-hidden="true">
				<i className="icon-search"></i>
			</span>
			<input
				id="nav-fulltext-search"
				type="search"
				className="fulltext-search-input"
				placeholder="多語檢索"
				autoComplete="off"
				spellCheck={false}
				value={query}
				onFocus={handleInputFocus}
				onKeyDown={handleInputKeyDown}
				onChange={(event) => {
					setQuery(event.target.value);
					setIsOpen(true);
				}}
			/>
			{isOpen && <div className="fulltext-search-panel">{panelContent}</div>}
		</div>
	);
}
