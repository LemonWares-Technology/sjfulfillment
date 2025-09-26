'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import ServiceGate from '@/app/components/service-gate'

interface AnalyticsData {
  overview: {
    totalOrders: number
    totalRevenue: number
    totalProducts: number
    totalCustomers: number
    orderGrowth: number
    revenueGrowth: number
  }
  orders: {
    daily: { date: string; count: number; revenue: number }[]
    monthly: { month: string; count: number; revenue: number }[]
    statusDistribution: { status: string; count: number }[]
  }
  products: {
    topSelling: { name: string; sku: string; quantity: number; revenue: number }[]
    lowStock: { name: string; sku: string; currentStock: number; minStock: number }[]
    categories: { category: string; count: number; revenue: number }[]
  }
  customers: {
    newCustomers: { date: string; count: number }[]
    topCustomers: { name: string; email: string; orderCount: number; totalSpent: number }[]
  }
  revenue: {
    daily: { date: string; amount: number }[]
    monthly: { month: string; amount: number }[]
    byPaymentMethod: { method: string; amount: number; count: number }[]
  }
}

interface DateRange {
  start: string
  end: string
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { get } = useApi()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end
      })
      const data = await get<AnalyticsData>(`/api/analytics?${params}`)
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
        format
      })
      const response = await fetch(`/api/analytics/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-report-${dateRange.start}-to-${dateRange.end}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  const StatCard = ({ title, value, change, changeType, icon: Icon }: {
    title: string
    value: string | number
    change?: number
    changeType?: 'increase' | 'decrease'
    icon: React.ComponentType<{ className?: string }>
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {changeType === 'increase' ? (
                      <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                    )}
                    <span className="sr-only">{changeType === 'increase' ? 'Increased' : 'Decreased'} by</span>
                    {Math.abs(change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'orders', name: 'Orders', icon: ChartBarIcon },
    { id: 'products', name: 'Products', icon: ChartBarIcon },
    { id: 'customers', name: 'Customers', icon: ChartBarIcon },
    { id: 'revenue', name: 'Revenue', icon: ChartBarIcon }
  ]

  if (loading) {
    return (
      <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!analytics) {
    return (
      <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <ChartBarIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-600">No analytics data available for the selected date range.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="mt-2 text-gray-600">
                Comprehensive business insights and performance metrics
              </p>
            </div>
            <div className="flex space-x-3">
              <ServiceGate serviceName="Analytics Dashboard">
                <button
                  onClick={() => exportReport('excel')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export Excel
                </button>
              </ServiceGate>
              <ServiceGate serviceName="Analytics Dashboard">
                <button
                  onClick={() => exportReport('pdf')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export PDF
                </button>
              </ServiceGate>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Orders"
                value={analytics.overview.totalOrders.toLocaleString()}
                change={analytics.overview.orderGrowth}
                changeType={analytics.overview.orderGrowth >= 0 ? 'increase' : 'decrease'}
                icon={ChartBarIcon}
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(analytics.overview.totalRevenue)}
                change={analytics.overview.revenueGrowth}
                changeType={analytics.overview.revenueGrowth >= 0 ? 'increase' : 'decrease'}
                icon={ArrowTrendingUpIcon}
              />
              <StatCard
                title="Total Products"
                value={analytics.overview.totalProducts.toLocaleString()}
                icon={ChartBarIcon}
              />
              <StatCard
                title="Total Customers"
                value={analytics.overview.totalCustomers.toLocaleString()}
                icon={ChartBarIcon}
              />
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Trends</h3>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Chart visualization would go here</p>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Chart visualization would go here</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {selectedTab === 'orders' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Status Distribution */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Distribution</h3>
                <div className="space-y-3">
                  {analytics.orders.statusDistribution.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{status.status}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(status.count / analytics.orders.statusDistribution.reduce((sum, s) => sum + s.count, 0)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{status.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Order Trends</h3>
                <div className="space-y-2">
                  {analytics.orders.daily.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-900">{day.count} orders</span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(day.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {selectedTab === 'products' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Products */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Products</h3>
                <div className="space-y-3">
                  {analytics.products.topSelling.slice(0, 5).map((product, index) => (
                    <div key={product.sku} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{product.quantity} sold</p>
                        <p className="text-xs text-gray-500">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Low Stock Alert</h3>
                <div className="space-y-3">
                  {analytics.products.lowStock.slice(0, 5).map((product) => (
                    <div key={product.sku} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">{product.currentStock} left</p>
                        <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {selectedTab === 'customers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Customers */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers</h3>
                <div className="space-y-3">
                  {analytics.customers.topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.email} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{customer.orderCount} orders</p>
                        <p className="text-xs text-gray-500">{formatCurrency(customer.totalSpent)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Customers */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">New Customer Trends</h3>
                <div className="space-y-2">
                  {analytics.customers.newCustomers.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                      <span className="text-sm font-medium text-gray-900">{day.count} new customers</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {selectedTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Payment Method */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Payment Method</h3>
                <div className="space-y-3">
                  {analytics.revenue.byPaymentMethod.map((method) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{method.method}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(method.amount / analytics.revenue.byPaymentMethod.reduce((sum, m) => sum + m.amount, 0)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-20">{formatCurrency(method.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Revenue */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Revenue Trends</h3>
                <div className="space-y-2">
                  {analytics.revenue.daily.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(day.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

