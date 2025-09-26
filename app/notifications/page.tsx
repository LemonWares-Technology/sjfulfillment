'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useNotifications } from '@/app/lib/notification-context'
import { formatDateTime } from '@/app/lib/utils'
import { BellIcon, CheckIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function NotificationsPage() {
  const { user } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ORDER': return 'bg-blue-100 text-blue-800'
      case 'STOCK': return 'bg-yellow-100 text-yellow-800'
      case 'PAYMENT': return 'bg-green-100 text-green-800'
      case 'LOGISTICS': return 'bg-purple-100 text-purple-800'
      case 'WAREHOUSE': return 'bg-orange-100 text-orange-800'
      case 'SYSTEM': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return '📦'
      case 'STOCK': return '📊'
      case 'PAYMENT': return '💰'
      case 'LOGISTICS': return '🚚'
      case 'WAREHOUSE': return '🏭'
      case 'SYSTEM': return '⚙️'
      default: return '🔔'
    }
  }

  return (
    <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-2 text-gray-600">
                Stay updated with important alerts and updates
              </p>
            </div>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Mark All as Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white shadow rounded-lg p-6 ${
                !notification.isRead ? 'border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg">{getTypeIcon(notification.type)}</span>
                    <h3 className={`text-lg font-medium ${
                      !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                      {notification.type}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                  }`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Mark as read"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Remove notification"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              You're all caught up! We'll notify you when there's something new.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
