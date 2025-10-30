'use client'

import { useAuth } from '@/app/lib/auth-context'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LockClosedIcon } from '@heroicons/react/24/outline'

/**
 * ServiceGate Component
 * 
 * Restricts access to features based on merchant's service subscriptions.
 * 
 * Display Modes:
 * - inline (default): Shows a compact red "Subscribe to {service}" button 
 *   in place of the gated content. Best for replacing individual buttons/actions.
 * - block: Shows a full modal-like card with explanation. Best for blocking 
 *   entire sections or pages.
 * 
 * Access Control:
 * - SJFS_ADMIN: Always has access to everything
 * - WAREHOUSE_STAFF: Has access to specific services without subscription
 * - MERCHANT_ADMIN/MERCHANT_STAFF: Requires active service subscription
 * 
 * Navigation:
 * When users click the subscribe button, they're redirected to:
 * /merchant/plans?service={serviceName}
 * 
 * This allows the plans page to automatically scroll to and highlight
 * the specific service they need to subscribe to.
 * 
 * @param serviceName - The name of the service to check (e.g., "Staff Management")
 * @param children - The content to show when user has access
 * @param mode - 'inline' for button replacement, 'block' for full card display
 * @param fallbackMessage - Custom message for block mode
 * @param className - Additional CSS classes
 * @param showIconOnly - Legacy prop, kept for backwards compatibility
 */

interface ServiceGateProps {
  serviceName: string
  children: React.ReactNode
  fallbackMessage?: string
  className?: string
  showIconOnly?: boolean
  mode?: 'inline' | 'block' // New prop to control display mode
}

interface MerchantService {
  id: string
  service: {
    name: string
    description: string
  }
  isActive: boolean
}

// Simple in-memory cache to speed up repeated checks within a short window
const SUBSCRIPTION_TTL_MS = 60_000 // 1 minute
type CacheEntry = { at: number; subscriptions: MerchantService[] }
const subscriptionCache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<MerchantService[]>>()

function getCachedSubscriptions(merchantId: string): MerchantService[] | null {
  const entry = subscriptionCache.get(merchantId)
  if (!entry) return null
  if (Date.now() - entry.at > SUBSCRIPTION_TTL_MS) {
    subscriptionCache.delete(merchantId)
    return null
  }
  return entry.subscriptions
}

async function fetchSubscriptions(get: <T>(url: string, options?: any) => Promise<T>, merchantId: string): Promise<MerchantService[]> {
  if (inFlight.has(merchantId)) return inFlight.get(merchantId) as Promise<MerchantService[]>
  const p = (async () => {
    try {
      const response = await get<{ subscriptions: MerchantService[] }>('/api/merchant-services/status', { silent: true })
      const subs = response?.subscriptions || []
      subscriptionCache.set(merchantId, { at: Date.now(), subscriptions: subs })
      inFlight.delete(merchantId)
      return subs
    } catch (error) {
      // Remove from in-flight on error so retries are possible
      inFlight.delete(merchantId)
      console.error('Error fetching subscriptions:', error)
      return [] // Return empty array on error instead of throwing
    }
  })()
  inFlight.set(merchantId, p)
  return p
}

export default function ServiceGate({ 
  serviceName, 
  children, 
  fallbackMessage,
  className = "",
  showIconOnly = true,
  mode = 'inline' // Default to inline mode
}: ServiceGateProps) {
  const { user } = useAuth()
  const { get } = useApi()
  const router = useRouter()
  // Use null initially to prevent flickering, then set to true/false once we know
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const checkServiceAccess = async () => {
      if (!user) {
        setHasAccess(false)
        setIsChecking(false)
        return;
      }
      if (user.role === 'SJFS_ADMIN') {
        setHasAccess(true)
        setIsChecking(false)
        return;
      }
      if (user.role === 'WAREHOUSE_STAFF') {
        const warehouseStaffServices = [
          'Order Processing',
          'Inventory Management',
          'Warehouse Management',
          'Stock Management'
        ];
        if (warehouseStaffServices.includes(serviceName)) {
          setHasAccess(true)
          setIsChecking(false)
          return;
        }
      }
      if (!user.merchantId) {
        setHasAccess(false)
        setIsChecking(false)
        return;
      }
      try {
        const cached = getCachedSubscriptions(user.merchantId);
        if (cached) {
          const hasServiceAccess = cached.some(sub => sub.service.name === serviceName && sub.isActive);
          setHasAccess(hasServiceAccess);
          setIsChecking(false);
          return;
        }
        const subs = await fetchSubscriptions(get, user.merchantId);
        const hasServiceAccess = subs.some(sub => sub.service.name === serviceName && sub.isActive);
        setHasAccess(hasServiceAccess);
        setIsChecking(false);
      } catch (error) {
        console.error('Failed to check service access:', error);
        setHasAccess(false);
        setIsChecking(false);
      }
    };
    checkServiceAccess();
    timer = setTimeout(() => setShowLoading(false), 2000);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, serviceName, get]);

  // Show loading modal for 2 seconds, then show button/content
  if (isChecking || showLoading) {
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
              <path fill="#f08c17" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-amber-500 mb-3 drop-shadow">Checking Service Access...</h2>
          <p className="text-lg text-white/90 mb-6 text-center">
            Please wait while we check your subscription status.<br />
            This screen will disappear automatically when access is determined.
          </p>
          <div className="w-full h-2 rounded-full bg-amber-100 mt-6 animate-pulse">
            <div className="h-2 rounded-full bg-amber-500 w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show content if user has access
  if (hasAccess) {
    return <>{children}</>
  }

  const handleSubscribe = () => {
    /**
     * Navigate to merchant plans page with the service name as a query parameter
     * This allows the plans page to:
     * 1. Automatically scroll to the requested service
     * 2. Highlight it with a pulsing animation
     * 3. Make it easy for users to subscribe to the specific service they need
     */
    router.push(`/merchant/plans?service=${encodeURIComponent(serviceName)}`)
  }

  // Inline mode: Show a compact red button in place of the wrapped content
  if (mode === 'inline') {
    return (
      <button
        onClick={handleSubscribe}
        className={`bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-[5px] transition-colors duration-200 flex items-center shadow-md ${className}`}
      >
        <LockClosedIcon className="h-5 w-5 mr-2" />
        Subscribe to {serviceName}
      </button>
    )
  }

  // Block mode: Show the full modal-like display (original behavior)
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <LockClosedIcon className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Subscription Required
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {fallbackMessage || `Subscribe to "${serviceName}" to access this feature`}
        </p>
        <button
          onClick={handleSubscribe}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-[5px] transition-colors duration-200 flex items-center justify-center"
        >
          <LockClosedIcon className="h-5 w-5 mr-2" />
          Subscribe to {serviceName}
        </button>
      </div>
    </div>
  )
}
