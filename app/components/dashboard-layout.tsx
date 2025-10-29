'use client'

import { useAuth } from '@/app/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from './sidebar'
import MobileMenu from './mobile-menu'
import NotificationBell from './notification-bell'
import Image from 'next/image'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: string
}

export default function DashboardLayout({ children, userRole: _userRole }: DashboardLayoutProps) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/welcome')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-black">
      <Sidebar />
      <div className="md:pl-64 flex flex-col flex-1">
        <nav className="bg-black dark:bg-[#18181b] shadow-sm border-b dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <MobileMenu />
                <div className="flex-shrink-0 flex items-center ml-4">
                  <div className="h-8 w-8 bg-black dark:bg-[#18181b] rounded-lg flex items-center justify-center">
                    <Image 
                      width={100}
                      height={100}
                      src="https://sjfulfillment.com/wp-content/uploads/2020/09/cropped-Main-Logo-white-886x.png"
                      alt="SJF Logo"
                      className="h-10 w-10 hidden max-md:flex object-contain"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <span className="hidden sm:block text-sm text-white dark:text-gray-200">
                  Welcome, {user.firstName} {user.lastName}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                  {user.role.replace('_', ' ')}
                </span>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 px-3 py-2 rounded-[5px] text-sm font-medium"
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
        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogoutModal(false)}></div>
            <div className="relative bg-white rounded-[8px] shadow-xl w-full max-w-sm mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Logout</h3>
              <p className="text-gray-700 mb-6">Are you sure you want to logout?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 rounded-[6px] border border-gray-300 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowLogoutModal(false); logout(); }}
                  className="px-4 py-2 rounded-[6px] bg-[#f08c17] hover:bg-orange-500 text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
