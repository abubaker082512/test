import { useEffect } from 'react'
import { useRouter } from 'next/router'
import WalletPage from './wallet'

export default function RecordsPage() {
  const router = useRouter()

  useEffect(() => {
    // Ensure tab=records is set in query
    if (router.isReady && router.query.tab !== 'records') {
      router.replace('/wallet?tab=records', undefined, { shallow: true })
    }
  }, [router.isReady, router.query])

  return <WalletPage />
}
