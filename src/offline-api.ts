/**
 * Offline API handler for Capacitor Android app.
 *
 * Monkey-patches window.fetch to intercept /api/* requests and serve
 * dictionary data from locally bundled files. The packed bucket format
 * and entry processing logic are reused from handleDictionaryAPI.ts.
 */

import { handleDictionaryAPI } from './api/handleDictionaryAPI.ts';

// Keep the original fetch for loading local files and external requests
const originalFetch = window.fetch.bind(window);

/**
 * Local file-backed implementation of the R2 DictionaryBucketLike interface.
 * Reads dictionary data from /dictionary/* static files bundled in the APK.
 */
const offlineDictionary = {
  async get(key: string): Promise<{ text(): Promise<string> } | null> {
    try {
      const response = await originalFetch(`/dictionary/${key}`);
      if (!response.ok) return null;
      const content = await response.text();
      return { text: () => Promise.resolve(content) };
    } catch {
      return null;
    }
  },
};

const offlineEnv = { DICTIONARY: offlineDictionary };

/**
 * Handle /api/* requests locally, matching the Cloudflare Worker routing.
 */
async function handleOfflineApiRequest(url: string, init?: RequestInit): Promise<Response> {
  const parsedUrl = new URL(url, window.location.origin);
  const pathname = parsedUrl.pathname;

  // /api/config → static configuration for offline mode
  if (pathname === '/api/config') {
    return Response.json({
      assetBaseUrl: '/assets-legacy',
      dictionaryBaseUrl: '',
    });
  }

  // /api/search-index/{lang}.json → serve from /search-index/
  const searchIndexMatch = pathname.match(/^\/api\/search-index\/([athc])\.json$/);
  if (searchIndexMatch) {
    return originalFetch(`/search-index/${searchIndexMatch[1]}.json`, init);
  }

  // /api/index/{lang}.json → serve from /dictionary/{lang}/index.json
  const indexMatch = pathname.match(/^\/api\/index\/([athc])\.json$/);
  if (indexMatch) {
    return originalFetch(`/dictionary/${indexMatch[1]}/index.json`, init);
  }

  // /api/xref/{lang}.json → serve from /dictionary/{lang}/xref.json
  const xrefMatch = pathname.match(/^\/api\/xref\/([athc])\.json$/);
  if (xrefMatch) {
    const resp = await originalFetch(`/dictionary/${xrefMatch[1]}/xref.json`, init);
    if (resp.ok) return resp;
    // Return empty xref if file doesn't exist
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // /api/stroke-json/{codepoint}.json → serve from bundled data, fallback to CDN
  if (pathname.startsWith('/api/stroke-json/')) {
    const cp = decodeURIComponent(pathname.slice('/api/stroke-json/'.length));
    if (!cp || !/^[0-9a-f]{4,6}\.json$/i.test(cp)) {
      return Response.json({ error: 'Bad Request' }, { status: 400 });
    }
    // Try local bundled data first
    try {
      const local = await originalFetch(`/stroke-json/${cp}`);
      if (local.ok) return local;
    } catch { /* fall through to CDN */ }
    // Fallback to CDN if not bundled
    try {
      const cdnUrl = `https://829091573dd46381a321-9e8a43b8d3436eaf4353af683c892840.ssl.cf1.rackcdn.com/${cp}`;
      return await originalFetch(cdnUrl);
    } catch {
      return Response.json(
        { error: 'Offline', message: 'Stroke data unavailable' },
        { status: 503 },
      );
    }
  }

  // All other /api/*.json → delegate to handleDictionaryAPI
  // This handles: word lookups, radical lookups (@), category lists (=), sub-routes (/a/, /t/, etc.)
  const request = new Request(parsedUrl.href, init);
  return handleDictionaryAPI(request, parsedUrl, offlineEnv);
}

// Monkey-patch XMLHttpRequest to intercept /api/ requests (for jQuery $.ajax)
const OriginalXHR = XMLHttpRequest;
const originalXHROpen = OriginalXHR.prototype.open;
OriginalXHR.prototype.open = function (
  method: string,
  url: string | URL,
  ...rest: [boolean?, string?, string?]
) {
  const urlStr = typeof url === 'string' ? url : url.href;
  if (urlStr.startsWith('/api/stroke-json/')) {
    // Serve from bundled stroke data (local files)
    const cp = urlStr.slice('/api/stroke-json/'.length);
    return originalXHROpen.call(this, method, `/stroke-json/${cp}`, ...rest);
  }
  return originalXHROpen.call(this, method, url, ...rest);
} as typeof originalXHROpen;

// Monkey-patch fetch to intercept /api/ requests
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url: string;
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.href;
  } else {
    url = input.url;
  }

  // Only intercept /api/ requests (relative or same-origin)
  const isApiRequest =
    url.startsWith('/api/') ||
    (url.startsWith(window.location.origin) && new URL(url).pathname.startsWith('/api/'));

  if (isApiRequest) {
    return handleOfflineApiRequest(url, init);
  }

  return originalFetch(input, init);
};
