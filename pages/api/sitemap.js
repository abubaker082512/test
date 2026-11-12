export default function handler(req, res) {
  const host = req.headers.host || 'winxpro.com.pk'
  const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https')
  const baseUrl = `${protocol}://${host}`
  const now = new Date().toISOString()

  const staticPages = [
    { path: '', changefreq: 'hourly', priority: '1.00' },
    { path: 'casino', changefreq: 'daily', priority: '0.90' },
    { path: 'sports', changefreq: 'daily', priority: '0.90' },
    { path: 'offers', changefreq: 'daily', priority: '0.85' },
    { path: 'invite', changefreq: 'weekly', priority: '0.80' },
    { path: 'download', changefreq: 'weekly', priority: '0.85' },
    { path: 'android', changefreq: 'weekly', priority: '0.80' },
    { path: 'signup', changefreq: 'monthly', priority: '0.75' },
    { path: 'support', changefreq: 'monthly', priority: '0.70' }
  ]

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticPages
  .map(page => {
    const url = page.path ? `${baseUrl}/${page.path}` : baseUrl
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  })
  .join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200')
  res.status(200).send(sitemapXml)
}
