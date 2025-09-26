'use client'

import { useState } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Role {
  id: string
  name: string
  description: string
  icon: string
  color: string
  demoEmail: string
  demoPassword: string
}

const roles: Role[] = [
  {
    id: 'SJFS_ADMIN',
    name: 'SJFS Admin',
    description: 'Complete platform management and oversight',
    icon: '👑',
    color: 'bg-purple-500',
    demoEmail: 'admin@sjfulfillment.com',
    demoPassword: 'admin123'
  },
  {
    id: 'MERCHANT_ADMIN',
    name: 'Merchant Admin',
    description: 'Business management and team oversight',
    icon: '🏢',
    color: 'bg-blue-500',
    demoEmail: 'merchant@example.com',
    demoPassword: 'merchant123'
  },
  {
    id: 'MERCHANT_STAFF',
    name: 'Merchant Staff',
    description: 'Day-to-day operations and order processing',
    icon: '👥',
    color: 'bg-green-500',
    demoEmail: 'staff@example.com',
    demoPassword: 'staff123'
  },
  {
    id: 'WAREHOUSE_STAFF',
    name: 'Warehouse Staff',
    description: 'Inventory management and fulfillment',
    icon: '📦',
    color: 'bg-orange-500',
    demoEmail: 'warehouse@example.com',
    demoPassword: 'warehouse123'
  }
]

export default function WelcomePage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setEmail(role.demoEmail)
    setPassword(role.demoPassword)
    setShowLoginModal(true)
  }

  const handleGeneralSignIn = () => {
    setSelectedRole(null)
    setEmail('')
    setPassword('')
    setShowLoginModal(true)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await login(email, password)
      toast.success(selectedRole ? `Welcome, ${selectedRole.name}!` : 'Welcome!')
    } catch (error) {
      toast.error('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const closeModal = () => {
    setShowLoginModal(false)
    setSelectedRole(null)
    setEmail('')
    setPassword('')
    setShowPassword(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SJF</span>
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">
                SJFulfillment
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Complete Fulfillment Platform
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to SJFulfillment
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Complete fulfillment platform for businesses
          </p>
          <div className="flex justify-center space-x-4 mb-8">
            <a
              href="/merchant-register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Register Your Business
            </a>
            <button
              onClick={handleGeneralSignIn}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded"></div>
        </div>

        {/* Role Selection Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Existing Users - Sign In
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleRoleSelect(role)}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 group"
            >
              <div className="p-6">
                <div className={`w-16 h-16 ${role.color} rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {role.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {role.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {role.description}
                </p>
                <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                  <div className="font-medium">Demo Credentials:</div>
                  <div>Email: {role.demoEmail}</div>
                  <div>Password: {role.demoPassword}</div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Inventory Management
              </h3>
              <p className="text-gray-600 text-sm">
                Real-time stock tracking across multiple warehouses
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Order Processing
              </h3>
              <p className="text-gray-600 text-sm">
                End-to-end order management and fulfillment
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analytics & Reports
              </h3>
              <p className="text-gray-600 text-sm">
                Comprehensive business insights and reporting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedRole ? `Sign in as ${selectedRole.name}` : 'Sign In'}
                  </h2>
                  {selectedRole && (
                    <p className="text-gray-600 text-sm mt-1">
                      {selectedRole.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <a
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Forgot your password?
                  </a>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 px-4 py-2 rounded-md font-medium text-white transition-colors ${
                      isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : selectedRole 
                          ? `${selectedRole.color} hover:opacity-90`
                          : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>
              </form>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  {selectedRole ? (
                    <>
                      <strong>Demo Mode:</strong> This is a demonstration. In production, users would have their own credentials.
                    </>
                  ) : (
                    <>
                      <strong>New to SJFulfillment?</strong> <a href="/merchant-register" className="text-blue-600 hover:text-blue-700 underline">Register your business</a> to get started.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
