/**
 * 關於頁面的導航列組件
 * 從 About.tsx 抽出
 */

import { Link } from 'react-router-dom';

interface NavbarAboutProps {
	r2Endpoint?: string;
}

/**
 * 關於頁面的導航列
 */
export function NavbarAbout({ r2Endpoint }: NavbarAboutProps) {
	return (
		<div className="navbar navbar-inverse navbar-fixed-top">
			<Link to="/" className="navbar-brand brand ebas home">
				萌典
			</Link>
			<ul style={{ float: 'left', width: '200px' }} className="nav navbar-nav">
				<li style={{ display: 'inline-block' }}>
					<a
						href="https://racklin.github.io/moedict-desktop/download.html"
						target="_blank"
						rel="noopener noreferrer"
						title="桌面版下載（可離線使用）"
					>
						<i className="icon-download-alt"></i>
					</a>
				</li>
			</ul>
			<ul
				style={{ display: 'inline-block', minWidth: '120px', position: 'absolute', right: 0 }}
				className="nav navbar-nav pull-right"
			>
				<li style={{ display: 'inline-block', position: 'absolute', right: '32px' }}>
					<a href="http://g0v.tw/" target="_blank" rel="noopener noreferrer" title="g0v.tw 零時政府">
						{r2Endpoint && (
							<img
								src="/assets/images/g0v-icon-invert.png"
								height="54"
								width="162"
								style={{ position: 'absolute', top: '-3px', right: '10px' }}
								alt="g0v.tw"
							/>
						)}
					</a>
				</li>
				<li style={{ display: 'inline-block', position: 'absolute', right: 0 }}>
					<Link to="/" title="回到萌典" className="home">
						<i className="icon-remove-circle"></i>
					</Link>
				</li>
			</ul>
		</div>
	);
}

