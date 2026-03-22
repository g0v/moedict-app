/**
 * 一般頁面的導航列組件
 * 復刻原專案 moedict-webkit 的導航列介面
 * 使用 React Router 進行路由
 */

import { Fragment, useCallback, useRef, type MouseEventHandler } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toggleUserPrefPanel } from './user-pref';
import { computeLangSwitchPathAsync, LANG_PREFIX } from '../utils/xref-switch-utils';
import { readLRUWords } from '../utils/word-record-utils';
import { FullTextSearch } from './full-text-search';
import styled from './navbar-normal.module.css'

type Lang = 'a' | 't' | 'h' | 'c';

interface NavbarNormalProps {
	currentLang?: Lang;
}

// 選單節點型別
type MenuLeaf = { label: string; path: string };
type MenuNode = { label: string; children: MenuItem[] };
type MenuItem = MenuLeaf | MenuNode;

function isMenuNode(item: MenuItem): item is MenuNode {
	return 'children' in item;
}

/**
 * 語言選項配置
 */
const LANG_OPTIONS = [
	{ key: 'a' as Lang, label: '華語辭典', path: '/' },
	{ key: 't' as Lang, label: '臺灣台語', path: "/'" },
	{ key: 'h' as Lang, label: '臺灣客語', path: '/:', },
	{ key: 'c' as Lang, label: '兩岸詞典', path: '/~' }
];

/**
 * 語言對應的特殊頁面（含多層子選單）
 */
