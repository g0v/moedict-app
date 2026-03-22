import type { ReactNode, SVGProps } from 'react';

export type SvgIconName =
	| 'android'
	| 'apple'
	| 'arrowLeft'
	| 'book'
	| 'bookmarkEmpty'
	| 'cogs'
	| 'download'
	| 'info'
	| 'pencil'
	| 'play'
	| 'plusCircle'
	| 'removeCircle'
	| 'resizeFull'
	| 'resizeSmall'
	| 'search'
	| 'share'
	| 'spinner'
	| 'star'
	| 'starEmpty'
	| 'stop';

interface SvgIconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
	name: SvgIconName;
	size?: number | string;
	title?: string;
}

function getIconFragment(name: SvgIconName): ReactNode {
	switch (name) {
		case 'android':
			return (
				<>
					<path d="M8 8.5h8a2 2 0 0 1 2 2V16a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 16v-5.5a2 2 0 0 1 2-2Z" fill="currentColor" />
					<path d="M9 6.5 7.8 4.2M15 6.5l1.2-2.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
					<rect x="4.5" y="9.5" width="1.8" height="6.5" rx=".9" fill="currentColor" />
					<rect x="17.7" y="9.5" width="1.8" height="6.5" rx=".9" fill="currentColor" />
					<rect x="8.8" y="18" width="1.8" height="3" rx=".9" fill="currentColor" />
					<rect x="13.4" y="18" width="1.8" height="3" rx=".9" fill="currentColor" />
					<circle cx="10.1" cy="11.6" r=".9" fill="#222" />
					<circle cx="13.9" cy="11.6" r=".9" fill="#222" />
				</>
			);
		case 'apple':
			return (
				<>
					<path d="M15.3 6.5c.7-.9 1.2-2.2 1-3.5-1.1.1-2.4.7-3.2 1.6-.7.8-1.3 2-1.1 3.2 1.2.1 2.5-.6 3.3-1.3Z" fill="currentColor" />
					<path d="M17.9 12.4c0-2 1.6-2.9 1.7-3-1-1.4-2.5-1.6-3-1.6-1.2-.1-2.3.7-3 .7s-1.6-.7-2.7-.7c-1.3 0-2.6.8-3.3 2-1.4 2.4-.3 6.2 1 8 .7 1 1.4 2 2.5 2 1 0 1.4-.6 2.6-.6s1.6.6 2.6.6c1.1 0 1.8-.9 2.4-1.8.8-1.1 1.1-2.3 1.2-2.3 0 0-2-.8-2-3.3Z" fill="currentColor" />
				</>
			);
		case 'arrowLeft':
			return (
				<path
					d="M19 12H5M11 6l-6 6 6 6"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
				/>
			);
		case 'book':
			return (
				<>
					<path
						d="M5.5 4.5A2.5 2.5 0 0 1 8 2h10.5v18H8a2.5 2.5 0 0 0-2.5 2Z"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1.8"
					/>
					<path d="M5.5 4v18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
					<path d="M9 6.5h6.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
				</>
			);
		case 'bookmarkEmpty':
			return (
				<path
					d="M7 3.5h10v16l-5-3.4L7 19.5Z"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="1.9"
				/>
			);
		case 'cogs':
			return (
				<>
					<path
						d="M12 4.5 13 6.9a5.7 5.7 0 0 1 1.6.7l2.3-1 1.4 1.4-1 2.3a5.7 5.7 0 0 1 .7 1.6l2.4 1v2l-2.4 1a5.7 5.7 0 0 1-.7 1.6l1 2.3-1.4 1.4-2.3-1a5.7 5.7 0 0 1-1.6.7L12 23h-2l-1-2.4a5.7 5.7 0 0 1-1.6-.7l-2.3 1-1.4-1.4 1-2.3a5.7 5.7 0 0 1-.7-1.6L1.6 15v-2l2.4-1a5.7 5.7 0 0 1 .7-1.6l-1-2.3 1.4-1.4 2.3 1a5.7 5.7 0 0 1 1.6-.7L10 4.5Z"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1.5"
					/>
					<circle cx="11" cy="13" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
				</>
			);
		case 'download':
			return (
				<>
					<path d="M12 3.5v11" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
					<path d="m7.5 11.5 4.5 4.5 4.5-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
					<path d="M5 19.5h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
				</>
			);
		case 'info':
			return (
				<>
					<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.9" />
					<path d="M12 10.4v5.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
					<circle cx="12" cy="7.2" r="1" fill="currentColor" />
				</>
			);
		case 'pencil':
			return (
				<>
					<path
						d="m5 18.8 1.2-4.5L14.8 5.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5l-8.6 8.6Z"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1.8"
					/>
					<path d="m13.5 7 3.5 3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
					<path d="M4.8 19.2 9 18l-3-3Z" fill="currentColor" />
				</>
			);
		case 'play':
			return <polygon points="8,6 18,12 8,18" fill="currentColor" />;
		case 'plusCircle':
			return (
				<>
					<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.9" />
					<path d="M12 7.5v9M7.5 12h9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
				</>
			);
		case 'removeCircle':
			return (
				<>
					<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.9" />
					<path d="m8.5 8.5 7 7m0-7-7 7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
				</>
			);
		case 'resizeFull':
			return (
				<>
					<path d="M8.5 3.5H3.5v5M15.5 3.5h5v5M20.5 15.5v5h-5M8.5 20.5h-5v-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
					<path d="M9 9 3.8 3.8M15 9l5.2-5.2M9 15l-5.2 5.2M15 15l5.2 5.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
				</>
			);
		case 'resizeSmall':
			return (
				<>
					<path d="M10 10H5V5M14 10h5V5M10 14H5v5M14 14h5v5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
					<path d="M5.5 5.5 10 10M18.5 5.5 14 10M5.5 18.5 10 14M18.5 18.5 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
				</>
			);
		case 'search':
			return (
				<>
					<circle cx="10.5" cy="10.5" r="5.7" fill="none" stroke="currentColor" strokeWidth="1.9" />
					<path d="m15 15 4.5 4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
				</>
			);
		case 'share':
			return (
				<>
					<path d="M14 4h6v6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
					<path d="M20 4 10 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
					<path
						d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1.9"
					/>
				</>
			);
		case 'spinner':
			return (
				<>
					<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" />
					<path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
				</>
			);
		case 'star':
			return <polygon points="12,2.8 14.8,8.5 21,9.4 16.5,13.8 17.6,20 12,17.1 6.4,20 7.5,13.8 3,9.4 9.2,8.5" fill="currentColor" />;
		case 'starEmpty':
			return (
				<polygon
					points="12,2.8 14.8,8.5 21,9.4 16.5,13.8 17.6,20 12,17.1 6.4,20 7.5,13.8 3,9.4 9.2,8.5"
					fill="none"
					stroke="currentColor"
					strokeLinejoin="round"
					strokeWidth="1.8"
				/>
			);
		case 'stop':
			return <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />;
	}
}

export function SvgIcon({ name, size = '1em', className = '', title, ...props }: SvgIconProps) {
	const classes = ['moe-icon', className].filter(Boolean).join(' ');

	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			className={classes}
			aria-hidden={title ? undefined : true}
			role={title ? 'img' : 'presentation'}
			focusable="false"
			{...props}
		>
			{title ? <title>{title}</title> : null}
			{getIconFragment(name)}
		</svg>
	);
}
