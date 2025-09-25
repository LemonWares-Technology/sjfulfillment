'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import { useApi } from '@/app/lib/use-api'
import DashboardLayout from '@/app/components/dashboard-layout'
import PaymentGate from '@/app/components/payment-gate'
import { UserIcon, BuildingOfficeIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface MerchantAccount {
  id: string
  businessName: string
  businessEmail: string
  businessPhone: string
  contactPerson: string
  address: string
  city: string
  state: string
  country: string
  cacNumber?: string
  taxId?: string
  onboardingStatus: string
  createdAt: string
  updatedAt: string
}

interface UserAccount {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  createdAt: string
}

export default function MerchantAccountPage() {
  const { user } = useAuth()
  const { get, put, loading } = useApi()
  const [merchantData, setMerchantData] = useState<MerchantAccount | null>(null)
  const [userData, setUserData] = useState<UserAccount | null>(null)
  const [editingMerchant, setEditingMerchant] = useState(false)
  const [editingUser, setEditingUser] = useState(false)
  const [merchantForm, setMerchantForm] = useState<Partial<MerchantAccount>>({})
  const [userForm, setUserForm] = useState<Partial<UserAccount>>({})
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAccountData()
  }, [])

  const fetchAccountData = async () => {
    try {
      if (user?.merchantId) {
        // Fetch merchant data
        const merchant = await get<MerchantAccount>(`/api/merchants/${user.merchantId}`)
        setMerchantData(merchant)
        setMerchantForm(merchant)
      }

      if (user?.userId) {
        // Fetch user data
        const userAccount = await get<UserAccount>(`/api/users/${user.userId}`)
        setUserData(userAccount)
        setUserForm(userAccount)
      }
    } catch (error) {
      console.error('Failed to fetch account data:', error)
      setErrors({ fetch: 'Failed to load account data. Please refresh the page.' })
    }
  }

  const handleMerchantSave = async () => {
    setIsSubmitting(true)
    setErrors({})

    try {
      const updatedMerchant = await put(`/api/merchants/${merchantData?.id}`, merchantForm)
      setMerchantData(updatedMerchant)
      setEditingMerchant(false)
    } catch (error) {
      console.error('Failed to update merchant:', error)
      setErrors({ merchant: 'Failed to update business information. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUserSave = async () => {
    setIsSubmitting(true)
    setErrors({})

    try {
      const updatedUser = await put(`/api/users/${userData?.id}`, userForm)
      setUserData(updatedUser)
      setEditingUser(false)
    } catch (error) {
      console.error('Failed to update user:', error)
      setErrors({ user: 'Failed to update personal information. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMerchantCancel = () => {
    setMerchantForm(merchantData || {})
    setEditingMerchant(false)
    setErrors({})
  }

  const handleUserCancel = () => {
    setUserForm(userData || {})
    setEditingUser(false)
    setErrors({})
  }

  return (
    <PaymentGate userRole="MERCHANT_ADMIN">
      <DashboardLayout userRole="MERCHANT_ADMIN">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account Management</h1>
            <p className="mt-2 text-gray-600">
              Manage your business and personal account information.
            </p>
          </div>

          {errors.fetch && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{errors.fetch}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Business Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mr-3" />
                    <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
                  </div>
                  {!editingMerchant ? (
                    <button
                      onClick={() => setEditingMerchant(true)}
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleMerchantSave}
                        disabled={isSubmitting}
                        className="text-green-600 hover:text-green-700 flex items-center"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={handleMerchantCancel}
                        className="text-gray-600 hover:text-gray-700 flex items-center"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 space-y-4">
                {errors.merchant && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{errors.merchant}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    {editingMerchant ? (
                      <input
                        type="text"
                        value={merchantForm.businessName || ''}
                        onChange={(e) => setMerchantForm({...merchantForm, businessName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{merchantData?.businessName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Email
                    </label>
                    {editingMerchant ? (
                      <input
                        type="email"
                        value={merchantForm.businessEmail || ''}
                        onChange={(e) => setMerchantForm({...merchantForm, businessEmail: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{merchantData?.businessEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Phone
                    </label>
                    {editingMerchant ? (
                      <input
                        type="tel"
                        value={merchantForm.businessPhone || ''}
                        onChange={(e) => setMerchantForm({...merchantForm, businessPhone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{merchantData?.businessPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    {editingMerchant ? (
                      <input
                        type="text"
                        value={merchantForm.contactPerson || ''}
                        onChange={(e) => setMerchantForm({...merchantForm, contactPerson: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{merchantData?.contactPerson}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address
                  </label>
                  {editingMerchant ? (
                    <textarea
                      value={merchantForm.address || ''}
                      onChange={(e) => setMerchantForm({...merchantForm, address: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{merchantData?.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    {editingMerchant ? (
                      <input
                        type="text"
                        value={merchantForm.city || ''}
                        onChange={(e) => setMerchantForm({...merchantForm, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{merchantData?.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    {editingMerchant ? (
                      <input
                        type="text"
                        value={merchantForm.state || ''}
                        onChange={(e) => setMerchantForm({...merchantForm, state: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{merchantData?.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    {editingMerchant ? (
                      <input
                        type="text"
                        value={merchantForm.country || ''}
                        onChange={(e) => setMerchantForm({...merchantForm, country: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{merchantData?.country}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CAC Number
                    </label>
                    {editingMerchant ? (
                      <input
                        type="text"
                        value={merchantForm.cacNumber || ''}
                        onChange={(e) => setMerchantForm({...merchantForm, cacNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{merchantData?.cacNumber || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID
                    </label>
                    {editingMerchant ? (
                      <input
                        type="text"
                        value={merchantForm.taxId || ''}
                        onChange={(e) => setMerchantForm({...merchantForm, taxId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{merchantData?.taxId || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Account Status:</span>
                      <span className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        merchantData?.onboardingStatus === 'APPROVED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {merchantData?.onboardingStatus}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Created: {merchantData?.createdAt ? new Date(merchantData.createdAt).toLocaleDateString() : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserIcon className="h-6 w-6 text-gray-400 mr-3" />
                    <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  </div>
                  {!editingUser ? (
                    <button
                      onClick={() => setEditingUser(true)}
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUserSave}
                        disabled={isSubmitting}
                        className="text-green-600 hover:text-green-700 flex items-center"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={handleUserCancel}
                        className="text-gray-600 hover:text-gray-700 flex items-center"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 space-y-4">
                {errors.user && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{errors.user}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    {editingUser ? (
                      <input
                        type="text"
                        value={userForm.firstName || ''}
                        onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{userData?.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    {editingUser ? (
                      <input
                        type="text"
                        value={userForm.lastName || ''}
                        onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{userData?.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    {editingUser ? (
                      <input
                        type="email"
                        value={userForm.email || ''}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{userData?.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {editingUser ? (
                      <input
                        type="tel"
                        value={userForm.phone || ''}
                        onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{userData?.phone}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Role:</span>
                      <span className="ml-2 inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {userData?.role}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Member since: {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </PaymentGate>
  )
}
