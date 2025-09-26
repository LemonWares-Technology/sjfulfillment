'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatDate } from '@/app/lib/utils'
import { PlusIcon, PencilIcon, MapPinIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import SearchBar from '@/app/components/search-bar'
import FilterSelect from '@/app/components/filter-select'
import WarehouseModal from '@/app/components/warehouse-modal'
import WarehouseZoneModal from '@/app/components/warehouse-zone-modal'
import ServiceGate from '@/app/components/service-gate'

interface Warehouse {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  country: string
  capacity: number
  isActive: boolean
  createdAt: string
  zones: {
    id: string
    name: string
    code: string
    capacity: number
    zoneType: string
    isActive: boolean
  }[]
  merchants: {
    id: string
    businessName: string
  }[]
  stockItems: {
    id: string
    quantity: number
    availableQuantity: number
  }[]
  orders: {
    id: string
    orderNumber: string
    status: string
  }[]
}

export default function WarehousesPage() {
  const { user } = useAuth()
  const { get, delete: deleteWarehouse, loading } = useApi()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null)

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    try {
      const data = await get<{warehouses: Warehouse[]}>('/api/warehouses', { silent: true })
      setWarehouses(Array.isArray(data?.warehouses) ? data.warehouses : [])
    } catch (error) {
      console.error('Failed to fetch warehouses:', error)
      setWarehouses([])
    }
  }

  const handleDeleteWarehouse = async (warehouseId: string) => {
    if (confirm('Are you sure you want to delete this warehouse?')) {
      try {
        await deleteWarehouse(`/api/warehouses/${warehouseId}`)
        fetchWarehouses()
      } catch (error) {
        console.error('Failed to delete warehouse:', error)
      }
    }
  }

  const handleAddWarehouse = () => {
    setEditingWarehouse(null)
    setShowWarehouseModal(true)
  }

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setShowWarehouseModal(true)
  }

  const handleAddZone = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId)
    setShowZoneModal(true)
  }

  const handleCloseWarehouseModal = () => {
    setShowWarehouseModal(false)
    setEditingWarehouse(null)
  }

  const handleCloseZoneModal = () => {
    setShowZoneModal(false)
    setSelectedWarehouseId(null)
  }

  const handleSaveWarehouse = () => {
    fetchWarehouses()
  }

  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.state.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'ACTIVE' && warehouse.isActive) ||
                          (statusFilter === 'INACTIVE' && !warehouse.isActive)
    
    return matchesSearch && matchesStatus
  })

  return (
    <DashboardLayout userRole={user?.role || 'SJFS_ADMIN'}>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
              <p className="mt-2 text-gray-600">
                Manage warehouse locations and zones
              </p>
            </div>
            {user?.role === 'SJFS_ADMIN' && (
              <ServiceGate serviceName="Warehouse Management">
                <button
                  onClick={handleAddWarehouse}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Warehouse
                </button>
              </ServiceGate>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search warehouses by name, code, or location..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <div className="sm:w-48">
              <FilterSelect
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
              />
            </div>
          </div>
        </div>

        {/* Warehouses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map((warehouse) => (
            <div key={warehouse.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {warehouse.name}
                  </h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    warehouse.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {warehouse.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {warehouse.address}
                  </div>
                  <div className="text-sm text-gray-600">
                    {warehouse.city}, {warehouse.state}, {warehouse.country}
                  </div>
                  <div className="text-sm text-gray-600">
                    Code: {warehouse.code}
                  </div>
                  <div className="text-sm text-gray-600">
                    Capacity: {warehouse.capacity?.toLocaleString() || 'N/A'} units
                  </div>
                  <div className="text-sm text-gray-600">
                    Merchants: {warehouse.merchants?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    Stock Items: {warehouse.stockItems?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    Active Orders: {warehouse.orders?.length || 0}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Zones ({warehouse.zones?.length || 0})</h4>
                    {user?.role === 'SJFS_ADMIN' && (
                      <button
                        onClick={() => handleAddZone(warehouse.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        + Add Zone
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {warehouse.zones?.slice(0, 3).map((zone) => (
                      <div key={zone.id} className="text-xs text-gray-600 flex justify-between">
                        <span>{zone.name} ({zone.zoneType})</span>
                        <span className="text-gray-400">{zone.capacity} units</span>
                      </div>
                    ))}
                    {warehouse.zones && warehouse.zones.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{warehouse.zones.length - 3} more zones
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Created {formatDate(warehouse.createdAt)}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditWarehouse(warehouse)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Warehouse"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {user?.role === 'SJFS_ADMIN' && (
                      <button
                        onClick={() => handleDeleteWarehouse(warehouse.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Warehouse"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredWarehouses.length === 0 && (
          <div className="text-center py-8">
            <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No warehouses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'SJFS_ADMIN' 
                ? 'Get started by creating your first warehouse.' 
                : 'No warehouses are available.'}
            </p>
          </div>
        )}

        {/* Warehouse Modal */}
        <WarehouseModal
          isOpen={showWarehouseModal}
          onClose={handleCloseWarehouseModal}
          warehouse={editingWarehouse}
          onSave={handleSaveWarehouse}
        />

        {/* Zone Modal */}
        <WarehouseZoneModal
          isOpen={showZoneModal}
          onClose={handleCloseZoneModal}
          warehouseId={selectedWarehouseId}
          onSave={handleSaveWarehouse}
        />
      </div>
    </DashboardLayout>
  )
}
