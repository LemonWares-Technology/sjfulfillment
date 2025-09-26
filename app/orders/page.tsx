'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import { EyeIcon, TruckIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import SearchBar from '@/app/components/search-bar'
import FilterSelect from '@/app/components/filter-select'
import ServiceGate from '@/app/components/service-gate'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  totalAmount: number
  status: string
  createdAt: string
  merchant: {
    businessName: string
  }
  orderItems: {
    id: string
    quantity: number
    product: {
      name: string
      sku: string
    }
  }[]
}

export default function OrdersPage() {
  const { user } = useAuth()
  const { get, loading } = useApi()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await get<Order[]>('/api/orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800'
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.merchant?.businessName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  const handleProcessOrder = (orderId: string) => {
    // Navigate to order processing page or open processing modal
    router.push(`/orders/${orderId}/process`)
  }

  return (
    <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="mt-2 text-gray-600">
                Manage and track all orders
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search orders by number, customer, or merchant..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <div className="sm:w-48">
              <FilterSelect
                options={[
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'CONFIRMED', label: 'Confirmed' },
                  { value: 'PROCESSING', label: 'Processing' },
                  { value: 'SHIPPED', label: 'Shipped' },
                  { value: 'DELIVERED', label: 'Delivered' },
                  { value: 'CANCELLED', label: 'Cancelled' }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                          {user?.role === 'SJFS_ADMIN' && (
                            <div className="text-sm text-gray-500">
                              {order.merchant.businessName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.orderItems.length} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewOrder(order.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Order Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {order.status === 'CONFIRMED' && (
                            <ServiceGate serviceName="Order Processing">
                              <button 
                                onClick={() => handleProcessOrder(order.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Process Order"
                              >
                                <TruckIcon className="h-4 w-4" />
                              </button>
                            </ServiceGate>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
