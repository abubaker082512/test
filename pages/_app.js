import React, { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Analytics } from '@vercel/analytics/react'
import '../styles/globals.css'
import { AuthProvider } from '../context/AuthContext'
import SplashScreen from '../components/SplashScreen'
import UniversalReferralWidget from '../components/UniversalReferralWidget'
import SEOMeta from '../components/SEOMeta'

function ReferralTracker() {
  const router = useRouter()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const refCode = params.get('ref') || params.get('referral') || params.get('invite') || params.get('code')
      if (refCode) {
        localStorage.setItem('winxpro_referrer', refCode)
      }
    }
  }, [router.asPath])
  return null
}

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const isAdmin = router.pathname ? router.pathname.startsWith('/admin') : false

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isAdmin) {
        document.body.classList.add('admin-mode')
      } else {
        document.body.classList.remove('admin-mode')
      }
    }
  }, [isAdmin, router.pathname])

  return (
    <AuthProvider>
      <SEOMeta />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="application-name" content="WinX Pro" />
        <meta name="apple-mobile-web-app-title" content="WinX Pro" />
        <meta name="theme-color" content="#0B0E14" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <ReferralTracker />
      <SplashScreen />
      <Component {...pageProps} />
      <UniversalReferralWidget />
      <Analytics />
    </AuthProvider>
  )
}

export default MyApp
