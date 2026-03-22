/**
 * 關於頁面 React 組件
 * 復刻原專案 moedict-webkit 的 about.html 頁面
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applyHeadByPath, applyHeadToDocument, resolveHeadByPath } from '../ssr/head';
import './About.css';

// 動態載入外部樣式
function loadExternalStyles(r2Endpoint: string) {
	if (!r2Endpoint) return;

	// 檢查是否已經載入過
	const existingLink = document.querySelector(`link[data-r2-styles]`);
	if (existingLink) return;

	// 載入原專案的樣式（通過 Worker 代理）
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	// 使用 /assets/ 路徑，讓 Worker 代理請求
	link.href = `/assets/styles.css`;
	link.setAttribute('data-r2-styles', 'true');
	document.head.appendChild(link);
}

interface AboutProps {
	assetBaseUrl?: string;
}

/**
 * 關於頁面組件
 */
export function About({ assetBaseUrl }: AboutProps) {
	const [r2Endpoint, setR2Endpoint] = useState<string>('');
	const [bookmarkHint, setBookmarkHint] = useState<string>('');

	useEffect(() => {
		// 如果沒有傳入 assetBaseUrl，從 API 取得
		if (assetBaseUrl) {
			const endpoint = assetBaseUrl.replace(/\/$/, '');
			setR2Endpoint(endpoint);
			loadExternalStyles(endpoint);
		} else {
			// wrangler vars.ASSET_BASE_URL → /api/config.assetBaseUrl
			fetch('/api/config')
				.then((res) => res.json())
				.then((data: { assetBaseUrl?: string }) => {
					if (data.assetBaseUrl) {
						const endpoint = data.assetBaseUrl.replace(/\/$/, '');
						setR2Endpoint(endpoint);
						loadExternalStyles(endpoint);
					}
				})
				.catch((err) => {
					console.error('取得 ASSET_BASE_URL 失敗:', err);
				});
		}
	}, [assetBaseUrl]);

	// R2 公開端點（由外部注入或從 API 取得）
	const R2_ENDPOINT = r2Endpoint;

	// 設定 body 類別
	useEffect(() => {
		document.body.id = 'moedict';
		document.body.className = 'about web';
		applyHeadByPath('/about');
		return () => {
			document.body.id = '';
			document.body.className = '';
			applyHeadToDocument(resolveHeadByPath('/'));
		};
	}, []);

	return (
		<div className="about-page">
			{/* 主要內容 */}
			<div style={{ textAlign: 'center' }}>
				{R2_ENDPOINT && (
					<img
						style={{ marginTop: '25px', marginBottom: '15px', background: 'white' }}
						title="萌典首頁"
						src="/assets/images/icon.png"
						width="50%"
						className="logo"
						alt="萌典 Logo"
					/>
				)}
			</div>

			<div className="content">
				<p>
					<Link to="/" className="home">
						萌典
					</Link>
					共收錄十六萬筆臺灣華語、兩萬筆臺灣台語、一萬四千筆臺灣客語條目，並支援「自動完成」功能及
					<span style={{ whiteSpace: 'nowrap' }}>「%_ *? ^.$」</span>等萬用字元。
				</p>
				<p>定義裡的每個字詞都可以點擊連到說明。</p>
				<p>
					源碼、其他平台版本、API 及原始資料等，均可在{' '}
					<a target="_blank" href="https://github.com/g0v/moedict.tw" rel="noopener noreferrer">
						GitHub
					</a>{' '}
					取得。
				</p>
				<p>
					原始資料來源為教育部《
					<a target="_blank" href="https://dict.revised.moe.edu.tw/" rel="noopener noreferrer">
						重編國語辭典修訂本
					</a>
					》（
					<a
						target="_blank"
						href="https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_reviseddict_download.html"
						rel="noopener noreferrer"
					>
						CC BY-ND 3.0 臺灣
					</a>
					授權）、《
					<a
						target="_blank"
						href="https://sutian.moe.edu.tw/zh-hant/piantsip/pankhuan-singbing/"
						rel="noopener noreferrer"
					>
						臺灣台語常用詞辭典
					</a>
					》（
					<a
						target="_blank"
						href="http://twblg.dict.edu.tw/holodict_new/compile1_6_1.jsp"
						rel="noopener noreferrer"
					>
						CC BY-ND 3.0 臺灣
					</a>
					授權）及《
					<a target="_blank" href="https://hakkadict.moe.edu.tw/" rel="noopener noreferrer">
						臺灣客語辭典
					</a>
					》（
					<a
						target="_blank"
						href="https://hakkadict.moe.edu.tw/directions/%E7%AD%94%E5%AE%A2%E5%95%8F/%E7%89%88%E6%9C%AC%E6%8E%88%E6%AC%8A/"
						rel="noopener noreferrer"
					>
						CC BY-ND 3.0 臺灣
					</a>
					），辭典本文的著作權仍為教育部所有。
				</p>
				<p>
					筆劃資料來源為教育部「
					<a target="_blank" href="https://stroke-order.learningweb.moe.edu.tw/" rel="noopener noreferrer">
						國字標準字體筆順學習網
					</a>
					」，國語發音資料來源為教育部「
					<a target="_blank" href="https://dict.concised.moe.edu.tw//" rel="noopener noreferrer">
						國語辭典簡編本
					</a>
					」（
					<a
						target="_blank"
						href="https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_concised_download.html"
						rel="noopener noreferrer"
					>
						CC BY-ND 3.0 臺灣
					</a>
					授權），著作權仍為教育部所有。
				</p>
				<p>
					英/法/德文對照表{' '}
					<a target="_blank" href="https://cc-cedict.org/" rel="noopener noreferrer">
						CC-CEDict
					</a>
					、{' '}
					<a target="_blank" href="https://chine.in/mandarin/dictionnaire/CFDICT/" rel="noopener noreferrer">
						CFDict
					</a>
					、{' '}
					<a
						target="_blank"
						href="https://handedict.zydeo.net/en/download"
						rel="noopener noreferrer"
					>
						HanDeDict
					</a>{' '}
					採用{' '}
					<a
						target="_blank"
						href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh_TW"
						rel="noopener noreferrer"
					>
						CC BY-SA 4.0 國際
					</a>
					授權。
				</p>
				<p>
					兩岸詞典由
					<a target="_blank" href="http://www.gacc.org.tw/" rel="noopener noreferrer">
						中華文化總會
					</a>
					提供，採用{' '}
					<a
						target="_blank"
						href="https://creativecommons.org/licenses/by-nc-nd/3.0/tw/deed.zh_TW"
						rel="noopener noreferrer"
					>
						CC BY-NC-ND 3.0 臺灣
					</a>
					授權。
				</p>
				<p>
					歷代書體以內嵌網頁方式，連至
					<a target="_blank" href="http://www.gacc.org.tw/" rel="noopener noreferrer">
						中華文化總會
					</a>
					網站。字體e筆書寫：張炳煌教授。字體選用：郭晉銓博士。
				</p>
				<p className="web-only">
					<a
						target="_blank"
						href="https://play.google.com/store/apps/details?id=org.audreyt.dict.moe"
						rel="noopener noreferrer"
					>
						Android
					</a>
					、{' '}
					<a target="_blank" href="http://itunes.apple.com/app/id1434947403" rel="noopener noreferrer">
						Apple iOS
					</a>{' '}
					及{' '}
					<a
						target="_blank"
						href="https://marketplace.firefox.com/app/%E8%90%8C%E5%85%B8"
						rel="noopener noreferrer"
					>
						Firefox OS
					</a>{' '}
					離線版包含下列第三方元件：
				</p>
				<ul>
					<li>
						jQuery 及 jQuery UI 由 jQuery Foundation 提供，採用{' '}
						<a target="_blank" href="https://jquery.org/license/" rel="noopener noreferrer">
							MIT
						</a>{' '}
						授權。
					</li>
					<li>
						Cordova 由 Apache 基金會提供，採用{' '}
						<a target="_blank" href="https://www.apache.org/licenses/LICENSE-2.0" rel="noopener noreferrer">
							Apache 2.0
						</a>{' '}
						授權。
					</li>
					<li>
						Fira Sans 字型由 Mozilla 基金會提供，採用{' '}
						<a
							target="_blank"
							href="https://github.com/mozilla/Fira/blob/master/LICENSE"
							rel="noopener noreferrer"
						>
							SIL Open Font 1.1
						</a>{' '}
						授權。
					</li>
				</ul>
				<p>
					<a
						target="_blank"
						href="https://www.moedict.tw/%E5%AD%97%E5%9C%96%E5%88%86%E4%BA%AB"
						rel="noopener noreferrer"
					>
						字圖分享
					</a>
					功能使用下列來源之中文字型：
				</p>
				<ul>
					<li>
						<a
							target="_blank"
							href="http://www.cns11643.gov.tw/AIDB/download.do?name=%E5%AD%97%E5%9E%8B%E4%B8%8B%E8%BC%89"
							rel="noopener noreferrer"
						>
							中文全字庫
						</a>
						採用{' '}
						<a
							target="_blank"
							href="https://creativecommons.org/licenses/by-nd/3.0/tw/deed.zh_TW"
							rel="noopener noreferrer"
						>
							CC BY-ND 3.0 臺灣
						</a>
						授權。
					</li>
					<li>
						<a target="_blank" href="http://www.cl.fcu.edu.tw/" rel="noopener noreferrer">
							逢甲大學中文系
						</a>
						採用「不涉及商業行為使用」授權。
					</li>
					<li>
						<a target="_blank" href="https://code.google.com/p/cwtex-q-fonts/" rel="noopener noreferrer">
							cwTeX Q
						</a>
						採用{' '}
						<a
							target="_blank"
							href="https://www.gnu.org/licenses/old-licenses/gpl-2.0.html"
							rel="noopener noreferrer"
						>
							GPL 2.0
						</a>{' '}
						授權。
					</li>
					<li>
						<a
							target="_blank"
							href="https://github.com/adobe-fonts/source-han-sans/tree/release"
							rel="noopener noreferrer"
						>
							思源黑體
						</a>
						採用{' '}
						<a
							target="_blank"
							href="https://github.com/adobe-fonts/source-han-sans/blob/release/LICENSE.txt"
							rel="noopener noreferrer"
						>
							SIL Open Font 1.1
						</a>
						授權。
					</li>
					<li>
						<a
							target="_blank"
							href="https://github.com/adobe-fonts/source-han-serif/tree/release"
							rel="noopener noreferrer"
						>
							思源宋體
						</a>
						採用{' '}
						<a
							target="_blank"
							href="https://github.com/adobe-fonts/source-han-serif/blob/release/LICENSE.txt"
							rel="noopener noreferrer"
						>
							SIL Open Font 1.1
						</a>
						授權。
					</li>
					<li>
						<a target="_blank" href="https://code.google.com/p/wangfonts/" rel="noopener noreferrer">
							王漢宗自由字型
						</a>
						採用{' '}
						<a
							target="_blank"
							href="https://www.gnu.org/licenses/old-licenses/gpl-2.0.html"
							rel="noopener noreferrer"
						>
							GPL 2.0
						</a>{' '}
						授權。
					</li>
					<li>
						<a
							target="_blank"
							href="http://typography.ascdc.sinica.edu.tw/%E5%AD%97/"
							rel="noopener noreferrer"
						>
							日星初號楷體
						</a>
						採用
						<a
							target="_blank"
							href="https://creativecommons.org/licenses/by-nc-nd/3.0/tw/deed.zh_TW"
							rel="noopener noreferrer"
						>
							CC BY-NC-ND 3.0 臺灣
						</a>
						授權。
					</li>
				</ul>
				<p>
					感謝 <a target="_blank" href="http://g0v.tw" rel="noopener noreferrer">#g0v.tw</a> 頻道內所有協助開發的朋友們。
				</p>
				<h2 className="cc0">
					<a
						target="_blank"
						href="https://creativecommons.org/publicdomain/zero/1.0/deed.zh_TW"
						rel="noopener noreferrer"
					>
						CC0 1.0 公眾領域貢獻宣告
					</a>
				</h2>
				<p>
					作者 唐鳳 在法律許可的範圍內，拋棄此著作依著作權法所享有之權利，包括所有相關與鄰接的法律權利，並宣告將該著作貢獻至公眾領域。
				</p>
			</div>

			{/* GitHub 連結 */}
			{R2_ENDPOINT && (
				<a target="_blank" href="https://github.com/audreyt/moedict-webkit" rel="noopener noreferrer">
					<img
						style={{ zIndex: 1000, position: 'absolute', top: '0px', right: 0, border: 0 }}
						src="/assets/images/right-graphite@2x.png"
						width="120"
						height="120"
						alt="Fork me on GitHub"
					/>
				</a>
			)}

			{/* App 版返回按鈕 */}
			<div className="app-only">
				<Link
					to="/"
					title="回到萌典"
					style={{ float: 'left', marginTop: '-60px', marginLeft: '5px' }}
					className="visible-xs pull-left ebas btn btn-default home"
				>
					<span className="iconic-circle">
						<i className="icon-arrow-left"></i>
					</span>
					<span> 萌典</span>
				</Link>
			</div>

			{/* 下載按鈕 */}
			{R2_ENDPOINT && (
				<div style={{ position: 'fixed', bottom: '10px', left: '10px', zIndex: 2 }} className="web-only">
					<a
						target="_blank"
						href="https://play.google.com/store/apps/details?id=org.audreyt.dict.moe"
						rel="noopener noreferrer"
					>
						<img
							alt="Google Play 下載"
							title="Google Play 下載"
							src="/images/google_play.jpg"
							width="135"
							height="46"
						/>
					</a>
					<a
						target="_blank"
						href="http://itunes.apple.com/app/id1434947403"
						style={{ marginLeft: '10px' }}
						rel="noopener noreferrer"
					>
						<img
							alt="App Store 下載"
							title="App Store 下載"
							src="/images/Download_on_the_App_Store_Badge_HK_TW_135x40.png"
							width="155"
							height="46"
						/>
					</a>
				</div>
			)}

			{/* 加入書籤按鈕 */}
			<div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 1 }} className="web-only">
				<a
					id="opensearch"
					onClick={async (e) => {
						e.preventDefault();
						const url = window.location.href;
						try {
							await navigator.clipboard.writeText(url);
							setBookmarkHint('已複製網址，請按 Cmd+D (Mac) 或 Ctrl+D (Windows) 加入書籤');
						} catch {
							setBookmarkHint('請按 Cmd+D (Mac) 或 Ctrl+D (Windows) 將此頁加入書籤');
						}
						setTimeout(() => setBookmarkHint(''), 4000);
					}}
					className="btn btn-default btn-info"
					href="#"
					title="將此頁加入瀏覽器書籤"
				>
					<i className="icon icon-plus-sign"></i> 加入書籤
				</a>
				{bookmarkHint && (
					<div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-fg-muted)', maxWidth: 260 }}>
						{bookmarkHint}
					</div>
				)}
			</div>
		</div>
	);
}

