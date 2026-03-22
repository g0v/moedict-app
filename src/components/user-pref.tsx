import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

type Lang = 'a' | 't' | 'h' | 'c';
type PrefKey = 'phonetics' | 'pinyin_a' | 'pinyin_t' | 'pinyin_h';

interface PrefOption {
	value: string;
	label: string;
	divider?: boolean;
}

interface JQueryCollection {
	slideToggle: () => void;
	slideUp: () => void;
}

type JQueryFn = (selector: string) => JQueryCollection;

const PHONETICS_OPTIONS: PrefOption[] = [
	{ value: 'rightangle', label: '注音拼音共同顯示' },
	{ value: 'bopomofo', label: '注音符號' },
	{ value: 'pinyin', label: '羅馬拼音' },
	{ value: '-', label: '', divider: true },
	{ value: 'none', label: '關閉' },
];

const PINYIN_A_OPTIONS: PrefOption[] = [
	{ value: 'HanYu-TongYong', label: '漢語華通共同顯示' },
	{ value: 'HanYu', label: '漢語拼音' },
	{ value: 'TongYong', label: '華通拼音' },
	{ value: 'WadeGiles', label: '威妥瑪式' },
	{ value: 'GuoYin', label: '注音二式' },
];

const PINYIN_T_OPTIONS: PrefOption[] = [
	{ value: 'TL-DT', label: '臺羅臺通共同顯示' },
	{ value: 'TL', label: '臺羅拼音' },
	{ value: 'DT', label: '臺通拼音' },
	{ value: 'POJ', label: '白話字' },
];

const PINYIN_H_OPTIONS: PrefOption[] = [
	{ value: 'TH', label: '客家語拼音方案' },
	{ value: 'PFS', label: '客語白話字' },
];

function inferLangFromPath(pathname: string): Lang {
	if (pathname.startsWith("/'")) return 't';
	if (pathname.startsWith('/:')) return 'h';
	if (pathname.startsWith('/~')) return 'c';
	return 'a';
}

function getStoredPref(key: string, fallback: string): string {
	try {
		const value = window.localStorage.getItem(key);
		return value || fallback;
	} catch {
		return fallback;
	}
}

function setStoredPref(key: string, value: string): void {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// ignore localStorage write errors
	}
}

function getJQuery(): JQueryFn | null {
	const maybeJQuery = (window as Window & { jQuery?: unknown }).jQuery;
	return typeof maybeJQuery === 'function' ? (maybeJQuery as JQueryFn) : null;
}

function isPanelHidden(panel: HTMLElement): boolean {
	return window.getComputedStyle(panel).display === 'none';
}

function applyPhoneticsBodyAttr(value: string): void {
	const mapped = {
		rightangle: 'both',
		bopomofo: 'zhuyin',
		pinyin: 'pinyin',
		none: 'none',
	}[value] || 'both';
	document.body.setAttribute('data-ruby-pref', mapped);
}

export function toggleUserPrefPanel(): void {
	const panel = document.getElementById('user-pref');
	if (!panel) return;

	const $ = getJQuery();
	if ($) {
		$('#user-pref').slideToggle();
		return;
	}

	panel.style.display = isPanelHidden(panel) ? 'block' : 'none';
}

export function hideUserPrefPanel(): void {
	const panel = document.getElementById('user-pref');
	if (!panel) return;

	const $ = getJQuery();
	if ($) {
		$('#user-pref').slideUp();
		return;
	}

	panel.style.display = 'none';
}

function PrefList({
	name,
	label,
	options,
	value,
	onChange,
}: {
	name: PrefKey;
	label: string;
	options: PrefOption[];
	value: string;
	onChange: (nextValue: string) => void;
}) {
	const activeValue = useMemo(() => {
		const hasValue = options.some((option) => !option.divider && option.value === value);
		if (hasValue) return value;
		return options.find((option) => !option.divider)?.value || '';
	}, [options, value]);

	return (
		<li className="btn-group" id={`pref-${name}`}>
			<label htmlFor={`pref-select-${name}`}>{label}</label>
			<select
				id={`pref-select-${name}`}
				className="form-control input-sm"
				value={activeValue}
				onChange={(event) => onChange(event.target.value)}
			>
				{options.map((option) =>
					option.divider ? (
						<option key={`${name}-divider`} disabled>
							---------
						</option>
					) : (
						<option key={`${name}-${option.value}`} value={option.value}>
							{option.label}
						</option>
					)
				)}
			</select>
		</li>
	);
}

export function UserPref() {
	const location = useLocation();
	const currentLang = inferLangFromPath(location.pathname);
	const [phonetics, setPhonetics] = useState(() => getStoredPref('phonetics', 'rightangle'));
	const [pinyinA, setPinyinA] = useState(() => getStoredPref('pinyin_a', 'HanYu'));
	const [pinyinT, setPinyinT] = useState(() => getStoredPref('pinyin_t', 'TL'));
	const [pinyinH, setPinyinH] = useState(() => getStoredPref('pinyin_h', 'TH'));

	useEffect(() => {
		const classList = document.body.classList;
		classList.remove('lang-a', 'lang-t', 'lang-h', 'lang-c');
		classList.add(`lang-${currentLang}`);
		return () => {
			classList.remove(`lang-${currentLang}`);
		};
	}, [currentLang]);

	useEffect(() => {
		applyPhoneticsBodyAttr(phonetics);
		setStoredPref('phonetics', phonetics);
	}, [phonetics]);

	const closePanel = useCallback(() => {
		hideUserPrefPanel();
	}, []);

	return (
		<div id="user-pref" style={{ display: 'none' }}>
			<div>
				<h4>偏好設定</h4>
				<button className="close btn-close" type="button" aria-hidden onClick={closePanel}>
					×
				</button>
				<ul>
					{currentLang === 'a' && (
						<PrefList
							name="pinyin_a"
							label="羅馬拼音顯示方式"
							options={PINYIN_A_OPTIONS}
							value={pinyinA}
							onChange={(nextValue) => {
								setStoredPref('pinyin_a', nextValue);
								setPinyinA(nextValue);
								window.location.reload();
							}}
						/>
					)}
					{currentLang === 't' && (
						<PrefList
							name="pinyin_t"
							label="羅馬拼音顯示方式"
							options={PINYIN_T_OPTIONS}
							value={pinyinT}
							onChange={(nextValue) => {
								setStoredPref('pinyin_t', nextValue);
								setPinyinT(nextValue);
								window.location.reload();
							}}
						/>
					)}
					{currentLang === 'h' && (
						<PrefList
							name="pinyin_h"
							label="四縣客語顯示方式"
							options={PINYIN_H_OPTIONS}
							value={pinyinH}
							onChange={(nextValue) => {
								setStoredPref('pinyin_h', nextValue);
								setPinyinH(nextValue);
								window.location.reload();
							}}
						/>
					)}
					<PrefList
						name="phonetics"
						label="條目音標顯示方式"
						options={PHONETICS_OPTIONS}
						value={phonetics}
						onChange={setPhonetics}
					/>
				</ul>
				<button className="btn btn-primary btn-block btn-close" type="button" onClick={closePanel}>
					關閉
				</button>
			</div>
		</div>
	);
}
