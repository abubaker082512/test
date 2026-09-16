// Production Reverse Proxy for Live Casino Stream
// Strips restrictive upstream CSP and anti-nesting checks so games embed seamlessly across all domains and browsers

export default async function handler(req, res) {
  const { token, dtoken, url: rawUrl } = req.query;

  let targetUrl = rawUrl;
  if (!targetUrl && token) {
    targetUrl = `https://livecasinoapi.betnex.co/game?token=${encodeURIComponent(token)}${dtoken ? `&dtoken=${encodeURIComponent(dtoken)}` : ''}`;
  }

  if (!targetUrl) {
    return res.status(400).send('Missing session URL or token');
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://livecasinoapi.betnex.co/'
      }
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send(`Upstream provider error: ${upstreamRes.statusText}`);
    }

    let html = await upstreamRes.text();

    // 1. Rewrite relative loader & asset URLs to absolute BetNex URLs
    html = html.replace(/src="\/loader\//g, 'src="https://livecasinoapi.betnex.co/loader/');
    html = html.replace(/href="\/loader\//g, 'href="https://livecasinoapi.betnex.co/loader/');
    html = html.replace(/url\(\/loader\//g, 'url(https://livecasinoapi.betnex.co/loader/');

    // 2. Remove client-side window.top/window.parent frame-busting check
    html = html.replace(/if\s*\(\s*window\.self\s*!==\s*window\.top\s*\)[\s\S]*?catch\s*\(\s*e\s*\)\s*\{\s*\}/gi, '/* nested frame check bypassed */');
    html = html.replace(/try\s*\{\s*if\s*\(\s*window\.parent\s*!==\s*window\.top\s*\)\s*block\(['"]nested['"]\);\s*\}\s*catch\s*\(\s*e\s*\)\s*\{\s*block\(['"]xorigin['"]\);\s*\}/gi, '/* xorigin check bypassed */');

    // 3. Set permissive iframe and caching headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.status(200).send(html);
  } catch (err) {
    console.error('Casino stream proxy error:', err);
    return res.status(500).send('Failed to stream casino game session');
  }
}
