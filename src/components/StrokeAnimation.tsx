/**
 * 筆順動畫組件
 * 復刻原專案 moedict-webkit 的筆順動畫功能
 *
 * 原始邏輯：
 * - main.ls: strokeWords(), drawOutline(), strokeWord()
 * - view.ls: Heteronym 組件中的 #historical-scripts 按鈕
 * - index.html: <div id="strokes"> 位於 .results 頂部
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface StrokeAnimationProps {
	/** 要動畫的字詞（可為多字） */
	title: string;
	/** 是否顯示動畫 */
	visible: boolean;
	/** 語言代碼（影響歷代書體 API） */
	lang?: string;
}

interface CharStrokeData {
	tw_word: string;
	strokes: Array<{ key: string; gif: string }>;
}

interface HistoricalEntry {
	char: string;
	data: CharStrokeData | null;
}

// 歷代書體類型（依原專案順序）
const SCRIPT_TYPES = ['楷書', '篆書', '隸書', '行書', '草書', '金文'] as const;

/** 動態載入外部腳本（確保不重複載入） */
function loadScript(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const existing = Array.from(document.querySelectorAll<HTMLScriptElement>('script')).find(
			(s) => s.src === src || s.getAttribute('src') === src
		);
		if (existing) {
			resolve();
			return;
		}
		const script = document.createElement('script');
		script.src = src;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
		document.head.appendChild(script);
	});
}

/** 取 R2 endpoint（wrangler vars.ASSET_BASE_URL → /api/config.assetBaseUrl；失敗則 /assets） */
async function fetchR2Endpoint(): Promise<string> {
	try {
		const res = await fetch('/api/config');
		const data = (await res.json()) as { assetBaseUrl?: string };
		return (data.assetBaseUrl || '/assets').replace(/\/$/, '');
	} catch {
		return '/assets';
	}
}

