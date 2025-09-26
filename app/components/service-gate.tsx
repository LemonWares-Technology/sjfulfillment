'use client'

import { useAuth } from '@/app/lib/auth-context'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

interface ServiceGateProps {
  serviceName: string
  children: React.ReactNode
  fallbackMessage?: string
  className?: string
}

interface MerchantService {
  id: string
  service: {
    name: string
    description: string
  }
  isActive: boolean
}

export default function ServiceGate({ 
  serviceName, 
  children, 
  fallbackMessage,
  className = ""
}: ServiceGateProps) {
  const { user } = useAuth()
  const { get } = useApi()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkServiceAccess = async () => {
      if (!user || user.role === 'SJFS_ADMIN') {
        // SJFS_ADMIN has access to everything
        setHasAccess(true)
        setLoading(false)
        return
      }

      try {
        const response = await get<{subscriptions: MerchantService[]}>('/api/merchant-services/status')
        const subscriptions = response?.subscriptions || []
        
        const hasServiceAccess = subscriptions.some(
          sub => sub.service.name === serviceName && sub.isActive
        )
        
        setHasAccess(hasServiceAccess)
      } catch (error) {
        console.error('Failed to check service access:', error)
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkServiceAccess()
  }, [user, serviceName, get])

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  }

  const defaultMessage = `This feature requires the "${serviceName}" service. Please subscribe to this service to access this functionality.`
  const message = fallbackMessage || defaultMessage

  return (
    <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
      <InformationCircleIcon className="h-5 w-5" />
      <span className="text-sm" title={message}>
        {message}
      </span>
    </div>
  )
}
