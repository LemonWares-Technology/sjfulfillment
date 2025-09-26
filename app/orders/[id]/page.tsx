'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import { 
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  TruckIcon,
  CubeIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import ServiceGate from '@/app/components/service-gate'

interface OrderItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    sku: string
    images: string[]
    unitPrice: number
  }
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: any
  totalAmount: number
  deliveryFee: number
  status: string
  trackingNumber?: string
  expectedDelivery?: string
  deliveredAt?: string
  createdAt: string
  merchant: {
    businessName: string
  }
  orderItems: OrderItem[]
  statusHistory: {
    status: string
    timestamp: string
    notes?: string
  }[]
}

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckIcon },
  { value: 'PROCESSING', label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: CubeIcon },
  { value: 'PICKED', label: 'Picked', color: 'bg-indigo-100 text-indigo-800', icon: CubeIcon },
  { value: 'PACKED', label: 'Packed', color: 'bg-orange-100 text-orange-800', icon: CubeIcon },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-cyan-100 text-cyan-800', icon: TruckIcon },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'bg-pink-100 text-pink-800', icon: TruckIcon },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckIcon },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XMarkIcon }
]

export default function OrderDetailsPage() {
  const { user } = useAuth()
  const { get, loading } = useApi()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const data = await get<Order>(`/api/orders/${orderId}`)
      setOrder(data)
    } catch (error) {
      console.error('Failed to fetch order:', error)
      router.push('/orders')
    }
  }

  const getStatusInfo = (status: string) => {
    return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0]
  }

  const canProcessOrder = () => {
    return user?.role === 'MERCHANT_ADMIN' || user?.role === 'MERCHANT_STAFF' || user?.role === 'WAREHOUSE_STAFF'
  }

  if (!order) {
    return (
      <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const statusInfo = getStatusInfo(order.status)

  return (
    <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/orders')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                <p className="mt-2 text-gray-600">
                  Order #{order.orderNumber} - {order.customerName}
                </p>
              </div>
            </div>
            {canProcessOrder() && (
              <ServiceGate serviceName="Order Processing">
                <button
                  onClick={() => router.push(`/orders/${orderId}/process`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
                >
                  <TruckIcon className="h-4 w-4" />
                  <span>Process Order</span>
                </button>
              </ServiceGate>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Overview */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Order Status</h2>
                <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.color}`}>
                  <statusInfo.icon className="h-4 w-4 mr-2" />
                  {statusInfo.label}
                </span>
              </div>
              
              {order.trackingNumber && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{order.trackingNumber}</p>
                </div>
              )}

              {order.expectedDelivery && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order.expectedDelivery)}</p>
                </div>
              )}

              {order.deliveredAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivered At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order.deliveredAt)}</p>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {order.customerEmail}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {order.customerPhone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Merchant</label>
                  <p className="mt-1 text-sm text-gray-900">{order.merchant.businessName}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="text-sm text-gray-900">
                  {order.shippingAddress && (
                    <div>
                      <p className="font-medium">{order.shippingAddress.street}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                      <p>{order.shippingAddress.country} {order.shippingAddress.postalCode}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    {item.product.images && item.product.images.length > 0 && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-16 w-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      <p className="text-sm text-gray-500">Unit Price: {formatCurrency(item.product.unitPrice)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">
                        Qty: {item.quantity}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.product.unitPrice * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status History</h2>
              <div className="space-y-4">
                {order.statusHistory.map((history, index) => {
                  const historyStatusInfo = getStatusInfo(history.status)
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          index === order.statusHistory.length - 1 ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <historyStatusInfo.icon className={`h-4 w-4 ${
                            index === order.statusHistory.length - 1 ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">{historyStatusInfo.label}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${historyStatusInfo.color}`}>
                            {history.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(history.timestamp)}</p>
                        {history.notes && (
                          <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">{formatCurrency(order.totalAmount - order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-medium text-lg">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Number</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{order.orderNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="mt-1 text-sm text-gray-900">Cash on Delivery (COD)</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {canProcessOrder() && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/orders/${orderId}/process`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <TruckIcon className="h-4 w-4" />
                    <span>Process Order</span>
                  </button>
                  
                  {order.trackingNumber && (
                    <button
                      onClick={() => {
                        // Copy tracking number to clipboard
                        navigator.clipboard.writeText(order.trackingNumber!)
                        toast.success('Tracking number copied to clipboard')
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      Copy Tracking Number
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

