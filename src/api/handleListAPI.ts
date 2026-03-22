/**
 * 分類詞彙列表 API
 * 處理 /api/={類名}、/api/'={類名}、/api/:={類名}、/api/~={類名} 的請求
 * 從 R2 讀取對應 JSON 陣列並回傳
 */

type Lang = 'a' | 't' | 'h' | 'c';

interface ListEnv {
  DICTIONARY: {
    get(key: string): Promise<{ text(): Promise<string> } | null>;
  };
}

interface ParsedList {
  lang: Lang;
  category: string;
}

/**
 * 從 /api/ 後的路徑段解析語言和分類名稱
 * 路徑格式：
 *   =成語       → lang='a', category='成語'
 *   '=諺語      → lang='t', category='諺語'
 *   :=諺語      → lang='h', category='諺語'
 *   ~=同實異名  → lang='c', category='同實異名'
 */
function parseLangAndCategory(pathname: string): ParsedList | null {
  // 移除 /api/ 前綴，並解碼 URI
  const raw = decodeURIComponent(pathname.replace(/^\/api\//, ''));

  let lang: Lang = 'a';
  let rest = raw;

  if (raw.startsWith("'")) {
    lang = 't';
    rest = raw.slice(1);
  } else if (raw.startsWith(':')) {
    lang = 'h';
    rest = raw.slice(1);
  } else if (raw.startsWith('~')) {
    lang = 'c';
    rest = raw.slice(1);
  }

  if (!rest.startsWith('=')) return null;

  const category = rest.slice(1);
  if (!category) return null;

  return { lang, category };
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(request: Request, body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  });
}

export async function handleListAPI(
  request: Request,
  url: URL,
  env: ListEnv,
): Promise<Response> {
  const parsed = parseLangAndCategory(url.pathname);

  if (!parsed) {
    return jsonResponse(request, { error: 'Bad Request', message: '路徑格式錯誤' }, 400);
  }

  const { lang, category } = parsed;

  // R2 key 格式：{lang}/={category}.json，例如 a/=成語.json
  const key = `${lang}/=${category}.json`;

  console.log(`[ListAPI] 查詢 R2 key: ${key}`);

  const obj = await env.DICTIONARY.get(key);

  if (!obj) {
    return jsonResponse(
      request,
      { error: 'Not Found', message: `找不到分類：${category}` },
      404,
    );
  }

  const data = await obj.text();

  // 驗證資料為 JSON 陣列
  let parsed_data: unknown;
  try {
    parsed_data = JSON.parse(data);
  } catch {
    return jsonResponse(request, { error: 'Internal Error', message: '資料格式異常' }, 500);
  }

  if (!Array.isArray(parsed_data)) {
    return jsonResponse(request, { error: 'Internal Error', message: '資料非陣列格式' }, 500);
  }

  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeaders(request),
    },
  });
}
