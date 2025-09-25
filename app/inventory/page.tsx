'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatDate } from '@/app/lib/utils'
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, CogIcon } from '@heroicons/react/24/outline'
import StockMovementModal from '@/app/components/stock-movement-modal'

interface StockItem {
  id: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  reorderPoint: number
  product: {
    id: string
    name: string
    sku: string
  }
  warehouseLocation: {
    id: string
    name: string
    address: string
  }
  lastUpdated: string
}

export default function InventoryPage() {
  const { user } = useAuth()
  const { get, loading } = useApi()
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [showLowStock, setShowLowStock] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null)

  useEffect(() => {
    fetchStockItems()
  }, [])

  const fetchStockItems = async () => {
    try {
      const data = await get<StockItem[]>('/api/stock')
      setStockItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch stock items:', error)
      setStockItems([])
    }
  }

  const getStockStatus = (item: StockItem) => {
    if (item.availableQuantity <= 0) {
      return { color: 'bg-red-100 text-red-800', text: 'Out of Stock' }
    } else if (item.availableQuantity <= item.reorderPoint) {
      return { color: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' }
    } else {
      return { color: 'bg-green-100 text-green-800', text: 'In Stock' }
    }
  }

  const filteredItems = showLowStock 
    ? stockItems.filter(item => item.availableQuantity <= item.reorderPoint)
    : stockItems

  const handleStockMovement = (stockItemId: string) => {
    setSelectedStockId(stockItemId)
    setShowMovementModal(true)
  }

  const handleCloseMovementModal = () => {
    setShowMovementModal(false)
    setSelectedStockId(null)
  }

  const handleSaveMovement = () => {
    fetchStockItems()
  }

  return (
    <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
              <p className="mt-2 text-gray-600">
                Manage your stock levels and inventory
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center">
                <ArrowUpIcon className="h-5 w-5 mr-2" />
                Stock In
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center">
                <ArrowDownIcon className="h-5 w-5 mr-2" />
                Stock Out
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show only low stock items</span>
            </label>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warehouse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reserved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reorder Point
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item)
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {item.product.sku}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.warehouseLocation.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.warehouseLocation.address}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.reservedQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.availableQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.reorderPoint}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.lastUpdated)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleStockMovement(item.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <CogIcon className="h-4 w-4 mr-1" />
                            Move Stock
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No inventory items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Stock Movement Modal */}
        <StockMovementModal
          isOpen={showMovementModal}
          onClose={handleCloseMovementModal}
          stockItemId={selectedStockId}
          onSave={handleSaveMovement}
        />
      </div>
    </DashboardLayout>
  )
}