const LANG_SPECIAL_PAGES: Record<Lang, MenuItem[]> = {
	a: [
		{
			label: '…分類索引',
			children: [
				{ label: '成語', path: '/=成語' },
				{ label: '諺語', path: '/=諺語' },
				{ label: '歇後語', path: '/=歇後語' },
				{
					label: '外來語',
					children: [
						{ label: '音譯', path: '/=音譯' },
						{ label: '義譯', path: '/=義譯' },
						{ label: '音義合譯', path: '/=音義合譯' },
						{ label: '無法考證者', path: '/=無法考證者' },
					]
				},
				{
					label: '專科語詞',
					children: [
						{
							label: '國家、朝代、人名',
							children: [
								{ label: '國名', path: '/=國名' },
								{ label: '朝代名', path: '/=朝代名' },
								{ label: '人名', path: '/=人名' },
								{ label: '帝號', path: '/=帝號' },
							]
						},
						{
							label: '天文星象',
							children: [
								{ label: '星名', path: '/=星名' },
								{ label: '星座名', path: '/=星座名' },
							]
						},
						{
							label: '生物類',
							children: [
								{ label: '動物名', path: '/=動物名' },
								{ label: '植物名', path: '/=植物名' },
								{ label: '微生物', path: '/=微生物' },
							]
						},
						{
							label: '文學技藝',
							children: [
								{ label: '術數用語', path: '/=術數用語' },
								{ label: '書名', path: '/=書名' },
								{ label: '書體名', path: '/=書體名' },
								{ label: '文章名', path: '/=文章名' },
								{ label: '文體名', path: '/=文體名' },
								{ label: '敦煌變文名', path: '/=敦煌變文名' },
								{ label: '詩名', path: '/=詩名' },
								{ label: '詞牌名', path: '/=詞牌名' },
								{ label: '曲牌名', path: '/=曲牌名' },
								{ label: '樂曲名', path: '/=樂曲名' },
								{ label: '樂器名', path: '/=樂器名' },
								{ label: '戲劇曲藝', path: '/=戲劇曲藝' },
								{ label: '雜劇', path: '/=雜劇' },
								{ label: '傳奇', path: '/=傳奇' },
							]
						},
						{
							label: '地方行政',
							children: [
								{ label: '地名', path: '/=地名' },
								{ label: '州名', path: '/=州名' },
								{ label: '省名', path: '/=省名' },
								{ label: '城市名', path: '/=城市名' },
								{ label: '縣名', path: '/=縣名' },
								{ label: '鄉鎮名', path: '/=鄉鎮名' },
								{ label: '郡名', path: '/=郡名' },
							]
						},
						{
							label: '地理類',
							children: [
								{ label: '島名', path: '/=島名' },
								{ label: '半島名', path: '/=半島名' },
								{ label: '群島名', path: '/=群島名' },
								{ label: '方位名', path: '/=方位名' },
								{ label: '山名', path: '/=山名' },
								{ label: '山脈名', path: '/=山脈名' },
								{ label: '山峰名', path: '/=山峰名' },
								{ label: '河川名', path: '/=河川名' },
								{ label: '湖泊名', path: '/=湖泊名' },
								{ label: '海洋名', path: '/=海洋名' },
								{ label: '海峽名', path: '/=海峽名' },
								{ label: '海灣名', path: '/=海灣名' },
								{ label: '運河名', path: '/=運河名' },
								{ label: '水庫名', path: '/=水庫名' },
							]
						},
						{
							label: '其他',
							children: [
								{ label: '職官名', path: '/=職官名' },
								{ label: '武器名', path: '/=武器名' },
								{ label: '稱謂', path: '/=稱謂' },
								{ label: '病名', path: '/=病名' },
								{ label: '神話', path: '/=神話' },
								{ label: '方言', path: '/=方言' },
								{ label: '宗教', path: '/=宗教' },
								{ label: '舞曲舞蹈', path: '/=舞曲舞蹈' },
								{ label: '球類', path: '/=球類' },
								{ label: '種族、民族', path: '/=種族、民族' },
								{ label: '股票術語', path: '/=股票術語' },
								{ label: '大陸用語', path: '/=大陸用語' },
								{ label: '量詞', path: '/=量詞' },
								{ label: '節氣', path: '/=節氣' },
								{ label: '節日', path: '/=節日' },
							]
						},
					]
				},
			]
		},
		{ label: '…部首表', path: '/@' }
	],
	t: [
		{
			label: '…分類索引',
			children: [
				{
					label: '天文物理',
					children: [
						{
							label: '天文、地理',
							children: [
								{ label: '天文', path: "/'=天文" },
								{ label: '地理', path: "/'=地理" },
								{ label: '氣候溫度', path: "/'=氣候溫度" },
								{ label: '自然現象', path: "/'=自然現象" },
								{ label: '資源礦物', path: "/'=資源礦物" },
							]
						},
						{
							label: '時間、空間',
							children: [
								{ label: '空間方位', path: "/'=空間方位" },
								{ label: '時間節令', path: "/'=時間節令" },
							]
						},
					]
				},
				{
					label: '國家經濟',
					children: [
						{
							label: '法、政、軍事',
							children: [
								{ label: '法律', path: "/'=法律" },
								{ label: '政治', path: "/'=政治" },
								{ label: '軍事', path: "/'=軍事" },
								{ label: '外交', path: "/'=外交" },
							]
						},
						{
							label: '財務經濟',
							children: [
								{ label: '錢財資產', path: "/'=錢財資產" },
								{ label: '財務單位、活動', path: "/'=財務單位、活動" },
							]
						},
					]
				},
				{
					label: '語言',
					children: [
						{
							label: '形容用語',
							children: [
								{ label: '形貌、體積', path: "/'=形貌、體積" },
								{ label: '顏色、氣味', path: "/'=顏色、氣味" },
								{
									label: '境況、狀態',
									children: [
										{ label: '擬人', path: "/'=擬人" },
										{ label: '擬事', path: "/'=擬事" },
										{ label: '擬物', path: "/'=擬物" },
									]
								},
								{ label: '性質、程度', path: "/'=性質、程度" },
								{ label: '擬聲、擬態', path: "/'=擬聲、擬態" },
							]
						},
						{
							label: '語言、泛稱',
							children: [
								{
									label: '一般動詞',
									children: [
										{ label: '行為動詞', path: "/'=行為動詞" },
										{ label: '靜態動詞', path: "/'=靜態動詞" },
										{ label: '活動動詞', path: "/'=活動動詞" },
									]
								},
								{ label: '事、物泛稱', path: "/'=事、物泛稱" },
								{ label: '語言、文字、符號', path: "/'=語言、文字、符號" },
							]
						},
						{
							label: '特殊詞類',
							children: [
								{ label: '代名詞', path: "/'=代名詞" },
								{ label: '助詞、嘆詞', path: "/'=助詞、嘆詞" },
								{ label: '數詞、量詞', path: "/'=數詞、量詞" },
								{ label: '連詞、介詞', path: "/'=連詞、介詞" },
								{ label: '副詞', path: "/'=副詞" },
							]
						},
					]
				},
				{
					label: '生物醫療',
					children: [
						{
							label: '生養、醫療',
							children: [
								{ label: '生養老死', path: "/'=生養老死" },
								{ label: '傷疾病痛', path: "/'=傷疾病痛" },
								{ label: '醫療保健', path: "/'=醫療保健" },
							]
						},
						{
							label: '心理',
							children: [
								{ label: '心理狀態', path: "/'=心理狀態" },
								{ label: '心理活動', path: "/'=心理活動" },
							]
						},
						{
							label: '植物',
							children: [
								{ label: '蔬果作物', path: "/'=蔬果作物" },
								{ label: '花草樹木', path: "/'=花草樹木" },
								{ label: '植物形體、狀態', path: "/'=植物形體、狀態" },
							]
						},
						{
							label: '動物',
							children: [
								{ label: '獸類', path: "/'=獸類" },
								{ label: '禽類', path: "/'=禽類" },
								{ label: '爬蟲、兩棲類', path: "/'=爬蟲、兩棲類" },
								{ label: '昆蟲類', path: "/'=昆蟲類" },
								{ label: '魚蝦海獸', path: "/'=魚蝦海獸" },
								{ label: '其他動物', path: "/'=其他動物" },
								{ label: '動物形體、行為', path: "/'=動物形體、行為" },
							]
						},
						{
							label: '人及人體',
							children: [
								{ label: '泛稱', path: "/'=泛稱" },
								{ label: '人種、民族', path: "/'=人種、民族" },
								{ label: '生理構造', path: "/'=生理構造" },
								{ label: '肢體動作', path: "/'=肢體動作" },
								{ label: '反應、表情', path: "/'=反應、表情" },
								{ label: '感官動作', path: "/'=感官動作" },
							]
						},
					]
				},
				{
					label: '人文社會',
					children: [
						{
							label: '宗教、民俗',
							children: [
								{ label: '神明、鬼怪、教派', path: "/'=神明、鬼怪、教派" },
								{ label: '神職、神巫、信徒', path: "/'=神職、神巫、信徒" },
								{ label: '相關器具、活動', path: "/'=相關器具、活動" },
							]
						},
						{
							label: '人際關係、社交',
							children: [
								{ label: '婚喪喜慶', path: "/'=婚喪喜慶" },
								{ label: '交際應酬', path: "/'=交際應酬" },
								{ label: '待人處事', path: "/'=待人處事" },
							]
						},
						{
							label: '人物品評',
							children: [
								{ label: '才智能力', path: "/'=才智能力" },
								{ label: '個性風格', path: "/'=個性風格" },
								{ label: '道德評價', path: "/'=道德評價" },
								{ label: '體態樣貌', path: "/'=體態樣貌" },
								{ label: '氣質態度', path: "/'=氣質態度" },
							]
						},
						{
							label: '群體及家庭',
							children: [
								{ label: '國家、社會、民眾', path: "/'=國家、社會、民眾" },
								{ label: '宗族、家庭', path: "/'=宗族、家庭" },
								{ label: '組織團體', path: "/'=組織團體" },
								{ label: '兩性、婚姻', path: "/'=兩性、婚姻" },
							]
						},
						{
							label: '身分及職業',
							children: [
								{ label: '地位、身世、背景', path: "/'=地位、身世、背景" },
								{ label: '稱謂輩分', path: "/'=稱謂輩分" },
								{ label: '農林業', path: "/'=農林業" },
								{ label: '漁牧業', path: "/'=漁牧業" },
								{ label: '商業', path: "/'=商業" },
								{ label: '科技、工業', path: "/'=科技、工業" },
								{ label: '軍公教業', path: "/'=軍公教業" },
								{ label: '服務業及其他', path: "/'=服務業及其他" },
								{ label: '相關用語', path: "/'=相關用語" },
							]
						},
					]
				},
				{
					label: '日常生活',
					children: [
						{
							label: '飲食',
							children: [
								{ label: '食物、飲料、煙酒', path: "/'=食物、飲料、煙酒" },
								{ label: '飲食行為', path: "/'=飲食行為" },
								{ label: '飲食物具', path: "/'=飲食物具" },
							]
						},
						{
							label: '衣著裝扮',
							children: [
								{ label: '衣帽鞋襪', path: "/'=衣帽鞋襪" },
								{ label: '珠寶飾品', path: "/'=珠寶飾品" },
								{ label: '縫紉洗熨', path: "/'=縫紉洗熨" },
								{ label: '理容、化妝', path: "/'=理容、化妝" },
							]
						},
						{
							label: '建築、居所',
							children: [
								{ label: '建築物、結構', path: "/'=建築物、結構" },
								{ label: '居住環境', path: "/'=居住環境" },
								{ label: '房屋租賃、搬遷', path: "/'=房屋租賃、搬遷" },
							]
						},
						{
							label: '交通、訊息',
							children: [
								{ label: '交通、運輸', path: "/'=交通、運輸" },
								{ label: '道路、橋梁', path: "/'=道路、橋梁" },
								{ label: '旅運設施', path: "/'=旅運設施" },
								{ label: '郵電、網路', path: "/'=郵電、網路" },
							]
						},
						{
							label: '文教、體育、休旅',
							children: [
								{ label: '教育、學術', path: "/'=教育、學術" },
								{ label: '文學、藝術', path: "/'=文學、藝術" },
								{ label: '戲劇、音樂', path: "/'=戲劇、音樂" },
								{ label: '體育、運動', path: "/'=體育、運動" },
								{ label: '休閒、娛樂', path: "/'=休閒、娛樂" },
								{ label: '旅行', path: "/'=旅行" },
							]
						},
						{
							label: '生活',
							children: [
								{ label: '生活狀況', path: "/'=生活狀況" },
								{ label: '生活用品', path: "/'=生活用品" },
								{ label: '生活勞動', path: "/'=生活勞動" },
								{ label: '生產工具', path: "/'=生產工具" },
								{ label: '廢棄物', path: "/'=廢棄物" },
								{ label: '災禍', path: "/'=災禍" },
							]
						},
					]
				},
			]
		},
		{ label: '…諺語', path: "/'=諺語" }
	],
	h: [
		{ label: '…諺語', path: '/:=諺語' }
	],
	c: [
		{
			label: '…分類索引',
			children: [
				{ label: '同實異名', path: '/~=同實異名' },
				{ label: '同名異實', path: '/~=同名異實' },
				{ label: '臺灣用語', path: '/~=臺灣用語' },
				{ label: '大陸用語', path: '/~=大陸用語' },
			]
		},
		{ label: '…部首表', path: '/~@' }
	]
};

