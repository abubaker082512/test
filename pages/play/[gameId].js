import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'

// WinX Custom Mobile-Theme Game Engines (480px Native Portrait Editions)
import SuperAce from '../../components/games/SuperAce'
import FortuneGems from '../../components/games/FortuneGems'
import MahjongWays from '../../components/games/MahjongWays'
import WildBounty from '../../components/games/WildBounty'
import CrashGame from '../../components/games/CrashGame'
import FishingJoy from '../../components/games/FishingJoy'
import RouletteGame from '../../components/games/RouletteGame'
import BlackjackGame from '../../components/games/BlackjackGame'
import BaccaratGame from '../../components/games/BaccaratGame'
import DragonTigerGame from '../../components/games/DragonTigerGame'
import VideoPokerGame from '../../components/games/VideoPokerGame'
import PlinkoGame from '../../components/games/PlinkoGame'
import MinesweeperGame from '../../components/games/MinesweeperGame'
import DiceGame from '../../components/games/DiceGame'
import LimboGame from '../../components/games/LimboGame'
import CoinFlip from '../../components/games/CoinFlip'
import HiloGame from '../../components/games/HiloGame'
import KenoGame from '../../components/games/KenoGame'
import SicBoGame from '../../components/games/SicBoGame'
import PenaltyShootout from '../../components/games/PenaltyShootout'
import DerbyGame from '../../components/games/DerbyGame'
import CockfightGame from '../../components/games/CockfightGame'
import WheelGame from '../../components/games/WheelGame'
import ClassicSlots from '../../components/games/ClassicSlots'
import SportsBook from '../../components/games/SportsBook'
import DiamondCasinoGame from '../../components/games/DiamondCasinoGame'
import MoneyComing from '../../components/games/MoneyComing'
import SpribeOfficialEngine from '../../components/games/SpribeOfficialEngine'
import PragmaticOfficialEngine from '../../components/games/PragmaticOfficialEngine'

