import React from 'react'
import Head from 'next/head'

export default function SEOMeta({
  title = 'WinX Pro Pakistan | #1 Online Casino, Real Money Slots, Spribe Aviator & PSL Cricket Betting',
  description = 'WinX Pro Pakistan (winxpro.com.pk) is Pakistan\'s #1 trusted online casino, real money slots, live dealer tables, Spribe Aviator crash game & PSL cricket betting platform. Instant Easypaisa & JazzCash deposit, 2-minute auto withdrawal 24/7. Register now & claim 100% welcome bonus up to Rs 8,888!',
  keywords = 'WinX Pro, WinX Pro Pakistan, WinX Pro login, WinX Pro APK download, WinX Pro app, WinX Pro register, WinX Pro casino, WinX official website, winxpro.com.pk, winx login, winx apk, winx bet, online casino Pakistan, Pakistan online casino real money, best online casino in Pakistan, casino online Pakistan, online gambling Pakistan, real money casino Pakistan, live casino Pakistan, live dealer casino Pakistan, Pakistan casino games, trusted online casino Pakistan, top casino apps in Pakistan, online slots Pakistan, real money slots Pakistan, JILI slots Pakistan, JILI games, Super Ace slot, Fortune Gems 2, Fortune Gems 3, Money Coming slot, Boxing King, Golden Empire, Crazy Hunter, PG Soft slots, Mahjong Ways 2, Fortune Rabbit, Fortune Tiger, Pragmatic Play Pakistan, Gates of Olympus Pakistan, Sweet Bonanza Pakistan, slot games Pakistan real money, free spins casino Pakistan, jackpot slots Pakistan, Spribe Aviator Pakistan, Aviator game online, Aviator crash game Pakistan, Aviator predictor Pakistan, Aviator signal Pakistan, Aviator real money Pakistan, online Aviator login, Mines game Pakistan, Plinko Pakistan, crash games real money, cricket betting Pakistan, PSL betting app, PSL cricket betting online, live cricket betting Pakistan, IPL betting Pakistan, T20 World Cup betting, ICC Champions Trophy betting, Pakistan sports betting app, online football betting Pakistan, live cricket match odds Pakistan, best bookmaker Pakistan, Easypaisa casino Pakistan, JazzCash casino Pakistan, Easypaisa betting app, JazzCash gambling app, instant withdrawal casino Pakistan, 2 minute withdrawal casino Pakistan, zero fee deposit casino, Easypaisa deposit game, JazzCash deposit game, USDT casino Pakistan, crypto betting Pakistan, 10Win alternative Pakistan, 10Win login, BetPK Pakistan, BJ Baji Pakistan, Babu88 Pakistan, MegaPari Pakistan, 1xBet Pakistan alternative, Melbet Pakistan, Mostbet Pakistan, Jeetwin Pakistan, Khelraja Pakistan, casino welcome bonus Pakistan, free Rs 100 sign up bonus, 100% deposit bonus Pakistan, daily cashback casino Pakistan, VIP rebate casino Pakistan, free spins no deposit Pakistan, deposit 100 get 100 bonus Pakistan',
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
    alternateName: ['WinXPro', 'WinX Pro Official', 'WinX Pakistan', 'WinX Gaming', 'WinX Casino', 'WinX Bet'],
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
    description: 'Pakistan\'s premier real money online casino, live dealer tables, certified slots, Spribe Aviator, and PSL cricket betting platform with instant Easypaisa & JazzCash banking.',
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
    name: 'WinX Pro Mobile App - Online Casino & Sports Betting',
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
      ratingCount: '28450'
    }
  }

  // Structured Data: BreadcrumbList for Enhanced Google Rich Results
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Online Casino & Slots',
        item: `${siteUrl}/casino`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'PSL & Sports Betting',
        item: `${siteUrl}/sports`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Casino Bonuses & Promotions',
        item: `${siteUrl}/offers`
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: 'Download Android APK',
        item: `${siteUrl}/download`
      }
    ]
  }

  // Structured Data: FAQPage for High-Ranking Google Rich Snippets in Pakistan
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is WinX Pro Pakistan and how does it work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'WinX Pro (winxpro.com.pk) is Pakistan\'s #1 licensed online casino, slots, Spribe Aviator, and sports betting platform. Players in Pakistan can create a free account, deposit real Pakistani Rupees (PKR) via Easypaisa or JazzCash, play 11,200+ certified casino games, and withdraw winnings directly to their mobile wallets in 2 minutes.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I deposit money using Easypaisa and JazzCash on WinX Pro?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To deposit on WinX Pro: 1. Log in to your WinX Pro account. 2. Go to the Deposit section. 3. Select Easypaisa or JazzCash (Instant QR or Account Transfer). 4. Enter the amount (minimum Rs 100). 5. Scan the QR code or send payment and paste the Transaction ID (TID) / upload screenshot. Your balance is credited instantly with a +35% first deposit bonus!'
        }
      },
      {
        '@type': 'Question',
        name: 'How fast are withdrawals processed on WinX Pro Pakistan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Withdrawals on WinX Pro are automated 24/7 and processed directly to your Pakistani Easypaisa wallet, JazzCash wallet, or bank account (Meezan, HBL, Allied, Alfalah, UBL) in under 2 minutes with zero withdrawal fees.'
        }
      },
      {
        '@type': 'Question',
        name: 'How can I play Spribe Aviator real money game on WinX Pro?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'WinX Pro hosts the official certified Spribe Aviator game with real-time multiplayer multipliers, live bets, auto-cashout, and double bet features. Simply log in, tap Aviator from the Hot Games lobby, place your bet starting from Rs 20, and cash out before the lucky plane flies away!'
        }
      },
      {
        '@type': 'Question',
        name: 'Which online slots are most popular in Pakistan on WinX Pro?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The most popular real money slots on WinX Pro include JILI Super Ace, Fortune Gems 2 & 3, Money Coming, Boxing King, Golden Empire, PG Soft Mahjong Ways 2, Fortune Rabbit, and Pragmatic Play Gates of Olympus and Sweet Bonanza, all offering huge RTP payouts up to 10,000x!'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I bet on PSL (Pakistan Super League) and cricket on WinX Pro?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! WinX Pro Sportsbook offers live in-play cricket betting for the Pakistan Super League (PSL), IPL, ICC T20 World Cup, Champions Trophy, and international Test/ODI matches with highest match winner rates, over-by-over runs, top batsman, and boundary markets.'
        }
      },
      {
        '@type': 'Question',
        name: 'How to download the WinX Pro APK on Android in Pakistan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To download the official WinX Pro APK, visit winxpro.com.pk/download or tap "Install Android App" on the homepage. Download the 13.8 MB APK file, tap install when prompted, and enjoy instant full-screen gaming, biometric login, and push notification bonuses.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is there a welcome bonus and free cash for new players on WinX Pro?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! All new Pakistani members receive a 100% welcome bonus on their 1st deposit (+35%), 2nd deposit (+25%), 3rd deposit (+25%), and 4th deposit (+35%) up to PKR 8,888, plus daily check-in rewards, VIP turnover rebates, and Rs 2,800 referral bonuses.'
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

      {/* Pakistan Geo-Targeting & Local SEO Tags */}
      <meta name="geo.region" content="PK" />
      <meta name="geo.placename" content="Pakistan, Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Gujranwala, Sialkot" />
      <meta name="geo.position" content="30.3753;69.3451" />
      <meta name="ICBM" content="30.3753, 69.3451" />
      <meta name="target" content="all" />
      <meta name="audience" content="all" />
      <meta name="coverage" content="Pakistan, Worldwide" />
      <meta name="distribution" content="Global" />
      <meta name="rating" content="Mature" />
      <meta name="language" content="English, Urdu" />

      {/* Search Engine Crawlers & Indexing Directives */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

      {/* Open Graph / Facebook Meta Tags */}
      <meta property="og:type" content={pageType} />
      <meta property="og:site_name" content="WinX Pro Pakistan" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content="WinX Pro Pakistan - #1 Online Casino, Slots & Sports Betting" />
      <meta property="og:locale" content="en_PK" />
      <meta property="og:locale:alternate" content="ur_PK" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@winxpro" />
      <meta name="twitter:creator" content="@winxpro" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data Scripts (JSON-LD) for Google SERP Superiority */}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </Head>
  )
}
