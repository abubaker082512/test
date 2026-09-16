import Head from 'next/head'
import '../styles/globals.css'
import { AuthProvider } from '../context/AuthContext'
import SplashScreen from '../components/SplashScreen'

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
      <SplashScreen />
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp
