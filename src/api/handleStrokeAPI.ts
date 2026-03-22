/**
 * 筆順 JSON 代理 API
 *
 * 路由：GET /api/stroke-json/{codepoint}.json
 * 作用：代理 Rackspace CDN 的筆畫資料，解決瀏覽器 CORS 限制
 *
 * 原始資料來源（moedict-webkit main.ls http-map['stroke-json']）：
 * https://829091573dd46381a321-9e8a43b8d3436eaf4353af683c892840.ssl.cf1.rackcdn.com/
 */

const STROKE_CDN = 'https://829091573dd46381a321-9e8a43b8d3436eaf4353af683c892840.ssl.cf1.rackcdn.com';

export async function handleStrokeAPI(
  request: Request,
  url: URL,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const routePrefix = '/api/stroke-json/';
  // 取出 codepoint 部分，例如 /api/stroke-json/840b.json → 840b.json
  const cp = decodeURIComponent(url.pathname.slice(routePrefix.length));

  // 僅接受單一路徑段，避免多段路徑造成重複請求或錯誤路由
  if (!cp || cp.includes('/') || !/^[0-9a-f]{4,6}\.json$/i.test(cp)) {
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: '無效的 codepoint 格式' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }

  const upstream = `${STROKE_CDN}/${cp}`;

  try {
    const upstreamRes = await fetch(upstream, {
      method: 'GET',
      headers: { 'User-Agent': request.headers.get('User-Agent') || 'Cloudflare-Worker' },
    });

    if (!upstreamRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: `找不到筆畫資料：${cp}` }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
        }
      );
    }

    return new Response(upstreamRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error('[handleStrokeAPI] 代理失敗:', err);
    return new Response(
      JSON.stringify({ error: 'Proxy Error', message: '筆畫資料代理失敗' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }
}
