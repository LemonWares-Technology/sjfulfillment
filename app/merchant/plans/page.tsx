'use client'

import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { useApi } from '@/app/lib/use-api'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import { 
  CheckIcon, 
  XMarkIcon, 
  PlusIcon, 
  MinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface Service {
  id: string
  name: string
  description: string
  price: number
  category: string
  features: string[]
  isActive: boolean
}

interface MerchantServiceSubscription {
  id: string
  serviceId: string
  quantity: number
  priceAtSubscription: number
  status: string
  startDate: string
  endDate: string | null
  service: Service
}

interface SelectedService {
  serviceId: string
  quantity: number
  price: number
}

interface PlanUpdateStatus {
  canUpdate: boolean
  lastUpdate: string | null
  nextUpdateAvailable: string | null
  hoursRemaining: number
}

export default function PlanManagementPage() {
  const { user } = useAuth()
  const { get, post, put, loading } = useApi()
  const [services, setServices] = useState<Service[]>([])
  const [currentSubscriptions, setCurrentSubscriptions] = useState<MerchantServiceSubscription[]>([])
  const [selectedServices, setSelectedServices] = useState<{[key: string]: SelectedService}>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<PlanUpdateStatus | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch available services
      const servicesData = await get<Service[]>('/api/services')
      const processedServices = servicesData
        .filter(service => service.isActive)
        .map(service => ({
          ...service,
          price: typeof service.price === 'string' ? parseFloat(service.price) : service.price
        }))
      setServices(processedServices)

      // Fetch current subscriptions
      const subscriptionsData = await get<MerchantServiceSubscription[]>('/api/merchant-services/subscribe')
      setCurrentSubscriptions(subscriptionsData || [])

      // Fetch plan update status
      const statusData = await get<PlanUpdateStatus>('/api/merchant-services/update-status')
      setUpdateStatus(statusData)

      // Initialize selected services with current subscriptions
      const initialSelected: {[key: string]: SelectedService} = {}
      subscriptionsData.forEach(sub => {
        if (sub.status === 'ACTIVE') {
          initialSelected[sub.serviceId] = {
            serviceId: sub.serviceId,
            quantity: sub.quantity,
            price: Number(sub.priceAtSubscription)
          }
        }
      })
      setSelectedServices(initialSelected)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const newSelected = { ...prev }
      if (newSelected[service.id]) {
        delete newSelected[service.id]
      } else {
        newSelected[service.id] = {
          serviceId: service.id,
          quantity: 1,
          price: service.price
        }
      }
      return newSelected
    })
  }

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) return
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        quantity
      }
    }))
  }

  const calculateTotal = () => {
    return Object.values(selectedServices).reduce((total, service) => {
      return total + (service.price * service.quantity)
    }, 0)
  }

  const calculateCurrentTotal = () => {
    return currentSubscriptions
      .filter(sub => sub.status === 'ACTIVE')
      .reduce((total, sub) => {
        return total + (Number(sub.priceAtSubscription) * sub.quantity)
      }, 0)
  }

  const getServiceStatus = (serviceId: string) => {
    const subscription = currentSubscriptions.find(sub => sub.serviceId === serviceId && sub.status === 'ACTIVE')
    if (!subscription) return 'not_subscribed'
    
    const selected = selectedServices[serviceId]
    if (!selected) return 'removing'
    if (selected.quantity !== subscription.quantity) return 'quantity_changed'
    return 'active'
  }

  const handleUpdatePlan = async () => {
    setIsUpdating(true)
    try {
      // Get services to add/update
      const servicesToUpdate = Object.values(selectedServices).map(service => ({
        serviceId: service.serviceId,
        quantity: service.quantity
      }))

      // Get services to remove (currently subscribed but not in selected)
      const currentServiceIds = currentSubscriptions
        .filter(sub => sub.status === 'ACTIVE')
        .map(sub => sub.serviceId)
      const selectedServiceIds = Object.keys(selectedServices)
      const servicesToRemove = currentServiceIds.filter(id => !selectedServiceIds.includes(id))

      // Update subscriptions
      await post('/api/merchant-services/update-plan', {
        servicesToUpdate,
        servicesToRemove
      })

      // Refresh data
      await fetchData()
      setShowComparison(false)
    } catch (error) {
      console.error('Failed to update plan:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = (serviceId: string) => {
    const status = getServiceStatus(serviceId)
    switch (status) {
      case 'active':
        return <CheckIcon className="h-5 w-5 text-green-600" />
      case 'quantity_changed':
        return <ArrowUpIcon className="h-5 w-5 text-blue-600" />
      case 'removing':
        return <XMarkIcon className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = (serviceId: string) => {
    const status = getServiceStatus(serviceId)
    switch (status) {
      case 'active':
        return 'Current'
      case 'quantity_changed':
        return 'Updating'
      case 'removing':
        return 'Removing'
      default:
        return 'New'
    }
  }

  const serviceCategories = [...new Set(services.map(s => s.category))]

  return (
    <DashboardLayout userRole="MERCHANT_ADMIN">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
              <p className="mt-2 text-gray-600">
                Manage your service subscriptions and daily costs
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                {showComparison ? 'Hide' : 'Show'} Comparison
              </button>
              <button
                onClick={handleUpdatePlan}
                disabled={isUpdating || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Plan Update Status */}
        {updateStatus && !updateStatus.canUpdate && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Plan Update Restricted
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You can only update your plan once every 24 hours. 
                    {updateStatus.hoursRemaining > 0 && (
                      <span> Please wait {updateStatus.hoursRemaining} more hour(s).</span>
                    )}
                  </p>
                  {updateStatus.lastUpdate && (
                    <p className="mt-1">
                      Last updated: {formatDate(updateStatus.lastUpdate)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Plan Summary */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Current Daily Cost
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(calculateCurrentTotal())}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowUpIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      New Daily Cost
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(calculateTotal())}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">₦</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Daily Difference
                    </dt>
                    <dd className={`text-lg font-medium ${
                      calculateTotal() > calculateCurrentTotal() 
                        ? 'text-red-600' 
                        : calculateTotal() < calculateCurrentTotal()
                        ? 'text-green-600'
                        : 'text-gray-900'
                    }`}>
                      {calculateTotal() > calculateCurrentTotal() ? '+' : ''}
                      {formatCurrency(calculateTotal() - calculateCurrentTotal())}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services by Category */}
        {serviceCategories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services
                .filter(service => service.category === category)
                .map(service => {
                  const isSelected = !!selectedServices[service.id]
                  const currentSubscription = currentSubscriptions.find(sub => sub.serviceId === service.id && sub.status === 'ACTIVE')
                  const status = getServiceStatus(service.id)
                  
                  return (
                    <div
                      key={service.id}
                      className={`relative bg-white rounded-lg shadow-md border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Status Badge */}
                      {status !== 'not_subscribed' && (
                        <div className="absolute top-3 right-3 flex items-center space-x-1">
                          {getStatusIcon(service.id)}
                          <span className="text-xs font-medium text-gray-600">
                            {getStatusText(service.id)}
                          </span>
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {service.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              {service.description}
                            </p>
                            <div className="text-2xl font-bold text-blue-600">
                              {formatCurrency(service.price)}
                              <span className="text-sm font-normal text-gray-500">/day</span>
                            </div>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {service.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                            {service.features.length > 3 && (
                              <li className="text-xs text-gray-500">
                                +{service.features.length - 3} more features
                              </li>
                            )}
                          </ul>
                        </div>

                        {/* Current Subscription Info */}
                        {currentSubscription && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-md">
                            <div className="text-sm text-gray-600">
                              <div>Current: {currentSubscription.quantity} × {formatCurrency(Number(currentSubscription.priceAtSubscription))}</div>
                              <div>Total: {formatCurrency(Number(currentSubscription.priceAtSubscription) * currentSubscription.quantity)}/day</div>
                            </div>
                          </div>
                        )}

                        {/* Selection Controls */}
                        <div className="space-y-3">
                          <button
                            onClick={() => toggleService(service)}
                            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                              isSelected
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {isSelected ? 'Remove Service' : 'Add Service'}
                          </button>

                          {isSelected && (
                            <div className="flex items-center justify-center space-x-3">
                              <button
                                onClick={() => updateQuantity(service.id, selectedServices[service.id].quantity - 1)}
                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-medium">
                                {selectedServices[service.id].quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(service.id, selectedServices[service.id].quantity + 1)}
                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}

        {/* Plan Comparison */}
        {showComparison && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Current Plan</h4>
                <div className="space-y-2">
                  {currentSubscriptions
                    .filter(sub => sub.status === 'ACTIVE')
                    .map(sub => (
                      <div key={sub.id} className="flex justify-between text-sm">
                        <span>{sub.service.name} (×{sub.quantity})</span>
                        <span>{formatCurrency(Number(sub.priceAtSubscription) * sub.quantity)}/day</span>
                      </div>
                    ))}
                  <div className="border-t pt-2 font-medium">
                    Total: {formatCurrency(calculateCurrentTotal())}/day
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">New Plan</h4>
                <div className="space-y-2">
                  {Object.values(selectedServices).map(service => {
                    const serviceData = services.find(s => s.id === service.serviceId)
                    return (
                      <div key={service.serviceId} className="flex justify-between text-sm">
                        <span>{serviceData?.name} (×{service.quantity})</span>
                        <span>{formatCurrency(service.price * service.quantity)}/day</span>
                      </div>
                    )
                  })}
                  <div className="border-t pt-2 font-medium">
                    Total: {formatCurrency(calculateTotal())}/day
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Plan Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleUpdatePlan}
            disabled={
              isUpdating || 
              loading || 
              calculateTotal() === calculateCurrentTotal() ||
              (updateStatus && !updateStatus.canUpdate)
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Updating Plan...' : 'Update Plan'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
