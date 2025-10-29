import { useEffect } from 'react'

/**
 * Full-screen loading overlay for receipt export/download.
 * Blocks interaction and shows animated spinner until export completes.
 * Uses semi-transparent background so users can see the page content.
 */
export default function ReceiptLoadingOverlay({ show }: { show: boolean }) {
  useEffect(() => {
    // Prevent scrolling when overlay is shown
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [show])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center bg-white/10 rounded-xl shadow-2xl p-8 border border-amber-400">
        <div className="mb-6">
          <svg className="animate-spin" width="64" height="64" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#f08c17" strokeWidth="4" opacity="0.2" />
            <path fill="#f08c17" d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-amber-500 mb-2 drop-shadow">Generating Receipt...</h2>
        <p className="text-base text-white/90 mb-2 text-center">Please wait while we generate your order receipt.</p>
        <div className="w-full h-2 rounded-full bg-amber-100 mt-6 animate-pulse">
          <div className="h-2 rounded-full bg-amber-500 w-1/2 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