/**
 * 從當前路徑推斷語言
 */
function inferLangFromPath(pathname: string): Lang {
	if (pathname.startsWith("/'")) return 't';
	if (pathname.startsWith('/:')) return 'h';
	if (pathname.startsWith('/~')) return 'c';
	return 'a';
}

/**
 * 從當前路徑取出純字詞（不含語言前綴），
 * 若是分類、星號、部首等特殊頁面則回傳空字串
 */
function extractWordFromPath(pathname: string, lang: Lang): string {
	let raw = pathname.slice(1); // 去掉開頭 /
	if (lang === 't' || lang === 'h' || lang === 'c') {
		raw = raw.slice(1); // 去掉 ', :, ~
	}
	// 分類(=)、星號(=*)、部首(@) 等非字詞頁面
	if (!raw || raw.startsWith('=') || raw.startsWith('@')) return '';
	return raw.replace(/^`+/, '').replace(/~+$/, '');
}

const LANG_DEFAULTS: Record<Lang, string> = {
	a: '萌',
	t: '發穎',
	h: '發芽',
	c: '萌',
};

function getStarredPath(lang: Lang): string {
	if (lang === 't') return "/'=*";
	if (lang === 'h') return '/:=*';
	if (lang === 'c') return '/~=*';
	return '/=*';
}

/**
 * 遞迴渲染多層子選單
 */
function DropdownSubmenu({
	item,
	lang,
	handleLinkClick,
	submenuKeyPrefix,
}: {
	item: MenuNode;
	lang: Lang;
	handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, path: string) => void;
	submenuKeyPrefix: string;
}) {
	const enterDropdown: MouseEventHandler<HTMLLIElement> = (e) => {
		const parent = e.currentTarget.parentElement;
		const innerDropdownMenu = e.currentTarget.querySelector<HTMLUListElement>(`.${styled.dropdownMenu}`);
		if (!innerDropdownMenu || !parent) return
		const currentSiblings = Array.from(e.currentTarget.parentElement?.children ?? [])
		currentSiblings.filter(el => el !== e.currentTarget).forEach(el => el.classList.remove(styled.pinned))
		e.currentTarget.classList.add(styled.hover);

		const parentRect = parent.getBoundingClientRect()

		innerDropdownMenu.style.left = `${parentRect.left + parentRect.width}px`
		innerDropdownMenu.style.top = `${parentRect.top}px`

		const currentTargetRect = e.currentTarget.getBoundingClientRect()
		const innerDropdownMenuRect = innerDropdownMenu.getBoundingClientRect()

		if (currentTargetRect.bottom > innerDropdownMenuRect.bottom) {
			innerDropdownMenu.style.top = `${currentTargetRect.bottom - innerDropdownMenuRect.height}px`
		}
	}

	const leaveDropdown: MouseEventHandler<HTMLLIElement> = (e) => {
		e.currentTarget.classList.remove(styled.hover);
	}

	const pinDropdown: MouseEventHandler<HTMLLIElement> = (e) => {
		e.preventDefault()
		e.stopPropagation()
		const currentSiblings = Array.from(e.currentTarget.parentElement?.children ?? [])
		currentSiblings.filter(el => el !== e.currentTarget).forEach(el => el.classList.remove(styled.pinned))
		e.currentTarget.classList.toggle(styled.pinned)
		e.currentTarget.classList.remove(styled.hover)
	}

	return (
		<li className={styled.dropdownSubmenu} onMouseEnter={enterDropdown} onMouseLeave={leaveDropdown} onClick={pinDropdown}>
			<a
				href="#"
				className={`${lang} taxonomy`}
			>
				{item.label}
			</a>
			<ul className={styled.dropdownMenu}>
				{item.children.map((child, idx) =>
					isMenuNode(child) ? (
						<DropdownSubmenu
							key={idx}
							item={child}
							lang={lang}
							handleLinkClick={handleLinkClick}
							submenuKeyPrefix={`${submenuKeyPrefix}-${idx}`}
						/>
					) : (
						<li key={idx} role="presentation">
							<a
								role="menuitem"
								className={`lang-option ${lang}`}
								href={child.path}
								onClick={(e) => handleLinkClick(e, child.path)}
							>
								{child.label}
							</a>
						</li>
					)
				)}
			</ul>
		</li>
	);
}

/**
 * 主要導航列組件
 */
export function NavbarNormal({ currentLang }: NavbarNormalProps) {
	const location = useLocation();
	const navigate = useNavigate();
	const dropdownMenuRootRef = useRef<HTMLUListElement | null>(null);
	const resolvedLang = currentLang || inferLangFromPath(location.pathname);
	const starredPath = getStarredPath(resolvedLang);
	const currentLangOption = LANG_OPTIONS.find(opt => opt.key === resolvedLang);

	const closeDictionaryDropdown = useCallback(() => {
		const dropdownMenuRoot = dropdownMenuRootRef.current;
		if (!dropdownMenuRoot) return;
		dropdownMenuRoot.classList.remove(styled.open);
		dropdownMenuRoot.querySelectorAll(`.${styled.open}`).forEach((el) => {
			el.classList.remove(styled.open);
		});
		dropdownMenuRoot.querySelectorAll(`.${styled.dropdownSubmenu}`).forEach((el) => {
			el.classList.remove(styled.pinned);
			el.classList.remove(styled.hover);
		});
	}, []);

	const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
		// 允許外部連結和特殊按鍵行為
		if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
			return;
		}
		e.preventDefault();
		closeDictionaryDropdown();
		navigate(path);
	}, [closeDictionaryDropdown, navigate]);

	const handlePrefClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		toggleUserPrefPanel();
	}, []);

	/**
	 * 語言選項點擊：依照原 press-lang 邏輯計算目標路徑
	 * - a ↔ c：保留字詞，只加/去 ~ 前綴
	 * - 其他跨語言：從 xrefs 找對應詞，再 fallback LRU/預設
	 */
	const handleLangOptionClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, toLang: Lang) => {
		if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		closeDictionaryDropdown();

		const fromLang = resolvedLang;
		const fromWord = extractWordFromPath(location.pathname, fromLang);

		if (!fromWord) {
			// 非字詞頁面：直接用目標語言的 LRU 或預設詞
			const lru = readLRUWords(toLang);
			const word = lru[0] ?? LANG_DEFAULTS[toLang];
			navigate(`/${LANG_PREFIX[toLang]}${word}`);
			return;
		}

		// 非同步查詢 xref（確保 xref.json 已載入）
		void computeLangSwitchPathAsync(fromLang, toLang, fromWord).then((targetPath) => {
			navigate(targetPath);
		});
	}, [closeDictionaryDropdown, resolvedLang, location.pathname, navigate]);

	const handleMenuToggle: MouseEventHandler<HTMLAnchorElement> = (e) => {
		e.preventDefault()
		const dropdownMenu = e.currentTarget.nextElementSibling;
		if (!dropdownMenu) return
		dropdownMenu.classList.toggle(styled.open);

		if (!dropdownMenu.classList.contains(styled.open)) {
			dropdownMenu.querySelectorAll(`.${styled.dropdownSubmenu}`).forEach(el => {
				el.classList.remove(styled.pinned)
				el.classList.remove(styled.hover)
			});
		}
	}

	return (
		<>
			{/* 導航列背景 */}
			<div className="nav-bg navbar-fixed-top"></div>

			{/* 主要導航列 */}
			<nav role="navigation" className="navbar navbar-inverse navbar-fixed-top" style={{ opacity: 1 }}>
				{/* 左側區域 */}
				<div className="navbar-header">
					<Link to="/" className="navbar-brand brand ebas">
						萌典
					</Link>
				</div>

				<ul className="nav navbar-nav">
					{/* 辭典下拉選單 */}
					<li>
						<a href="#" onClick={handleMenuToggle}>
							<i className="icon-book">&nbsp;</i>
							<span
								style={{ margin: 0, padding: 0 }}
								itemProp="articleSection"
								className="lang-active"
							>
								{currentLangOption?.label || '華語辭典'}
							</span>
							<b className="caret"></b>
						</a>
						<ul role="navigation" className={`${styled.dropdownMenuRoot}`} ref={dropdownMenuRootRef}>
							{LANG_OPTIONS.map(option => {
								const specialPages = LANG_SPECIAL_PAGES[option.key] || [];
								return (
									<Fragment key={option.key}>
										{/* 語言選項 */}
										<li role="presentation">
											<a
												role="menuitem"
												href={option.path}
												className={`lang-option ${option.key}`}
												onClick={(e) => handleLangOptionClick(e, option.key)}
											>
												{option.label}
											</a>
										</li>
										{/* 該語言的特殊頁面（含子選單） */}
										{specialPages.map((page, idx) =>
											isMenuNode(page) ? (
												<DropdownSubmenu
													key={`${option.key}-${idx}`}
													item={page}
													lang={option.key}
													handleLinkClick={handleLinkClick}
													submenuKeyPrefix={`${option.key}-${idx}`}
												/>
											) : (
												<li key={`${option.key}-${idx}`} role="presentation">
													<a
														role="menuitem"
														href={page.path}
														className={`lang-option ${option.key}`}
														onClick={(e) => handleLinkClick(e, page.path)}
													>
														{page.label}
													</a>
												</li>
											)
										)}
									</Fragment>
								);
							})}
						</ul>
					</li>

					{/* 手機版全文檢索（放在字詞紀錄簿左側） */}
					<li className="navbar-fulltext-search-item-mobile hidden-sm hidden-md hidden-lg">
						<FullTextSearch currentLang={resolvedLang} />
					</li>

					{/* 字詞紀錄簿按鈕 */}
					<li id="btn-starred">
						<a
							title="字詞紀錄簿"
							href={starredPath}
							onClick={(e) => handleLinkClick(e, starredPath)}
						>
							<i className="icon-bookmark-empty"></i>
						</a>
					</li>

					{/* 偏好設定按鈕 */}
					<li id="btn-pref">
						<a title="偏好設定" href="#" onClick={handlePrefClick}>
							<i className="icon-cogs"></i>
						</a>
					</li>

					{/* 字體大小調整按鈕（僅 App 版） */}
					<li
						style={{ position: 'absolute', top: '2px', left: '8em', padding: '3px' }}
						className="resize-btn app-only"
					>
						<a
							style={{ paddingLeft: '5px', paddingRight: '5px', marginRight: '30px' }}
							onClick={(e) => {
								e.preventDefault();
								// TODO: 實現字體大小調整功能
							}}
						>
							<i className="icon-resize-small"></i>
						</a>
					</li>
					<li
						style={{ position: 'absolute', top: '2px', left: '8em', padding: '3px', marginLeft: '30px' }}
						className="resize-btn app-only"
					>
						<a
							style={{ paddingLeft: '5px', paddingRight: '5px' }}
							onClick={(e) => {
								e.preventDefault();
								// TODO: 實現字體大小調整功能
							}}
						>
							<i className="icon-resize-full"></i>
						</a>
					</li>
				</ul>

				{/* 右側區域 - 下載連結、搜尋框、社群連結 */}
				<ul className="nav pull-right hidden-xs" style={{ display: 'flex' }}>
					<li className="navbar-fulltext-search-item">
						<FullTextSearch currentLang={resolvedLang} />
					</li>

					<li style={{ display: 'inline-block' }}>
						<a
							href="https://racklin.github.io/moedict-desktop/download.html"
							target="_blank"
							rel="noopener noreferrer"
							title="桌面版下載(可離線使用)"
							style={{ color: '#ccc' }}
						>
							<i className="icon-download-alt"></i>
						</a>
					</li>

					<li style={{ display: 'inline-block' }}>
						<a
							href="https://play.google.com/store/apps/details?id=org.audreyt.dict.moe"
							target="_blank"
							rel="noopener noreferrer"
							title="Google Play 下載"
							style={{ color: '#ccc' }}
						>
							<i className="icon-android"></i>
						</a>
					</li>
					<li style={{ display: 'inline-block' }}>
						<a
							href="http://itunes.apple.com/app/id1434947403"
							target="_blank"
							rel="noopener noreferrer"
							title="App Store 下載"
							style={{ color: '#ccc' }}
						>
							<i className="icon-apple"></i>
						</a>
					</li>

					<li>
						<Link to="/about" title="關於本站">
							<span className="iconic-circle" style={{ backgroundColor: '#400' }}>
								<i className="icon-info"></i>
							</span>
						</Link>
					</li>
				</ul>
			</nav>
		</>
	);
}
