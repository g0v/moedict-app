/**
 * 資源載入組件
 * 載入原專案 moedict-webkit 的 CSS、JS 和字體
 * 復刻 page-rendering.tsx 中的資源載入邏輯
 */

import { useEffect, useState } from 'react';

interface AssetLoaderProps {
	r2Endpoint?: string;
	onCriticalStylesReady?: () => void;
}

/**
 * 載入 CSS 檔案
 */
function loadCSS(href: string, id?: string): Promise<void> {
	return new Promise((resolve) => {
		if (!href) {
			resolve();
			return;
		}
	
		// 檢查是否已經載入過
		if (id) {
			const existing = document.querySelector(`link[data-asset-id="${id}"]`) as HTMLLinkElement | null;
			if (existing) {
				if ((existing.sheet as CSSStyleSheet | null) || existing.dataset.loaded === 'true') {
					resolve();
				} else {
					existing.addEventListener('load', () => resolve(), { once: true });
					existing.addEventListener('error', () => resolve(), { once: true });
				}
				return;
			}
		} else {
			const existing = document.querySelector(`link[href="${href}"]`) as HTMLLinkElement | null;
			if (existing) {
				if ((existing.sheet as CSSStyleSheet | null) || existing.dataset.loaded === 'true') {
					resolve();
				} else {
					existing.addEventListener('load', () => resolve(), { once: true });
					existing.addEventListener('error', () => resolve(), { once: true });
				}
				return;
			}
		}

		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;
		if (id) {
			link.setAttribute('data-asset-id', id);
		}
		link.onload = () => {
			link.dataset.loaded = 'true';
			resolve();
		};
		link.onerror = () => {
			resolve();
		};
		document.head.appendChild(link);
	});
}

/**
 * 載入 JS 檔案
 */
function loadScript(src: string, id?: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (!src) {
			reject(new Error('Empty script src'));
			return;
		}

		// 檢查是否已經載入過
		if (id) {
			const existing = document.querySelector(`script[data-asset-id="${id}"]`);
			if (existing) {
				resolve();
				return;
			}
		} else {
			const existing = document.querySelector(`script[src="${src}"]`);
			if (existing) {
				resolve();
				return;
			}
		}

		const script = document.createElement('script');
		script.src = src;
		script.charset = 'utf-8';
		if (id) {
			script.setAttribute('data-asset-id', id);
		}
		script.onload = () => resolve();
		script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
		document.head.appendChild(script);
	});
}

/**
 * 預載入字體
 */
function preloadFont(href: string, as: string = 'font', type: string = 'font/woff'): void {
	if (!href) return;

	// 檢查是否已經載入過
	const existing = document.querySelector(`link[rel="preload"][href="${href}"]`);
	if (existing) return;

	const link = document.createElement('link');
	link.rel = 'preload';
	link.href = href;
	link.as = as;
	link.type = type;
	link.crossOrigin = 'anonymous';
	document.head.appendChild(link);
}

/**
 * 資源載入組件
 */
export function AssetLoader({ r2Endpoint, onCriticalStylesReady }: AssetLoaderProps) {
	const [assetsLoaded, setAssetsLoaded] = useState(false);
	const [criticalStylesNotified, setCriticalStylesNotified] = useState(false);

	useEffect(() => {
		if (assetsLoaded) return;

		// 如果沒有 R2 endpoint，嘗試從 API 取得
		const loadAssets = async () => {
			let endpoint = r2Endpoint;

			if (!endpoint) {
				try {
					// wrangler vars.ASSET_BASE_URL → /api/config.assetBaseUrl
					const res = await fetch('/api/config');
					const data: { assetBaseUrl?: string } = await res.json();
					if (data.assetBaseUrl) {
						endpoint = data.assetBaseUrl.replace(/\/$/, '');
					}
				} catch (err) {
					console.error('取得 ASSET_BASE_URL 失敗:', err);
					// 如果 API 失敗，使用 /assets 路徑（由 Worker 代理）
					endpoint = '';
				}
			}

			const basePath = endpoint || '/assets';

			// 載入 CSS 檔案
			await Promise.all([
				loadCSS(`${basePath}/styles.css`, 'styles-css'),
				loadCSS(`${basePath}/css/cupertino/jquery-ui-1.10.4.custom.css`, 'jquery-ui-css'),
			]);
			if (!criticalStylesNotified) {
				onCriticalStylesReady?.();
				setCriticalStylesNotified(true);
			}

			// 預載入字體
			preloadFont(`${basePath}/fonts/fontawesome-webfont.woff`, 'font', 'font/woff');
			preloadFont(`${basePath}/fonts/MOEDICT.woff`, 'font', 'font/woff');
			preloadFont(`${basePath}/fonts/han.woff`, 'font', 'font/woff');
			preloadFont(`${basePath}/fonts/EBAS-Subset.woff`, 'font', 'font/woff');
			preloadFont(`${basePath}/fonts/FiraSansOT-Regular.woff`, 'font', 'font/woff');

			// 載入必要的 JS 檔案（順序載入）
			try {
				await loadScript(`${basePath}/js/es5-shim.js`, 'es5-shim');
				await loadScript(`${basePath}/js/es5-sham.js`, 'es5-sham');
			} catch (err) {
				console.warn('載入 JS 資源失敗:', err);
			}

			setAssetsLoaded(true);
		};

		loadAssets();
	}, [r2Endpoint, assetsLoaded, onCriticalStylesReady, criticalStylesNotified]);

	return null;
}

