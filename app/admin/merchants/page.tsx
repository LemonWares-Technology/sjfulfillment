'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import { PlusIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline'
import MerchantModal from '@/app/components/merchant-modal'
import { useRouter } from 'next/navigation'

interface Merchant {
  id: string
  businessName: string
  businessEmail: string
  businessPhone: string
  address: string
  city: string
  state: string
  onboardingStatus: string
  createdAt: string
  users: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    isActive: boolean
  }[]
  subscriptions: {
    id: string
    status: string
    servicePlan: {
      id: string
      name: string
      basePrice: number
    }
  }[]
  _count: {
    products: number
    orders: number
  }
}

export default function MerchantsPage() {
  const { user } = useAuth()
  const { get, loading } = useApi()
  const router = useRouter()
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showMerchantModal, setShowMerchantModal] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null)

  useEffect(() => {
    fetchMerchants()
  }, [])

  const fetchMerchants = async () => {
    try {
      const response = await get<{merchants: Merchant[]}>('/api/merchants')
      setMerchants(response?.merchants || [])
    } catch (error) {
      console.error('Failed to fetch merchants:', error)
      setMerchants([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredMerchants = merchants.filter(merchant =>
    merchant.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.businessEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddMerchant = () => {
    setEditingMerchant(null)
    setShowMerchantModal(true)
  }

  const handleEditMerchant = (merchant: Merchant) => {
    setEditingMerchant(merchant)
    setShowMerchantModal(true)
  }

  const handleCloseModal = () => {
    setShowMerchantModal(false)
    setEditingMerchant(null)
  }

  const handleSaveMerchant = () => {
    fetchMerchants()
  }

  const handleViewMerchant = (merchantId: string) => {
    router.push(`/admin/merchants/${merchantId}`)
  }

  return (
    <DashboardLayout userRole="SJFS_ADMIN">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Merchants</h1>
              <p className="mt-2 text-gray-600">
                Manage all merchants on the platform
              </p>
            </div>
            <button 
              onClick={handleAddMerchant}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Merchant
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Search merchants..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Merchants Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Onboarding Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMerchants.map((merchant) => (
                    <tr key={merchant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {merchant.businessName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {merchant.address}, {merchant.city}, {merchant.state}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {merchant.businessEmail}
                          </div>
                          <div className="text-sm text-gray-500">
                            {merchant.businessPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(merchant.onboardingStatus)}`}>
                          {merchant.onboardingStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          merchant.subscriptions.length > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {merchant.subscriptions.length > 0 ? 'ACTIVE' : 'NO SUBSCRIPTION'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {merchant.users.length} users
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(merchant.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewMerchant(merchant.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Merchant Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditMerchant(merchant)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Merchant"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredMerchants.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No merchants found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Merchant Modal */}
      <MerchantModal
        isOpen={showMerchantModal}
        onClose={handleCloseModal}
        merchant={editingMerchant}
        onSave={handleSaveMerchant}
      />
    </DashboardLayout>
  )
}
