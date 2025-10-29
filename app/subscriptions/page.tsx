'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import { useCurrency } from '@/app/lib/currency-context';
import { CreditCardIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface Subscription {
  id: string
  status: string
  startDate: string
  endDate: string
  totalAmount: number
  servicePlan: {
    id: string
    name: string
    basePrice: number
    billingCycle: string
  }
  addons: {
    id: string
    quantity: number
    price: number
    addonService: {
      name: string
      price: number
    }
  }[]
}

export default function SubscriptionsPage() {
  const { currency: selectedCurrency } = useCurrency();
  const { user } = useAuth()
  const { get, request, loading } = useApi()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editPlanId, setEditPlanId] = useState<string | null>(null)
  const [editRate, setEditRate] = useState<string>('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const data = await get<Subscription[]>('/api/subscriptions')
      setSubscriptions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
      setSubscriptions([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout userRole={user?.role || 'MERCHANT_ADMIN'}>
      {/* Admin-only: Edit Plan Rate Modal */}
      {user?.role === 'SJFS_ADMIN' && showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Plan Rate</h2>
            <label className="block mb-2 text-sm font-medium text-gray-700">New Rate (NGN)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              className="w-full border px-3 py-2 rounded mb-4"
              value={editRate}
              onChange={e => setEditRate(e.target.value)}
              disabled={editLoading}
            />
            {editError && <div className="text-red-600 mb-2 text-sm">{editError}</div>}
            {editSuccess && <div className="text-green-600 mb-2 text-sm">{editSuccess}</div>}
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => { setShowEditModal(false); setEditError(null); setEditSuccess(null); }}
                disabled={editLoading}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-amber-600 text-white hover:bg-amber-700"
                disabled={editLoading || !editRate || Number(editRate) <= 0}
                onClick={async () => {
                  setEditLoading(true)
                  setEditError(null)
                  setEditSuccess(null)
                  try {
                    await request('/api/admin/service-plans/update-rate', {
                      method: 'PATCH',
                      body: JSON.stringify({
                        planId: editPlanId,
                        newRate: Number(editRate)
                      }),
                      headers: {
                        'Content-Type': 'application/json'
                      }
                    })
                    setEditSuccess('Rate updated successfully')
                    setTimeout(() => {
                      setShowEditModal(false)
                      setEditSuccess(null)
                      fetchSubscriptions()
                    }, 1200)
                  } catch (err: any) {
                    setEditError(err?.message || 'Failed to update rate')
                  } finally {
                    setEditLoading(false)
                  }
                }}
              >{editLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
              <p className="mt-2 text-gray-600">
                Manage your subscription and billing
              </p>
            </div>
            <button className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-md flex items-center">
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Current Subscription */}
        {subscriptions.length > 0 && (
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Current Subscription</h2>
              {subscriptions
                .filter(sub => sub.status === 'ACTIVE')
                .map((subscription) => (
                  <div key={subscription.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {subscription.servicePlan.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {subscription.servicePlan.billingCycle} billing
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(subscription.totalAmount)}
                        </div>
                        <div className="text-sm text-gray-600">per {subscription.servicePlan.billingCycle}</div>
                        {/* Admin-only: Edit Rate Button */}
                        {user?.role === 'SJFS_ADMIN' && (
                          <button
                            className="mt-2 px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700"
                            onClick={() => {
                              setEditPlanId(subscription.servicePlan.id)
                              setEditRate(String(subscription.servicePlan.basePrice))
                              setShowEditModal(true)
                            }}
                          >Edit Rate</button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Started: {formatDate(subscription.startDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Next billing: {formatDate(subscription.endDate)}
                      </div>
                    </div>

                    {subscription.addons.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Add-ons</h4>
                        <div className="space-y-1">
                          {subscription.addons.map((addon) => (
                            <div key={addon.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {addon.addonService.name} (x{addon.quantity})
                              </span>
                              <span className="text-gray-900">
                                {formatCurrency(addon.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
                        Cancel Subscription
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* All Subscriptions */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.servicePlan.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.servicePlan.billingCycle}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(subscription.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(subscription.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(subscription.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {subscriptions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No subscriptions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
