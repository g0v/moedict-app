/**
 * Minimal head management for offline Android app.
 * The full SSR head module handles SEO meta tags (og:*, twitter:*) which
 * are irrelevant inside a WebView. We only update document.title.
 */

type DictionaryLang = 'a' | 't' | 'h' | 'c';

interface PageHead {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  ogImageType: string;
  ogImageWidth: string;
  ogImageHeight: string;
  twitterImage: string;
  twitterSite: string;
  twitterCreator: string;
}

const LANG_NAMES: Record<DictionaryLang, string> = {
  a: '國語',
  t: '臺語',
  h: '客語',
  c: '兩岸',
};

function makeHead(title: string): PageHead {
  return {
    title,
    description: '',
    ogTitle: title,
    ogDescription: '',
    ogUrl: '',
    ogImage: '',
    ogImageType: '',
    ogImageWidth: '',
    ogImageHeight: '',
    twitterImage: '',
    twitterSite: '',
    twitterCreator: '',
  };
}

export function resolveHeadByPath(pathname: string): PageHead {
  const path = decodeURIComponent(pathname).replace(/^\//, '');
  if (!path || path === 'about' || path === 'about.html') {
    return makeHead('萌典');
  }
  const word = path.replace(/^['~:]/, '');
  return makeHead(word ? `${word} - 萌典` : '萌典');
}

export function getDictionaryHead(word: string, lang: DictionaryLang): PageHead {
  const langName = LANG_NAMES[lang] || '';
  const title = word ? `${word} - 萌典${langName ? `（${langName}）` : ''}` : '萌典';
  return makeHead(title);
}

export function applyHeadToDocument(head: PageHead): void {
  document.title = head.title;
}

export function applyHeadByPath(pathname: string): void {
  applyHeadToDocument(resolveHeadByPath(pathname));
}

export function escapeHeadContent(s: string): string {
  return s;
}