export default function PlayGame() {
  const router = useRouter()
  const { gameId } = router.query
  const { user, loading, isDemoMode, demoBalance, toggleDemoMode, spendDemoBalance, addDemoBalance } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [ftgData, setFtgData] = useState(null)
  const [showFtgDetails, setShowFtgDetails] = useState(false)
  const [iframeReloadKey, setIframeReloadKey] = useState(0)
  const iframeRef = useRef(null)
  const bootBalanceRef = useRef(null)

  // Live Provider Stream State
  const [gameMode, setGameMode] = useState('api')
  const [liveGameUrl, setLiveGameUrl] = useState(null)
  const [apiGameName, setApiGameName] = useState(null)
  const [apiProvider, setApiProvider] = useState(null)
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  const activeUser = user || {
    id: 'guest_player',
    uid: 'guest_player',
    email: 'guest@winxpro.com.pk',
    displayName: 'Guest'
  }

  // Effective wallet balance (Real or Demo)
  const activeBalance = isDemoMode ? demoBalance : (wallet && wallet.balance !== undefined ? parseFloat(wallet.balance) : 150.0)
  const activeWalletObj = {
    balance: activeBalance,
    currency: 'PKR'
  }

  if (bootBalanceRef.current === null || (wallet && bootBalanceRef.current === 150.0 && parseFloat(wallet.balance) !== 150.0)) {
    bootBalanceRef.current = activeBalance
  }

  // Push WINX_INIT to the game iframe without reloading its src URL
  const pushInitToIframe = (overrideBal) => {
    try {
      const win = iframeRef.current && iframeRef.current.contentWindow
      if (!win) return
      win.postMessage({
        type: 'WINX_INIT',
        userId: activeUser.id || activeUser.uid || 'guest_player',
        email: activeUser.email || '',
        isDemo: Boolean(isDemoMode),
        balance: typeof overrideBal === 'number' ? overrideBal : activeBalance
      }, '*')
    } catch (e) {}
  }

  // Fetch real wallet balance (works for both authenticated users and guest_player)
  const fetchWallet = async () => {
    const uid = user ? (user.id || user.uid || '') : 'guest_player'
    const email = user ? (user.email || '') : ''
    try {
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`)
      const json = await res.json()
      if (json.success && json.wallet) {
        setWallet(json.wallet)
        const fetchedBal = parseFloat(json.wallet.balance)
        if (!isNaN(fetchedBal) && !isDemoMode) {
          bootBalanceRef.current = fetchedBal
          pushInitToIframe(fetchedBal)
        }
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (!loading) {
      fetchWallet()
    }
    const onWalletUpdated = () => fetchWallet()
    window.addEventListener('wallet-updated', onWalletUpdated)
    return () => window.removeEventListener('wallet-updated', onWalletUpdated)
  }, [user, loading])

  // Sync mode/balance changes to iframe via postMessage
  useEffect(() => {
    pushInitToIframe(activeBalance)
  }, [isDemoMode, user])

  // Listen for real-time balance updates from hosted GitHub open-source game iframes via WinXBridge
  useEffect(() => {
    const handleBridgeMessage = (event) => {
      const data = event?.data
      if (!data || data.type !== 'WINX_BALANCE_SYNC') return
      const nextBalance = Number(data.balance)
      if (!Number.isFinite(nextBalance)) return

      if (data.isDemo) {
        const diff = nextBalance - demoBalance
        if (diff < -0.01) spendDemoBalance(Math.abs(diff))
        else if (diff > 0.01) addDemoBalance(diff)
      } else {
        setWallet((prev) => ({
          ...(prev || { currency: 'PKR' }),
          balance: nextBalance
        }))
      }
    }

    window.addEventListener('message', handleBridgeMessage)
    return () => window.removeEventListener('message', handleBridgeMessage)
  }, [demoBalance, spendDemoBalance, addDemoBalance])

  // Check if slug belongs to our authentic React Engines / Official Embeds
  const isWinXThemeReactSlug = (rawSlug) => {
    const s = String(rawSlug || '').toLowerCase()
    if (s.startsWith('winx-theme-') || s.startsWith('diamond-')) return true
    const diamondTableIds = [
      'teen20', 'joker20', 'teen', 'teen9', 'ab20', 'abj',
      'lucky7', 'lucky7eu', 'dt20', 'dtl20', 'card32',
      'amar', 'btable', 'worli', 'poker20', 'cmatch20', 'superover', 'baccarat'
    ]
    if (diamondTableIds.includes(s)) return true

    // Direct authentic provider engine keys
    const flagshipKeywords = [
      'super-ace', 'fortune-gem', 'money-coming', 'mahjong', 'bounty',
      'aviator', 'plinko', 'mines', 'dice', 'crash',
      'olympus', 'sweet-bonanza', 'sugar-rush', 'starlight', 'big-bass',
      'baccarat', 'dragon-tiger', 'video-poker', 'fishing', 'penalty',
      'derby', 'cockfight', 'sicbo', 'sic-bo', 'coin-flip', 'wheel',
      'roulette', 'blackjack', 'limbo', 'hilo', 'keno', 'sport'
    ]
    if (flagshipKeywords.some(k => s.includes(k))) return true

    // Specific hex game IDs from home page
    const homeHexIds = [
      'e30cd08c54817096e863975e309bb457', // Gates of Olympus
      '8a0b30eb466a8a07027cbddc19369d0f', // Sweet Bonanza
      '259ad8e105ef217dad404bffe0fff257', // Mahjong Wins
      'ba3dc54ad1f451262910dda6c61001ce', // Aztec Gems
      '3a557646c3abb12201c0b8810a8c0966', // Money Coming
      'c98bb64436826fe9a2c62955ff70cba9', // Wild Bounty Showdown
      'ba2adf72179e1ead9e3dae8f0a7d4c07', // Mahjong Ways 2
      '1189baca156e1bbbecc3b26651a63565', // Mahjong Ways
      'bdfb23c974a2517198c5443adeea77a8', // Super Ace
      '664fba4da609ee82b78820b1f570f4ad', // Fortune Gems
      'a04d1f3eb8ccec8a4823bdf18e3f0e84', // Aviator
      '981f5f9675002fbeaaf24c4128b938d7', // Boxing King
      '8c62471fd4e28c084a61811a3958f7a1'  // Crazy 777
    ]
    return homeHexIds.includes(s)
  }

  // Render our native 480px WinX Mobile-Theme React Game Component
  const renderWinXThemeReactEngine = () => {
    const rawLower = String(gameId || '').toLowerCase()
    const diamondTableIds = [
      'teen20', 'joker20', 'teen', 'teen9', 'ab20', 'abj',
      'lucky7', 'lucky7eu', 'dt20', 'dtl20', 'card32',
      'amar', 'btable', 'worli', 'poker20', 'baccarat', 'cmatch20', 'superover'
    ]
    if (rawLower.startsWith('diamond-') || diamondTableIds.includes(rawLower)) {
      const cleanTableId = rawLower.replace(/^diamond-/, '')
      return (
        <DiamondCasinoGame
          initialTableId={cleanTableId}
          user={activeUser}
          wallet={activeWalletObj}
          fetchWallet={fetchWallet}
          isDemoMode={isDemoMode}
          demoBalance={demoBalance}
          spendDemoBalance={spendDemoBalance}
          addDemoBalance={addDemoBalance}
        />
      )
    }
    const slug = rawLower.replace(/^winx-theme-/, '').replace(/^winx-/, '')
    const props = {
      user: activeUser,
      wallet: activeWalletObj,
      fetchWallet,
      isDemoMode,
      demoBalance,
      spendDemoBalance,
      addDemoBalance
    }

    // Official Pragmatic Play Slots
    if (
      slug.includes('olympus') ||
      slug === 'e30cd08c54817096e863975e309bb457' ||
      slug.includes('sweet-bonanza') ||
      slug === '8a0b30eb466a8a07027cbddc19369d0f' ||
      slug.includes('sugar-rush') ||
      slug.includes('starlight') ||
      slug.includes('aztec') ||
      slug === 'ba3dc54ad1f451262910dda6c61001ce' ||
      slug === '259ad8e105ef217dad404bffe0fff257'
    ) {
      return <PragmaticOfficialEngine {...props} gameSlug={slug} />
    }

    // Official Spribe Instant / Crash Games
    if (
      slug.includes('aviator') ||
      slug === 'a04d1f3eb8ccec8a4823bdf18e3f0e84' ||
      slug.includes('stake-mines') ||
      slug.includes('stake-plinko') ||
      slug.includes('stake-crash')
    ) {
      return <SpribeOfficialEngine {...props} gameSlug={slug} />
    }

    // JILI Flagship Games
    if (slug.includes('super-ace') || slug === 'bdfb23c974a2517198c5443adeea77a8') return <SuperAce {...props} />
    if (slug.includes('fortune-gem') || slug === '664fba4da609ee82b78820b1f570f4ad') return <FortuneGems {...props} />
    if (slug.includes('money-coming') || slug === '3a557646c3abb12201c0b8810a8c0966') return <MoneyComing {...props} />

    // PG Soft Flagship Games
    if (slug.includes('mahjong') || slug === 'ba2adf72179e1ead9e3dae8f0a7d4c07' || slug === '1189baca156e1bbbecc3b26651a63565') return <MahjongWays {...props} />
    if (slug.includes('wild-bounty') || slug.includes('bounty') || slug === 'c98bb64436826fe9a2c62955ff70cba9') return <WildBounty {...props} />

    // Other Authentic WinX Originals
    if (slug.includes('baccarat')) return <BaccaratGame {...props} />
    if (slug.includes('dragon-tiger') || slug.includes('dragon')) return <DragonTigerGame {...props} />
    if (slug.includes('video-poker') || slug.includes('poker')) return <VideoPokerGame {...props} />
    if (slug.includes('fishing') || slug.includes('fish')) return <FishingJoy {...props} />
    if (slug.includes('penalty') || slug.includes('shootout')) return <PenaltyShootout {...props} />
    if (slug.includes('derby') || slug.includes('horse')) return <DerbyGame {...props} />
    if (slug.includes('cockfight') || slug.includes('rooster')) return <CockfightGame {...props} />
    if (slug.includes('sic-bo') || slug.includes('sicbo')) return <SicBoGame {...props} />
    if (slug.includes('coin-flip') || slug.includes('coinflip')) return <CoinFlip {...props} />
    if (slug.includes('wheel')) return <WheelGame {...props} />
    if (slug.includes('roulette')) return <RouletteGame {...props} />
    if (slug.includes('blackjack')) return <BlackjackGame {...props} />
    if (slug.includes('plinko')) return <PlinkoGame {...props} />
    if (slug.includes('mine')) return <MinesweeperGame {...props} />
    if (slug.includes('crash') || slug.includes('jetx')) return <CrashGame {...props} />
    if (slug.includes('limbo')) return <LimboGame {...props} />
    if (slug.includes('hilo')) return <HiloGame {...props} />
    if (slug.includes('keno')) return <KenoGame {...props} />
    if (slug.includes('dice')) return <DiceGame {...props} />
    if (slug.includes('sport') || slug.includes('nfl') || slug.includes('soccer')) return <SportsBook {...props} />

    return <ClassicSlots {...props} gameId={gameId} title={getGameTitle()} />
  }

  // Map slug to our self-hosted GitHub open-source engines in /public/games/
  const resolveOpenSourceEngineUrl = (rawSlug) => {
    const slug = String(rawSlug || '').toLowerCase().replace(/^winx-/, '')
    const initialBal = Math.round(bootBalanceRef.current ?? activeBalance)
    const baseQuery = `user_id=${encodeURIComponent(activeUser.id || activeUser.uid || 'guest_player')}&email=${encodeURIComponent(activeUser.email || '')}&demo=${isDemoMode ? 'true' : 'false'}&balance=${encodeURIComponent(initialBal)}`

    if (slug.includes('euro-roulette') || slug.includes('european-roulette')) {
      return `/games/euro-roulette/index.html?${baseQuery}&game=euro-roulette`
    }

    if (slug.includes('wheel-of-fortune') || slug.includes('fortune-wheel')) {
      return `/games/wheel-of-fortune/index.html?${baseQuery}&game=mega-fortune-wheel`
    }

    if (slug.includes('vegas-slot') || slug.includes('20-line')) {
      return `/games/vegas-slots/index.html?${baseQuery}&game=vegas-slots`
    }

    if (slug.includes('galaxy-slot') || slug.includes('star-wars') || slug.includes('space-slot')) {
      return `/games/galaxy-slots/index.html?${baseQuery}&game=galaxy-slots`
    }

    if (slug.includes('mystical') || slug.includes('forest')) {
      return `/games/mystical-slot/index.html?${baseQuery}&game=${encodeURIComponent(slug)}`
    }

    if (slug.includes('super-ace-deluxe') || slug.includes('diamond')) {
      return `/games/sibaxi-slot/index.html?${baseQuery}&game=${encodeURIComponent(slug)}`
    }

    if (slug.includes('fortune-gems-2') || slug.includes('lucky-seven')) {
      return `/games/lucky-sevens/index.html?${baseQuery}&game=${encodeURIComponent(slug)}`
    }

    if (slug.includes('classic-slots-neon') || slug.includes('lucky-reel')) {
      return `/games/phaser-slot/index.html?${baseQuery}&game=${encodeURIComponent(slug)}`
    }

    if (slug.includes('aviator') || slug.includes('spribe')) {
      return `/games/aviator-spribe/index.html?${baseQuery}&game=aviator`
    }

    if (slug.includes('crash')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=crash#/crash`
    }
    if (slug.includes('mine')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=mines#/mines`
    }
    if (slug.includes('plinko')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=plinko#/plinko`
    }
    if (slug.includes('roulette')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=roulette#/roulette`
    }
    if (slug.includes('blackjack')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=blackjack#/blackjack`
    }
    if (slug.includes('limbo')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=limbo#/limbo`
    }
    if (slug.includes('hilo')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=hilo#/hilo`
    }
    if (slug.includes('keno')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=keno#/keno`
    }
    if (slug.includes('mega-fortune-wheel') || slug.includes('twist')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=twist#/twist`
    }
    if (slug.includes('sic-bo-macau') || slug.includes('pocket-dice')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=pocket-dice#/pocket-dice`
    }
    if (slug.includes('dice') || slug.includes('coin-flip-3d')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=dice#/dice`
    }

    return `/games/nours-casino/index.html?${baseQuery}&game=plinko#/plinko`
  }

  const fetchLiveGameUrl = async (customMoney) => {
    if (!gameId) return
    setApiLoading(true)
    setApiError(null)

    // 1. SoftAggregator 11,200+ Games Official Launch (Pragmatic, JILI, PG Soft, Spribe Aviator, Hacksaw)
    try {
      const cleanUser = (activeUser.email || activeUser.displayName || 'player')
        .split('@')[0]
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 24) || 'player'

      const res = await fetch('/api/softaggregator/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameid: gameId,
          user_id: activeUser.id || activeUser.uid || cleanUser,
          email: activeUser.email || '',
          demo: isDemoMode,
          device: 'mobile'
        })
      })
      const json = await res.json()
      if (json.success && json.launch_url) {
        setLiveGameUrl(json.launch_url)
        setGameMode('api')
        setApiLoading(false)
        return
      } else if (json.details?.message && json.details.message.includes('callback URL is not set')) {
        setApiError('SoftAggregator callback URL needs to be saved in portal: https://winxpro.com.pk/sg/callback')
      }
    } catch (e) {
      console.warn('SoftAggregator launch attempt:', e)
    }

    if (String(gameId).startsWith('ftg-') || String(gameId).startsWith('ftg_')) {
      try {
        const cleanId = String(gameId).replace(/^ftg[-_]/, '')
        const res = await fetch(`/api/freetogame/game?id=${encodeURIComponent(cleanId)}`)
        const json = await res.json()
        if (json.success && json.data) {
          setFtgData(json.data)
          setLiveGameUrl(json.data.game_url)
          setApiGameName(json.data.title)
          setApiProvider(json.data.developer || json.data.publisher || 'FreeToGame')
        } else {
          setApiError('FreeToGame title is currently initializing.')
        }
      } catch (err) {
        setApiError(err.message || 'Error connecting to FreeToGame service')
      } finally {
        setApiLoading(false)
      }
      return
    }

    // Direct NexusGGR Game API Launch support
    if (String(gameId).startsWith('nexus-')) {
      try {
        const parts = String(gameId).replace(/^nexus-/, '').split('-')
        const providerCode = parts[0]?.toUpperCase() || 'PRAGMATIC'
        const gameCode = parts.slice(1).join('-') || ''
        const cleanUser = (activeUser.email || activeUser.displayName || 'player').split('@')[0].slice(0, 16)

        const res = await fetch('/api/nexus/game-launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_code: cleanUser,
            provider_code: providerCode,
            game_code: gameCode,
            lang: 'en'
          })
        })
        const json = await res.json()
        if (json.status === 1 && json.launch_url) {
          setLiveGameUrl(json.launch_url)
          setApiGameName(gameCode || `${providerCode} Game`)
          setApiProvider(providerCode)
          setGameMode('api')
          setApiLoading(false)
          return
        }
      } catch (e) {
        console.warn('Nexus launch fallback:', e)
      }
    }

    const cleanSlug = String(gameId).toLowerCase().replace(/^winx-/, '')
    if (
      String(gameId).toLowerCase().startsWith('winx-') ||
      isWinXThemeReactSlug(gameId) ||
      ! (/^[a-f0-9]{32}$/i.test(String(gameId)))
    ) {
      setGameMode('canvas')
      setApiLoading(false)
      return
    }

    try {
      const cleanUser = (activeUser.email || activeUser.displayName || 'player')
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 16) || 'player'

      const sessionCredits = customMoney || (isDemoMode ? 10000 : Math.max(activeBalance, 5000))

      const res = await fetch('/api/rapid/getGameUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameId,
          username: cleanUser,
          money: sessionCredits,
          currency: 'PKR',
          lang: 'en'
        })
      })

      const json = await res.json()
      if (json.success && json.gameUrl && json.gameUrl.startsWith('http')) {
        setLiveGameUrl(json.gameUrl)
        setApiGameName(json.gameName || null)
        setApiProvider(json.provider || null)
      } else {
        setGameMode('canvas')
      }
    } catch (err) {
      setGameMode('canvas')
    } finally {
      setApiLoading(false)
    }
  }

  useEffect(() => {
    if (gameId) {
      bootBalanceRef.current = activeBalance
      fetchLiveGameUrl()
    }
  }, [gameId, isDemoMode, user])

  const reloadStream = (extraFunds) => {
    bootBalanceRef.current = activeBalance
    setIframeReloadKey((prev) => prev + 1)
    fetchLiveGameUrl(extraFunds)
  }

  const toggleFullscreen = () => {
    const elem = document.documentElement
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const getGameTitle = () => {
    if (apiGameName && apiGameName.length < 30) return apiGameName
    if (!gameId) return 'Live Casino Game'

    const hexTitles = {
      'e30cd08c54817096e863975e309bb457': 'Gates of Olympus',
      '8a0b30eb466a8a07027cbddc19369d0f': 'Sweet Bonanza',
      '259ad8e105ef217dad404bffe0fff257': 'Mahjong Wins',
      'ba3dc54ad1f451262910dda6c61001ce': 'Aztec Gems',
      '3a557646c3abb12201c0b8810a8c0966': 'Money Coming',
      'c98bb64436826fe9a2c62955ff70cba9': 'Wild Bounty Showdown',
      'ba2adf72179e1ead9e3dae8f0a7d4c07': 'Mahjong Ways 2',
      '1189baca156e1bbbecc3b26651a63565': 'Mahjong Ways',
      'bdfb23c974a2517198c5443adeea77a8': 'Super Ace',
      '664fba4da609ee82b78820b1f570f4ad': 'Fortune Gems 500x',
      'a04d1f3eb8ccec8a4823bdf18e3f0e84': 'Spribe Aviator',
      '981f5f9675002fbeaaf24c4128b938d7': 'Boxing King',
      '8c62471fd4e28c084a61811a3958f7a1': 'Crazy 777'
    }
    if (hexTitles[gameId]) return hexTitles[gameId]
    if (gameId.length === 32) return 'Live Casino Slot'

    const words = String(gameId).replace(/^winx-theme-/, '').replace(/^winx-/, '').replace(/[-_]/g, ' ').split(' ')
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const renderOpenSourceEngine = () => {
    if (isWinXThemeReactSlug(gameId)) {
      return (
        <div style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', background: '#070a14' }}>
          {renderWinXThemeReactEngine()}
        </div>
      )
    }
    const engineSrc = resolveOpenSourceEngineUrl(gameId)
    return (
      <iframe
        ref={iframeRef}
        key={`${gameId}-${isDemoMode}-${iframeReloadKey}`}
        src={engineSrc}
        onLoad={() => pushInitToIframe(activeBalance)}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          background: '#070a14'
        }}
        allow="autoplay; fullscreen; clipboard-read; clipboard-write"
        title={getGameTitle()}
      />
    )
  }

  const renderFtgStage = () => {
    if (!ftgData) return null
    const isBrowserGame = (ftgData.platform || '').toLowerCase().includes('browser')

    if (isBrowserGame && !showFtgDetails) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <iframe
              src={liveGameUrl}
              style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
              allow="autoplay; fullscreen; payment; microphone; camera; geolocation; clipboard-read; clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-orientation-lock allow-pointer-lock allow-presentation"
              title={ftgData.title}
            />
          </div>
        </div>
      )
    }

    return (
      <div style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #0b101b 0%, #06090e 100%)',
        color: '#fff',
        padding: '16px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '16px',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
        }}>
          <img
            src={ftgData.thumbnail || ftgData.imageUrl}
            alt={ftgData.title}
            style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(0deg, rgba(6,9,14,0.98) 0%, rgba(6,9,14,0.7) 60%, transparent 100%)',
            padding: '20px 16px 14px'
          }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#fff' }}>{ftgData.title}</h1>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="winx-game-stage-shell" style={{ width: '100%', maxWidth: '480px', height: '100dvh', margin: '0 auto', background: '#070b14', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎰</div>
          <div style={{ color: '#34d399', fontWeight: 700 }}>Loading WinX Game Engine...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="winx-game-stage-shell" style={{ width: '100%', maxWidth: '480px', height: '100dvh', margin: '0 auto', background: '#070a14', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Unified Single WINX Dark-Emerald Top Header Across All Games (480px Mobile Frame) */}
      <header style={{ 
        height: '52px',
        padding: '0 10px', 
        background: 'linear-gradient(180deg, #0b1322 0%, #070d18 100%)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid rgba(16, 185, 129, 0.22)',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.55)',
        zIndex: 50,
        gap: '6px',
        flexShrink: 0
      }}>
        {/* Left: Back to Lobby + WINX Brand + Active Game Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <button 
              type="button"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#e2e8f0',
                padding: '6px 9px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>⬅</span>
              <span>Lobby</span>
            </button>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              fontWeight: '900',
              fontSize: '15px',
              flexShrink: 0
            }}>
              W
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '0.08em',
                color: '#f8fafc',
                lineHeight: 1.1
              }}>
                WINX
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                letterSpacing: '0.04em',
                color: '#10b981',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
                maxWidth: '110px'
              }}>
                {getGameTitle()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Unified PKR WALLET Box + Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <div 
            onClick={() => toggleDemoMode(!isDemoMode)}
            style={{ 
              background: 'rgba(13, 22, 38, 0.95)', 
              border: `1px solid ${isDemoMode ? 'rgba(56, 189, 248, 0.45)' : 'rgba(16, 185, 129, 0.45)'}`, 
              padding: '4px 8px', 
              borderRadius: '10px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
            title="Click to switch between Real PKR Wallet and Demo Wallet"
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '0.06em', color: '#94a3b8', textTransform: 'uppercase', lineHeight: 1 }}>
                {isDemoMode ? 'DEMO WALLET' : 'PKR WALLET'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '900', color: '#f8fafc', lineHeight: 1.2, fontFamily: 'monospace, sans-serif' }}>
                Rs {activeBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span style={{
              padding: '2px 5px',
              borderRadius: '5px',
              fontSize: '9px',
              fontWeight: '900',
              letterSpacing: '0.04em',
              background: isDemoMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(16, 185, 129, 0.2)',
              color: isDemoMode ? '#38bdf8' : '#34d399',
              border: `1px solid ${isDemoMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
            }}>
              {isDemoMode ? 'DEMO' : 'REAL'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchWallet()
              reloadStream()
            }}
            style={{
              width: '30px',
              height: '30px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Sync Wallet & Reload Game"
          >
            🔄
          </button>

          <button 
            type="button"
            onClick={toggleFullscreen}
            style={{
              width: '30px',
              height: '30px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
        </div>
      </header>

      {/* Main Embedded Game Stage Inside 480px Mobile Frame */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100dvh - 52px)', background: '#070a14', overflow: 'hidden' }}>
        {ftgData ? renderFtgStage() : gameMode === 'api' && liveGameUrl ? (
          <iframe 
            src={liveGameUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
              background: '#000'
            }}
            allow="autoplay; fullscreen; payment; microphone; camera; geolocation; clipboard-read; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-orientation-lock allow-pointer-lock allow-presentation allow-popups-to-escape-sandbox"
            title={getGameTitle()}
          />
        ) : (
          renderOpenSourceEngine()
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
