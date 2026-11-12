/**
 * Ping Search Engines with the latest Sitemap URL
 * Usage: node scripts/ping-search-engines.js [optional_domain]
 * Example: node scripts/ping-search-engines.js https://winxpro.com.pk
 */

const https = require('https')
const http = require('http')

const targetDomain = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'https://winxpro.com.pk'
const sitemapUrl = `${targetDomain.replace(/\/$/, '')}/sitemap.xml`

const pingEndpoints = [
  { name: 'Google Search Console', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
  { name: 'Bing & Yahoo Webmaster', url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` }
]

console.log(`\n======================================================`)
console.log(`🚀 Pinging Search Engines for Sitemap: ${sitemapUrl}`)
console.log(`======================================================\n`)

pingEndpoints.forEach(endpoint => {
  const client = endpoint.url.startsWith('https') ? https : http
  client.get(endpoint.url, res => {
    console.log(`[✓] ${endpoint.name} responded with status: ${res.statusCode}`)
  }).on('error', err => {
    console.log(`[!] ${endpoint.name} ping failed: ${err.message}`)
  })
})
