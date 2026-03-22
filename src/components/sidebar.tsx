/**
 * 左側欄組件
 * 復刻原專案 moedict-webkit 的 query-box 布局
 */

import { SearchBox } from './searchbox';

type Lang = 'a' | 't' | 'h' | 'c';

interface SidebarProps {
	currentLang?: Lang;
}

/**
 * 左側欄組件
 */
export function Sidebar({ currentLang }: SidebarProps) {
	return (
		<div id="query-box" className="query-box">
			<SearchBox currentLang={currentLang} />
		</div>
	);
}

