'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import { useCurrency } from '@/app/lib/currency-context';
// Import useContext or pass selectedCurrency as prop if using context/provider
import { EyeIcon, TruckIcon, PlusIcon, DocumentArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import ExportModal from '@/app/components/export-modal';
import { useRouter } from 'next/navigation'
import SearchBar from '@/app/components/search-bar'
import FilterSelect from '@/app/components/filter-select'
import ServiceGate from '@/app/components/service-gate'
import ServiceGateGroup from '@/app/components/service-gate-group'
import OrderModal from '@/app/components/order-modal'
import CustomerCallButton from '@/app/components/customer-call-button'
import BulkOrderUpload from '@/app/components/bulk-order-upload'
import RefundRequestModal from '@/app/components/refund-request-modal'
import ReturnRequestModal from '@/app/components/return-request-modal'
// import Pagination from '@/app/components/pagination'
import LoadingSpinner from '@/app/components/loading-spinner'

interface Order {
  id: string
  orderNumber: string
  trackingNumber?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
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
      id: string
      name: string
      sku: string
      images: string[]
      unitPrice: number
    }
  }[]
}


// Removed LOGISTICS_STAFF from everywhere

export default function OrdersPage() {
  // Import the receipt loading overlay
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReceiptLoadingOverlay = require('../components/receipt-loading-overlay').default
  const [showReceiptLoading, setShowReceiptLoading] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const { currency: selectedCurrency } = useCurrency();
  const { user } = useAuth()
  const { get, loading } = useApi()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(10)
  const [hasReturnsManagement, setHasReturnsManagement] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Check for Returns Management service subscription
  useEffect(() => {
    const checkReturnsService = async () => {
      if (!user) return

      // SJFS_ADMIN and WAREHOUSE_STAFF always have access
      if (user.role === 'SJFS_ADMIN' || user.role === 'WAREHOUSE_STAFF') {
        setHasReturnsManagement(true)
        return
      }

      try {
        const response = await get<{ subscriptions: Array<{ service: { name: string }, isActive: boolean }> }>('/api/merchant-services/status', { silent: true })
        if (response?.subscriptions) {
          const hasService = response.subscriptions.some(
            sub => sub.service.name === 'Returns Management' && sub.isActive
          )
          setHasReturnsManagement(hasService)
        }
      } catch (error) {
        console.error('Failed to check Returns Management service:', error)
        setHasReturnsManagement(false)
      }
    }

    checkReturnsService()
  }, [user, get])

  useEffect(() => {
    fetchOrders()
  }, [currentPage, statusFilter])

  // Refetch when search changes
  useEffect(() => {
    if (currentPage === 1) {
      fetchOrders()
    } else {
      setCurrentPage(1)
    }
  }, [searchTerm])

  const fetchOrders = async (bypassCache: boolean = false) => {
    try {
      setIsLoadingData(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })

      // Add search and filter parameters
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const response = await get<{ orders: Order[], pagination: any }>(`/api/orders?${params}`, { cache: !bypassCache })

      if (response && response.orders && Array.isArray(response.orders)) {
        setOrders(response.orders)
        setTotalPages(response.pagination?.pages || 1)
        setTotalItems(response.pagination?.total || 0)
      } else {
        setOrders([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800'
      case 'CONFIRMED':
        return 'bg-amber-100 text-amber-800'
      case 'PROCESSING':
        return 'bg-amber-100 text-amber-800'
      case 'SHIPPED':
        return 'bg-amber-100 text-amber-800'
      case 'DELIVERED':
        return 'bg-amber-100 text-amber-800'
      case 'RETURNED':
        return 'bg-orange-100 text-orange-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // No need for client-side filtering since we're doing server-side filtering
  const filteredOrders = orders || []

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  const handleDownloadReceipt = async (orderId: string) => {
    setShowReceiptLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/orders/${orderId}/receipt`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate receipt')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${orderId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Receipt download error:', error)
      alert('Failed to download receipt. Please try again.')
    } finally {
      setShowReceiptLoading(false)
    }
  }

  const handleProcessOrder = (orderId: string) => {
    // Navigate to order processing page or open processing modal
    router.push(`/orders/${orderId}/process`)
  }

  const handleRequestRefund = (order: Order) => {
    setSelectedOrder(order)
    setShowRefundModal(true)
  }

  const handleRefundSuccess = () => {
    // Refresh orders list after successful refund request
    fetchOrders(true) // Bypass cache
  }

  const handleRequestReturn = (order: Order) => {
    setSelectedOrder(order)
    setShowReturnModal(true)
  }

  const handleReturnSuccess = () => {
    fetchOrders(true) // Bypass cache
    setShowReturnModal(false)
    setSelectedOrder(null)
  }

  // Fix misplaced return: move return outside of any function or block
  // Add refund icon to actions for merchant roles
  return (
    <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
      {/* Full-screen loading overlay for receipt export */}
      <ReceiptLoadingOverlay show={showReceiptLoading} />
      <div className="px-2 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Orders</h1>
              <p className="mt-2 text-white">Manage and track all orders</p>
            </div>
            <div className="flex flex-row sm:flex-row gap-3 sm:gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white px-4 py-2 rounded-[5px] flex items-center w-full sm:w-auto"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Export
              </button>
              {/* Export Modal */}
              <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                type="orders"
                title="Export Orders"
                filters={{ status: statusFilter, search: searchTerm }}
              />
              <ServiceGateGroup
                serviceName="Order Processing"
                buttonLabel="Subscribe to access Order Management"
              >
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white px-4 py-2 rounded-[5px] flex items-center w-full sm:w-auto"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Order
                </button>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-[5px] flex items-center w-full sm:w-auto"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  Bulk Upload
                </button>
              </ServiceGateGroup>
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
                  { value: 'ALL', label: 'All Status' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'CONFIRMED', label: 'Confirmed' },
                  { value: 'PROCESSING', label: 'Processing' },
                  { value: 'SHIPPED', label: 'Shipped' },
                  { value: 'DELIVERED', label: 'Delivered' },
                  { value: 'RETURNED', label: 'Returned' },
                  { value: 'CANCELLED', label: 'Cancelled' }
                ]}
                value={statusFilter}
                onChange={handleStatusFilterChange}
                placeholder="All Status"
              />
            </div>
          </div>
        </div>


        {/* Orders Table */}
        <div className="bg-white/30 shadow overflow-hidden sm:rounded-[5px]">
          {/* Bulk Actions - Only for admin, logistics, warehouse staff */}
          {(user?.role === 'SJFS_ADMIN' || user?.role === 'WAREHOUSE_STAFF') && (
            <div className="mb-4 flex items-center gap-4">
              <button
                className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-[5px] font-medium disabled:opacity-50"
                disabled={selectedOrders.length === 0}
                onClick={() => setShowBulkStatusModal(true)}
              >
                Bulk Update Status
              </button>
              <span className="text-sm text-white/70">{selectedOrders.length} selected</span>
            </div>
          )}
          <div className="px-4 py-5 sm:p-6">
            {isLoadingData ? (
              <LoadingSpinner text="Loading orders..." size="lg" className="py-12" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white/50">
                    <tr>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedOrders(filteredOrders.map(o => o.id))
                            } else {
                              setSelectedOrders([])
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tracking #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="">
                        <td className="px-2 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedOrders(prev => [...prev, order.id])
                              } else {
                                setSelectedOrders(prev => prev.filter(id => id !== order.id))
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {order.orderNumber}
                            </div>
                            {user?.role === 'SJFS_ADMIN' && (
                              <div className="text-sm text-white">
                                {order.merchant.businessName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.trackingNumber ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-white bg-amber-700/20 px-2 py-1 rounded">{order.trackingNumber}</span>
                              <button
                                className="text-xs text-amber-500 hover:text-amber-700"
                                title="Copy tracking number"
                                onClick={() => {
                                  navigator.clipboard.writeText(order.trackingNumber || '')
                                }}
                              >Copy</button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-white">
                              {order.customerEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {order.orderItems.length} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {formatCurrency(order.totalAmount, selectedCurrency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewOrder(order.id)}
                              className="text-white hover:text-amber-900"
                              title="View Order Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(order.id)}
                              className="text-white hover:text-green-900"
                              title="Download Receipt"
                            >
                              <DocumentTextIcon className="h-4 w-4" />
                            </button>
                            {(user?.role === 'MERCHANT_ADMIN' || user?.role === 'MERCHANT_STAFF') && hasReturnsManagement && (
                              <>
                                {/* Only show return request for merchants, not admin */}
                                <button 
                                  onClick={() => handleRequestReturn(order)}
                                  className="text-white hover:text-orange-900"
                                  title="Request Return"
                                >
                                  {/* Return icon */}
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7v4a1 1 0 01-1 1H7.41l3.3 3.29a1 1 0 01-1.42 1.42l-5-5a1 1 0 010-1.42l5-5a1 1 0 011.42 1.42L7.41 7H18a1 1 0 011 1z" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {/* Admin: show accept/reject for pending returns (example, needs backend logic) */}
                            {user?.role === 'SJFS_ADMIN' && order.status === 'RETURN_REQUESTED' && (
                              <>
                                <button
                                  className="text-green-600 hover:text-green-900 text-xs px-2"
                                  title="Accept Return"
                                  onClick={() => {/* TODO: implement accept return logic */}}
                                >Accept</button>
                                <button
                                  className="text-red-600 hover:text-red-900 text-xs px-2"
                                  title="Reject Return"
                                  onClick={() => {/* TODO: implement reject return logic */}}
                                >Reject</button>
                              </>
                            )}
                            {(user?.role === 'MERCHANT_ADMIN' || user?.role === 'MERCHANT_STAFF') && order.customerPhone && (
                              <>
                                <CustomerCallButton
                                  customer={{
                                    id: `customer-${order.customerEmail}`,
                                    name: order.customerName,
                                    phone: order.customerPhone,
                                    email: order.customerEmail
                                  }}
                                  orderNumber={order.orderNumber}
                                  className="!p-1"
                                />

                              </>
                            )}
                            {order.status === 'CONFIRMED' && (user?.role === 'SJFS_ADMIN' || user?.role === 'WAREHOUSE_STAFF') && (
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
            )}

            {!isLoadingData && filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white">No orders found</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Modal */}
        {/* Bulk Status Update Modal - Only for admin, logistics, warehouse staff */}
        {(user?.role === 'SJFS_ADMIN' || user?.role === 'WAREHOUSE_STAFF') && showBulkStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <h2 className="text-lg font-bold mb-4">Bulk Update Status</h2>
              <label className="block text-sm font-medium mb-2">Select New Status</label>
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
              >
                <option value="">Select Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="RETURNED">Returned</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded"
                  onClick={() => setShowBulkStatusModal(false)}
                  disabled={bulkUpdating}
                >Cancel</button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded font-medium disabled:opacity-50"
                  disabled={!bulkStatus || bulkUpdating}
                  onClick={async () => {
                    setBulkUpdating(true)
                    let failed: string[] = [];
                    try {
                      const token = localStorage.getItem('token');
                      await Promise.all(selectedOrders.map(async orderId => {
                        const res = await fetch(`/api/orders/${orderId}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                          },
                          body: JSON.stringify({ status: bulkStatus })
                        });
                        if (!res.ok) failed.push(orderId);
                      }));
                      setShowBulkStatusModal(false)
                      setSelectedOrders([])
                      setBulkStatus('')
                      fetchOrders(true)
                      if (failed.length > 0) {
                        alert(`Bulk update failed for ${failed.length} orders.`);
                      }
                    } catch (err) {
                      alert('Bulk update failed due to a network or server error.')
                    } finally {
                      setBulkUpdating(false)
                    }
                  }}
                >{bulkUpdating ? 'Updating...' : 'Update Status'}</button>
              </div>
            </div>
          </div>
        )}
        <OrderModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          onSave={() => {
            fetchOrders(true) // Bypass cache
            setShowOrderModal(false)
          }}
        />

        {/* Bulk Upload Modal */}
        <BulkOrderUpload
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            fetchOrders(true) // Bypass cache
            setShowBulkUpload(false)
          }}
        />

        {/* Refund Request Modal */}
        {selectedOrder && (
          <RefundRequestModal
            isOpen={showRefundModal}
            onClose={() => {
              setShowRefundModal(false)
              setSelectedOrder(null)
            }}
            order={selectedOrder}
            onSuccess={handleRefundSuccess}
          />
        )}

        {/* Return Request Modal */}
        {selectedOrder && (
          <ReturnRequestModal
            isOpen={showReturnModal}
            onClose={() => {
              setShowReturnModal(false)
              setSelectedOrder(null)
            }}
            order={selectedOrder}
            onSuccess={handleReturnSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
