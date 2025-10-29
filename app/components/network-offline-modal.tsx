"use client";

import { useEffect, useState } from 'react'

/**
 * Full-screen modal overlay that blocks all interaction when offline.
 * Only disappears when network is restored.
 */
export default function NetworkOfflineModal() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Handler for online/offline events
    const updateStatus = () => {
      setIsOffline(!navigator.onLine)
    }
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    // Initial check
    updateStatus()
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  if (!isOffline) return null

  // Full-screen overlay modal with improved styling
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-2xl p-8 flex flex-col items-center max-w-md w-full border border-amber-400">
        <div className="mb-6">
          <svg width="72" height="72" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#f08c17" opacity="0.15" />
            <path fill="#f08c17" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-amber-500 mb-3 drop-shadow">No Internet Connection</h2>
        <p className="text-lg text-white/90 mb-6 text-center">
          You are currently offline.<br />
          Please check your network connection.<br />
          This screen will disappear automatically when you are back online.
        </p>
        <div className="text-base text-amber-300 font-semibold mb-2">
          <span className="inline-block mr-2">💡</span>Tip: Try reconnecting to Wi-Fi or enabling mobile data.
        </div>
        <div className="w-full h-2 rounded-full bg-amber-100 mt-6 animate-pulse">
          <div className="h-2 rounded-full bg-amber-500 w-1/2 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
