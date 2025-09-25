'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useApi } from '@/app/lib/use-api'

interface Warehouse {
  id?: string
  name: string
  code: string
  address: string
  city: string
  state: string
  country: string
  capacity: number
  managerId?: string
  isActive: boolean
}

interface WarehouseModalProps {
  isOpen: boolean
  onClose: () => void
  warehouse?: Warehouse | null
  onSave: () => void
}

export default function WarehouseModal({ isOpen, onClose, warehouse, onSave }: WarehouseModalProps) {
  const { post, put, loading } = useApi()
  const [formData, setFormData] = useState<Warehouse>({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    capacity: 0,
    managerId: '',
    isActive: true
  })

  useEffect(() => {
    if (warehouse) {
      setFormData(warehouse)
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        country: 'Nigeria',
        capacity: 0,
        managerId: '',
        isActive: true
      })
    }
  }, [warehouse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (warehouse?.id) {
        await put(`/api/warehouses/${warehouse.id}`, formData)
      } else {
        await post('/api/warehouses', formData)
      }
      onSave()
      onClose()
    } catch (error) {
      console.error('Failed to save warehouse:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              {warehouse?.id ? 'Edit Warehouse' : 'Add New Warehouse'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., WH-LAG-001"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                rows={3}
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select State</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Kano">Kano</option>
                  <option value="Rivers">Rivers</option>
                  <option value="Ogun">Ogun</option>
                  <option value="Oyo">Oyo</option>
                  <option value="Kaduna">Kaduna</option>
                  <option value="Enugu">Enugu</option>
                  <option value="Delta">Delta</option>
                  <option value="Imo">Imo</option>
                  <option value="Anambra">Anambra</option>
                  <option value="Akwa Ibom">Akwa Ibom</option>
                  <option value="Bayelsa">Bayelsa</option>
                  <option value="Cross River">Cross River</option>
                  <option value="Edo">Edo</option>
                  <option value="Ekiti">Ekiti</option>
                  <option value="Osun">Osun</option>
                  <option value="Ondo">Ondo</option>
                  <option value="Kwara">Kwara</option>
                  <option value="Benue">Benue</option>
                  <option value="Plateau">Plateau</option>
                  <option value="Niger">Niger</option>
                  <option value="Sokoto">Sokoto</option>
                  <option value="Kebbi">Kebbi</option>
                  <option value="Zamfara">Zamfara</option>
                  <option value="Katsina">Katsina</option>
                  <option value="Jigawa">Jigawa</option>
                  <option value="Yobe">Yobe</option>
                  <option value="Borno">Borno</option>
                  <option value="Adamawa">Adamawa</option>
                  <option value="Taraba">Taraba</option>
                  <option value="Bauchi">Bauchi</option>
                  <option value="Gombe">Gombe</option>
                  <option value="Nasarawa">Nasarawa</option>
                  <option value="FCT">FCT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (units) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <label className="text-sm text-gray-700">Active Warehouse</label>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {loading ? 'Saving...' : (warehouse?.id ? 'Update Warehouse' : 'Create Warehouse')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
