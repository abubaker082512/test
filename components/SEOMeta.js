import React from 'react'
import Head from 'next/head'

export default function SEOMeta({
  title = 'WinX Pro Pakistan | #1 Online Slots, Live Casino & Sports Betting (Easypaisa & JazzCash)',
  description = 'WinX Pro Pakistan - Official online gaming, live casino, Spribe Aviator, JILI slots & cricket betting. Instant Easypaisa & JazzCash deposits & 2-minute withdrawals. Sign up now for 100% welcome bonus!',
  keywords = 'WinX Pro, WinX Pro Pakistan, WinX Pro login, WinX Pro APK download, online gaming Pakistan, Easypaisa casino Pakistan, JazzCash slots, Spribe Aviator Pakistan, JILI games, Super Ace Pakistan, PSL cricket betting, live dealer casino Pakistan, 10Win alternative Pakistan',
  canonicalUrl = 'https://winxpro.com.pk/',
  ogImage = 'https://winxpro.com.pk/winx-pro-3d-icon.jpg',
  pageType = 'website'
}) {
  const siteUrl = 'https://winxpro.com.pk'

  // Structured Data: Organization
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WinX Pro Pakistan',
    alternateName: ['WinXPro', 'WinX Pro Official', 'WinX Pakistan', 'WinX Gaming'],
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
    description: 'Premier online gaming, live casino, slots & sports betting platform in Pakistan.',
    sameAs: [
      'https://t.me/winxpro_official',
      'https://chat.whatsapp.com/winxpro',
      'https://youtube.com/winxpro',
      'https://facebook.com/winxpro',
      'https://twitter.com/winxpro',
      'https://instagram.com/winxpro'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      availableLanguage: ['English', 'Urdu'],
      areaServed: 'PK'
    }
  }

  // Structured Data: WebSite with Sitelinks Search Box
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WinX Pro',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/casino?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  // Structured Data: SoftwareApplication (Mobile APK & PWA)
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'WinX Pro Mobile App',
    operatingSystem: 'Android, iOS, Web',
    applicationCategory: 'GameApplication',
    downloadUrl: `${siteUrl}/android`,
    installUrl: `${siteUrl}/download`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'PKR'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '24850'
    }
  }

  // Structured Data: FAQPage for Google Rich Snippets in SERPs
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is WinX Pro Pakistan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'WinX Pro is Pakistan\'s leading online gaming and sports entertainment platform offering 11,200+ games including Spribe Aviator, JILI slots, PG Soft, Live Evolution Casino, and cricket betting on PSL and international matches.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I deposit money using Easypaisa and JazzCash?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To deposit on WinX Pro, log in, navigate to the Wallet section, choose Easypaisa or JazzCash, enter the deposit amount (min Rs 100), and complete the instant transfer via QR code or account number with zero fees.'
        }
      },
      {
        '@type': 'Question',
        name: 'How fast are withdrawals processed on WinX Pro?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Withdrawals are processed automatically in under 2 minutes directly to your Pakistani Easypaisa, JazzCash, or bank account 24/7.'
        }
      },
      {
        '@type': 'Question',
        name: 'How can I download the WinX Pro APK on Android?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Visit winxpro.com.pk/android and click "Download Android App" to get the official WinX Pro APK file. Install it in seconds to enjoy fast gaming and instant alerts.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is there a welcome bonus for new players in Pakistan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! New members in Pakistan receive an instant welcome bonus on their 1st, 2nd, 3rd, and 4th deposits, plus daily VIP rebate rewards and referral cash.'
        }
      }
    ]
  }

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Pakistan Geo-Targeting Tags */}
      <meta name="geo.region" content="PK" />
      <meta name="geo.placename" content="Pakistan" />
      <meta name="geo.position" content="30.3753;69.3451" />
      <meta name="ICBM" content="30.3753, 69.3451" />
      <meta name="target" content="all" />
      <meta name="audience" content="all" />
      <meta name="coverage" content="Worldwide" />
      <meta name="distribution" content="Global" />
      <meta name="rating" content="General" />
      <meta name="language" content="English, Urdu" />

      {/* Crawlers & Indexing */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={pageType} />
      <meta property="og:site_name" content="WinX Pro Pakistan" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content="WinX Pro Pakistan Official Platform" />
      <meta property="og:locale" content="en_PK" />
      <meta property="og:locale:alternate" content="ur_PK" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@winxpro" />
      <meta name="twitter:creator" content="@winxpro" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data Scripts (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </Head>
  )
}
