'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import PaymentGate from '@/app/components/payment-gate'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import { useRouter } from 'next/navigation'
import { getMerchantServices } from '@/app/lib/service-access'

interface MerchantService {
  id: string
  serviceId: string
  quantity: number
  priceAtSubscription: number
  status: string
  service: {
    id: string
    name: string
    description: string
    category: string
    features: string[]
  }
}

interface MerchantStats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  activeSubscriptions: number
  pendingOrders: number
  lowStockItems: number
  recentOrders: any[]
}

export default function MerchantDashboard() {
  const { user } = useAuth()
  const { get, loading } = useApi()
  const router = useRouter()
  const [stats, setStats] = useState<MerchantStats | null>(null)
  const [merchantServices, setMerchantServices] = useState<MerchantService[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dashboard stats
        const statsData = await get<MerchantStats>('/api/dashboard/stats')
        setStats(statsData)

        // Fetch merchant services
        if (user?.merchantId) {
          const services = await getMerchantServices(user.merchantId)
          setMerchantServices(services)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setStats(null)
        setMerchantServices([])
      }
    }

    fetchData()
  }, [user?.merchantId])

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-product':
        router.push('/products')
        break
      case 'manage-stock':
        router.push('/inventory')
        break
      case 'view-orders':
        router.push('/orders')
        break
      case 'manage-staff':
        router.push('/merchant/staff')
        break
      case 'manage-account':
        router.push('/merchant/account')
        break
      default:
        break
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole="MERCHANT_ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <PaymentGate userRole="MERCHANT_ADMIN">
      <DashboardLayout userRole="MERCHANT_ADMIN">
        <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.firstName}! Here's your business overview.
          </p>
          {user?.merchant && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Business:</strong> {user.merchant.businessName}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Status:</strong> {user.merchant.onboardingStatus}
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">P</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Products
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalProducts || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">O</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalOrders || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">₦</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(stats?.totalRevenue || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">!</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Low Stock Items
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.lowStockItems || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscribed Services */}
        {merchantServices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Subscribed Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {merchantServices.map((service) => (
                <div key={service.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{service.service.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{service.service.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Qty: {service.quantity}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(service.priceAtSubscription)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                onClick={() => handleQuickAction('add-product')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
              >
                <div className="text-center">
                  <div className="text-green-600 text-2xl mb-2">+</div>
                  <div className="text-sm font-medium text-gray-900">Add Product</div>
                </div>
              </button>
              <button 
                onClick={() => handleQuickAction('manage-stock')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <div className="text-center">
                  <div className="text-blue-600 text-2xl mb-2">📦</div>
                  <div className="text-sm font-medium text-gray-900">Manage Stock</div>
                </div>
              </button>
              <button 
                onClick={() => handleQuickAction('view-orders')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors cursor-pointer"
              >
                <div className="text-center">
                  <div className="text-yellow-600 text-2xl mb-2">📋</div>
                  <div className="text-sm font-medium text-gray-900">View Orders</div>
                </div>
              </button>
              <button 
                onClick={() => handleQuickAction('manage-staff')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <div className="text-center">
                  <div className="text-purple-600 text-2xl mb-2">👥</div>
                  <div className="text-sm font-medium text-gray-900">Manage Staff</div>
                </div>
              </button>
              <button 
                onClick={() => handleQuickAction('manage-account')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <div className="text-center">
                  <div className="text-indigo-600 text-2xl mb-2">⚙️</div>
                  <div className="text-sm font-medium text-gray-900">Account Settings</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {stats?.recentOrders?.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.customerName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-4">
                  No recent orders
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </PaymentGate>
  )
}