function extractStrokeWords(input: string): string {
	// 移除 HTML 與常見 entity，避免把 tag 字元當作筆順字元請求。
	const plain = input
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;|&#160;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'");
	const withoutParen = plain.replace(/[（(].*/, '').trim();
	// 筆順資料僅處理漢字，過濾非漢字可避免產生 ASCII/符號請求風暴。
	return Array.from(withoutParen)
		.filter((ch) => /\p{Script=Han}/u.test(ch))
		.join('');
}

export function StrokeAnimation({ title, visible, lang = 'a' }: StrokeAnimationProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const runIdRef = useRef(0);
	const historicalRunIdRef = useRef(0);
	const [historicalVisible, setHistoricalVisible] = useState(false);
	const [historicalData, setHistoricalData] = useState<HistoricalEntry[]>([]);
	const [loadingHistorical, setLoadingHistorical] = useState(false);
	const [r2Endpoint, setR2Endpoint] = useState<string | null>(null);
	const [containerKey, setContainerKey] = useState(0);

	// 取得 R2 endpoint
	useEffect(() => {
		fetchR2Endpoint().then(setR2Endpoint);
	}, []);

	// 當可見且 endpoint 就緒時，載入並執行筆順動畫
	useEffect(() => {
		if (!visible || !containerRef.current || r2Endpoint === null) return;

		const currentRunId = ++runIdRef.current;
		const container = containerRef.current;
		// 清除舊內容（同原 $('#strokes').html('').show!），並記錄批次資訊便於追查重入
		container.innerHTML = '';
		console.debug('[StrokeAnimation] init run', {
			runId: currentRunId,
			title,
			lang,
			containerKey,
		});

		const words = extractStrokeWords(title);
		if (!words) return;

		let cancelled = false;

		const run = async () => {
			const basePath = r2Endpoint || '/assets';
			try {
				// 確保 jQuery 已載入
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				if (!(window as any).jQuery) {
					await loadScript(`${basePath}/js/jquery-2.1.1.min.js`);
				}
				if (cancelled) return;

				// 載入 strokeWords 相依套件（依序）
				await loadScript(`${basePath}/js/raf.min.js`);
				await loadScript(`${basePath}/js/gl-matrix-min.js`);
				await loadScript(`${basePath}/js/sax.js`);
				await loadScript(`${basePath}/js/jquery.strokeWords.js`);
				if (cancelled) return;

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const $ = (window as any).jQuery;
				if (!$ || !$.fn || !$.fn.strokeWords) {
					console.warn('[StrokeAnimation] jquery.strokeWords 未成功載入');
					return;
				}
				if (cancelled || currentRunId !== runIdRef.current) {
					console.debug('[StrokeAnimation] stale run ignored before draw', {
						runId: currentRunId,
						activeRunId: runIdRef.current,
					});
					return;
				}

				// 執行筆順動畫（同原 $('#strokes').strokeWords(words, {url, dataType, -svg})）
				// 透過本機 Worker 代理，解決 CORS 問題（/api/stroke-json/{cp}.json）
				$(container).strokeWords(words, {
					url: '/api/stroke-json/',
					dataType: 'json',
					svg: false,
				});
				console.debug('[StrokeAnimation] draw started', {
					runId: currentRunId,
					rawTitle: title,
					words,
					length: Array.from(words).length,
				});
			} catch (err) {
				if (!cancelled) {
					console.warn('[StrokeAnimation] 載入失敗:', err);
				}
			}
		};

		run();

		return () => {
			cancelled = true;
			console.debug('[StrokeAnimation] cleanup run', { runId: currentRunId });
		};
	}, [visible, title, r2Endpoint, lang, containerKey]);

	// 當隱藏時清除動畫內容
	useEffect(() => {
		if (!visible) {
			runIdRef.current += 1;
			historicalRunIdRef.current += 1;
			// 強制重建容器，避免舊批次非同步 append 回同一 DOM。
			setContainerKey((prev) => prev + 1);
			if (containerRef.current) {
				containerRef.current.innerHTML = '';
			}
			setHistoricalVisible(false);
			setHistoricalData([]);
			setLoadingHistorical(false);
			console.debug('[StrokeAnimation] hidden reset', { runId: runIdRef.current });
		}
	}, [visible]);

	// 切換字詞/語言時，重設歷代書體狀態，避免沿用上一次顯示狀態
	useEffect(() => {
		historicalRunIdRef.current += 1;
		setHistoricalVisible(false);
		setHistoricalData([]);
		setLoadingHistorical(false);
	}, [title, lang]);

	// 歷代書體：依序 fetch 每個字的書體資料
	const handleHistoricalClick = useCallback(async () => {
		if (loadingHistorical) return;
		const runId = ++historicalRunIdRef.current;

		// 清除 #strokes 內的 section（同原 $('#strokes section').remove!）
		if (containerRef.current) {
			const sections = containerRef.current.querySelectorAll('section');
			sections.forEach((s) => s.remove());
		}

		const chars = Array.from(extractStrokeWords(title).trim());
		
		if (!chars.length) return;

		setLoadingHistorical(true);
		setHistoricalData([]);

		const results: HistoricalEntry[] = [];
		for (const ch of chars) {
			try {
				const resp = await fetch(
					`https://bs.chinese-linguipedia.org/api/web/word/${encodeURIComponent(ch)}`
				);
				if (runId !== historicalRunIdRef.current) return;
				const json = (await resp.json()) as { data?: CharStrokeData };
				results.push({ char: ch, data: json.data ?? null });
			} catch {
				if (runId !== historicalRunIdRef.current) return;
				results.push({ char: ch, data: null });
			}
		}

		if (runId !== historicalRunIdRef.current) return;
		setHistoricalData(results);
		setHistoricalVisible(true);
		setLoadingHistorical(false);
	}, [title, loadingHistorical]);

	if (!visible) return null;

	return (
		<div style={{ position: 'relative' }}>
			{/* 歷代書體按鈕（同原 #historical-scripts，紅底白字） */}
			<a
				id="historical-scripts"
				className="hidden-xs part-of-speech"
				title={'字體e筆書寫：張炳煌教授\n字體選用：郭晉銓博士'}
				onClick={handleHistoricalClick}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleHistoricalClick();
					}
				}}
				style={{
					cursor: 'pointer',
					color: 'white',
					display: 'inline-block',
					marginBottom: '8px',
				}}
			>
				{loadingHistorical ? '載入中…' : '歷代書體'}
			</a>

			{/* 筆順動畫容器（同原 <div id="strokes">） */}
			<div key={containerKey} ref={containerRef} id="strokes" lang={lang} />

			{/* 歷代書體展示區：各書體一個 section，橫向展示各字 GIF */}
			{historicalVisible && historicalData.length > 0 && (
				<div className="historical-scripts-area">
					{SCRIPT_TYPES.map((type) => (
						<section key={type} style={{ clear: 'both', marginBottom: '8px' }}>
							<span className="part-of-speech" style={{ display: 'block', marginBottom: '4px' }}>
								{type}
							</span>
							{historicalData.map(({ char, data }) => {
								const stroke = data?.strokes?.find((s) => s.key === type);
								return (
									<img
										key={char}
										src={stroke?.gif || ''}
										alt={`${char} - ${type}`}
										style={{
											display: 'inline-block',
											width: 220,
											height: 220,
											marginRight: 4,
											background: stroke?.gif ? undefined : '#eee',
										}}
									/>
								);
							})}
						</section>
					))}
				</div>
			)}
		</div>
	);
}
