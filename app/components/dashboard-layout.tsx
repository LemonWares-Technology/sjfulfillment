'use client'

import { useAuth } from '@/app/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from './sidebar'
import MobileMenu from './mobile-menu'
import NotificationBell from './notification-bell'
import ConnectionStatus from './connection-status'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: string
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== userRole) {
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'SJFS_ADMIN':
          router.push('/admin/dashboard')
          break
        case 'MERCHANT_ADMIN':
          router.push('/merchant/dashboard')
          break
        case 'MERCHANT_STAFF':
          router.push('/staff/dashboard')
          break
        case 'WAREHOUSE_STAFF':
          router.push('/warehouse/dashboard')
          break
      }
    }
  }, [user, userRole, router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="md:pl-64 flex flex-col flex-1">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <MobileMenu />
                <div className="flex-shrink-0 flex items-center ml-4">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SJF</span>
                  </div>
                  <span className="ml-2 text-xl font-semibold text-gray-900">
                    SJFulfillment
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <ConnectionStatus />
                <NotificationBell />
                <span className="hidden sm:block text-sm text-gray-700">
                  Welcome, {user.firstName} {user.lastName}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user.role.replace('_', ' ')}
                </span>
                <button
                  onClick={logout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
