/**
 * Layout 組件
 * 根據 layout 類型切換不同的頁面結構
 */

import { useEffect, useState, type ReactNode } from 'react';
import { NavbarAbout } from './navbar-about';
import { NavbarNormal } from './navbar-normal';
import { Sidebar } from './sidebar';
import { AssetLoader } from './AssetLoader';
import { InlineStyles } from './InlineStyles';
import { UserPref } from './user-pref';

type Lang = 'a' | 't' | 'h' | 'c';

type LayoutType = 'normal' | 'about';

interface LayoutProps {
	layout: LayoutType;
	children: ReactNode;
	currentLang?: Lang;
	r2Endpoint?: string;
}

/**
 * Layout 組件
 */
export function Layout({ layout, children, currentLang, r2Endpoint }: LayoutProps) {
	const [criticalCssReady, setCriticalCssReady] = useState(false);
	const [inlineStylesReady, setInlineStylesReady] = useState(false);

	useEffect(() => {
		if (r2Endpoint) {
			setInlineStylesReady(true);
		}
	}, [r2Endpoint]);

	if (!criticalCssReady || !inlineStylesReady) {
		return (
			<>
				<AssetLoader r2Endpoint={r2Endpoint} onCriticalStylesReady={() => setCriticalCssReady(true)} />
				<InlineStyles r2Endpoint={r2Endpoint} onReady={() => setInlineStylesReady(true)} />
			</>
		);
	}

	return (
		<>
			<AssetLoader r2Endpoint={r2Endpoint} onCriticalStylesReady={() => setCriticalCssReady(true)} />
			<InlineStyles r2Endpoint={r2Endpoint} onReady={() => setInlineStylesReady(true)} />
			{layout === 'about' ? (
				<div className="app-shell">
					<NavbarAbout r2Endpoint={r2Endpoint} />
					<main id="main-content" className="about-layout">
						{children}
					</main>
				</div>
			) : (
				<div className="app-shell">
					<NavbarNormal currentLang={currentLang} />
					<Sidebar currentLang={currentLang} />
					<UserPref />
					<main id="main-content">
						{children}
					</main>
				</div>
			)}
		</>
	);
}
