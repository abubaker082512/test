import React, { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import '../styles/globals.css'
import { AuthProvider } from '../context/AuthContext'
import SplashScreen from '../components/SplashScreen'
import UniversalReferralWidget from '../components/UniversalReferralWidget'

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
  return (
    <AuthProvider>
      <Head>
        <title>WinX Pro - Premier Live Casino, Slots & Sports</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="application-name" content="WinX Pro" />
        <meta name="apple-mobile-web-app-title" content="WinX Pro" />
        <meta name="theme-color" content="#0f0a1e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/winx-logo.png" />
        <link rel="apple-touch-icon" href="/winx-logo.png" />
      </Head>
      <ReferralTracker />
      <SplashScreen />
      <Component {...pageProps} />
      <UniversalReferralWidget />
    </AuthProvider>
  )
}

export default MyApp

