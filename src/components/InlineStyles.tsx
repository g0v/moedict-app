/**
 * 內聯樣式組件
 * 注入原專案 page-rendering.tsx 中的內聯樣式
 */

import { useEffect, useState } from 'react';

interface InlineStylesProps {
	r2Endpoint?: string;
	onReady?: () => void;
}

/**
 * 內聯樣式組件
 */
export function InlineStyles({ r2Endpoint, onReady }: InlineStylesProps) {
	const [endpoint, setEndpoint] = useState(r2Endpoint || '');
	const [readyNotified, setReadyNotified] = useState(false);

	useEffect(() => {
		if (r2Endpoint) {
			setEndpoint(r2Endpoint.replace(/\/$/, ''));
		}
	}, [r2Endpoint]);

	useEffect(() => {
		if (!endpoint) {
			// wrangler vars.ASSET_BASE_URL → /api/config.assetBaseUrl
			fetch('/api/config')
				.then((res) => res.json())
				.then((data: { assetBaseUrl?: string }) => {
					if (data.assetBaseUrl) {
						setEndpoint(data.assetBaseUrl.replace(/\/$/, ''));
					} else {
						setEndpoint('/assets');
					}
				})
				.catch(() => {
					setEndpoint('/assets');
				});
		}
	}, [endpoint]);

	useEffect(() => {
		if (endpoint && !readyNotified) {
			onReady?.();
			setReadyNotified(true);
		}
	}, [endpoint, onReady, readyNotified]);

	if (!endpoint) return null;

	const basePath = endpoint;

	return (
		<style
			dangerouslySetInnerHTML={{
				__html: `
		/* 修正導航列壓版問題 */
		body {
			padding-top: calc(50px + env(safe-area-inset-top)); /* 為固定導航列 + iOS safe area 留出空間 */
		}

		/* 確保導航列背景正確顯示 */
		.nav-bg {
			height: calc(50px + env(safe-area-inset-top));
			padding-top: env(safe-area-inset-top);
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			z-index: 1029;
		}

		/* 確保導航列在背景之上 */
		.navbar-fixed-top {
			z-index: 1030;
			top: env(safe-area-inset-top);
		}

		/* 確保主內容區域不會被左側欄遮擋 */
		#main-content {
			margin-left: 260px;
		}

		/* About 頁面沒有 Sidebar，所以不需要 margin-left */
		#main-content.about-layout {
			margin-left: 0;
		}

		.result {
			padding: 20px;
			margin: 16px;
		}

		@media only screen and (max-width: 767px) {
			#main-content {
				margin-left: 0;
				margin-top: 55px;
			}
		}

		/* 左側欄（query-box）樣式 - 復刻原專案 */
		.query-box {
			width: 260px;
			position: fixed;
			border-right: 1px solid hsl(360, 1%, 83%);
			top: 45px;
			bottom: 0;
			z-index: 9;
			padding: 20px;
			box-sizing: border-box;
			background-color: hsl(0, 0%, 97%);
		}

		@media print {
			.query-box { display: none; }
		}

			@media only screen and (max-width: 767px) {
				#query-box.query-box {
					right: auto !important;
					width: 100% !important;
					top: 40px !important;
					height: 65px !important;
					bottom: auto !important;
					padding: 15px !important;
					padding-bottom: 3px !important;
					z-index: 11 !important;
					border-right: none !important;
				}

				#main-content {
					margin-left: 0;
				}

				.navbar-nav .open .dropdown-menu {
					width: 100vw !important;
				}

				/* 手機版分類索引：可展開項目在右側顯示白色向下箭頭 */
				.navbar-inverse .navbar-nav .open .dropdown-menu .dropdown-submenu > a.taxonomy {
					position: relative;
					padding-right: 2em;
				}
				.navbar-inverse .navbar-nav .open .dropdown-menu .dropdown-submenu > a.taxonomy:before {
					content: none !important;
				}
				.navbar-inverse .navbar-nav .open .dropdown-menu .dropdown-submenu > a.taxonomy:after {
					content: "\\25BE";
					position: absolute;
					right: 1.6em;
					top: 50%;
					transform: translateY(-50%);
					color: #999;
					font-size: 0.9em;
					line-height: 1;
					pointer-events: none;
				}
			}

		/* Autocomplete 選單樣式 */
		.ui-autocomplete {
			overflow: auto;
			height: auto !important;
			position: fixed !important;
			box-sizing: border-box;
			background: #fff;
			border: 1px solid #ddd;
			border-radius: 4px;
			box-shadow: 0 2px 8px rgba(0,0,0,0.15);
		}

		.ui-autocomplete.search-results {
			list-style: none;
			margin: 8px 0 0;
			padding: 0;
			display: block !important;
			visibility: visible !important;
			position: fixed !important;
			z-index: 1200 !important;
		}

		.ui-autocomplete.search-results .ui-menu-item {
			padding: 1px;
			cursor: pointer;
			border-bottom: 1px solid #eee;
		}

		.ui-autocomplete.search-results .ui-menu-item:hover a,
		.ui-autocomplete.search-results .ui-menu-item a:focus {
			outline: none;
			margin: -1px;
			border: 1px solid #74b2e2;
			background: #e4f1fb;
			color: #0070a3;
		}

		.ui-autocomplete.search-results .ui-menu-item a,
		.ui-autocomplete.search-results .ui-menu-item span {
			display: block;
			color: #333;
			text-decoration: none;
			font-weight: 400;
		}

		.ui-autocomplete.search-results .ui-menu-item.is-status {
			cursor: default;
			color: #666;
		}

		.ui-autocomplete.search-results .ui-menu-item:not(.is-status):hover {
			background: #f0f0f0;
		}

		@media only screen and (min-width: 768px) {
			.ui-autocomplete.search-results {
				top: 113px !important;
				bottom: auto !important;
				left: 19px !important;
				width: 221px !important;
				max-height: 80% !important;
			}
		}

		@media only screen and (max-width: 767px) {
			.ui-autocomplete.search-results {
				top: 145px !important;
				height: auto !important;
				max-height: 68vh !important;
				left: 15px !important;
				right: 15px !important;
				width: auto !important;
				position: fixed !important;
				z-index: 2200 !important;
			}
		}

		/* 搜尋輸入框樣式 */
		.query-box input.query {
			display: block;
			border: 1px solid #ddd;
			font-size: 1.2em;
			width: 100%;
			height: 1.8em;
			box-sizing: border-box;
			padding: 4px 8px;
		}

		.query-box .search-form {
			width: 100%;
		}

		.query-box .mobile-search-toggle {
			display: none;
			width: 100%;
			text-align: left;
			border: 1px solid #d6d6d8;
			border-radius: 8px;
			background: #f3f3f5;
			color: #3b3140;
			padding: 8px 12px;
			line-height: 1.3;
			align-items: center;
		}

		.query-box .mobile-search-toggle-arrow {
			margin-right: 8px;
			font-size: 1.2em;
		}

		@media only screen and (max-width: 767px) {
			.query-box .mobile-search-toggle {
				display: flex;
				margin-top: 12px;
				font-size: 1.05em;
			}
		}

		/* 隱藏搜尋輸入框的取消按鈕 */
		::-webkit-search-cancel-button {
			-webkit-appearance: none;
		}

		/* FontAwesome 字體定義 */
		@font-face {
			font-family: 'FontAwesome';
			src: url('${basePath}/fonts/fontawesome-webfont.eot?v=3.2.1');
			src: url('${basePath}/fonts/fontawesome-webfont.eot?#iefix&v=3.2.1') format('embedded-opentype'),
				 url('${basePath}/fonts/fontawesome-webfont.woff?v=3.2.1') format('woff'),
				 url('${basePath}/fonts/fontawesome-webfont.ttf?v=3.2.1') format('truetype'),
				 url('${basePath}/fonts/fontawesome-webfont.svg#fontawesomeregular?v=3.2.1') format('svg');
			font-weight: normal;
			font-style: normal;
		}

		/* 基礎圖示樣式 */
		[class^="icon-"]:before,
		[class*=" icon-"]:before {
			font-family: FontAwesome;
			font-weight: normal;
			font-style: normal;
			text-decoration: inherit;
			-webkit-font-smoothing: antialiased;
			*margin-right: .3em;
		}

		/* 手機版調整 */
		@media (max-width: 767px) {
			body {
				padding-top: 0;
			}

			.nav-bg {
				position: static;
			}
		}

		/* 字典發音按鈕（複刻原專案） */
		.part-of-speech.playAudio {
			color: #6B0000;
			background: transparent;
			font-size: 90%;
			padding: 0;
			cursor: pointer;
			line-height: 100%;
			display: inline-block;
		}
		.audioBlock {
			display: inline-block;
			margin-left: 8px;
			font-size: 70% !important;
		}
		.playAudio {
			margin-left: 5px;
			color: #6B0000;
			font-size: 70%;
			padding-left: 5px;
			display: inline-block !important;
		}
		.icon-play:before { content: "\\f04b"; }
		.icon-stop:before { content: "\\f04d"; }

		/* 外文翻譯 TTS 可點擊 */
		.fw_def {
			cursor: pointer;
		}
		.fw_def:hover {
			text-decoration: underline;
		}

		/* 偏好設定：主音標區塊跟隨 body[data-ruby-pref] */
		.main-pronunciation .bpmf {
			display: inline-block;
		}
		.main-pronunciation .pinyin {
			display: inline-block;
		}
		body[data-ruby-pref='pinyin'] .main-pronunciation .bpmf,
		body[data-ruby-pref='none'] .main-pronunciation .bpmf {
			display: none;
		}
		body[data-ruby-pref='zhuyin'] .main-pronunciation .pinyin,
		body[data-ruby-pref='none'] .main-pronunciation .pinyin {
			display: none;
		}
		body[data-ruby-pref='none'] .main-pronunciation {
			display: none;
		}

		/* 部首頁與 Tooltip 對齊原專案 */
		.stroke-list .stroke-char {
			margin-right: 6px;
			text-decoration: none;
		}
		.stroke-list .stroke-char:hover {
			text-decoration: none;
		}
		.ui-tooltip {
			max-width: 360px;
			padding: 8px 12px;
		}
			.ui-tooltip .title .h1,
			.ui-tooltip .title h1 {
				font-family: "Biaodian Pro Serif CNS", "Numeral LF Serif", "MOEDICT", "Fira Sans OT", "Georgia", "Times New Roman", "Zhuyin Kaiti", "TW-Kai-98_1", "教育部標準楷書", "kai-pc", "CMEXc1", "BiauKai", "MOEDICT-IOS-KAI", "DFKaiShu-SB-Estd-BF", "全字庫正楷體", "Kaiti TC", "楷體-繁", "文鼎ＰＬ新中楷", "cwText 楷書", cursive, serif, "HanaMinA", "HanaMinB", "HAN NOM A", "HAN NOM B", "Han Kaiti CNS", cursive, serif !important;
				font-size: 30px !important;
				line-height: 2 !important;
				font-weight: 501 !important;
				margin: -0.25em 0 0.5em !important;
				padding-bottom: 0.3em !important;
				border-bottom: none !important;
				color: #000 !important;
			}
			.ui-tooltip .title .h1 a,
			.ui-tooltip .title h1 a,
			.ui-tooltip .stroke-list .stroke-char {
				font-family: inherit !important;
				font-size: inherit !important;
				text-decoration: none !important;
				color: #000 !important;
			}
		.ui-tooltip .title .h1 a:hover,
		.ui-tooltip .title h1 a:hover,
		.ui-tooltip .stroke-list .stroke-char:hover {
			text-decoration: none !important;
		}
		.ui-tooltip .stroke-list {
			display: inline-flex;
			flex-wrap: wrap;
			gap: 6px;
		}
		.ui-tooltip .entry-item {
			margin-top: 8px;
		}
		.ui-tooltip .entry-item .part-of-speech {
			margin-right: 4px;
		}
		.ui-tooltip .entry-item ol {
			margin: .4em 0 0 20px;
			padding-top: 1em;
		}
		`
			}}
		/>
	);
}
