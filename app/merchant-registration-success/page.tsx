'use client'

import { CheckCircleIcon, ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function MerchantRegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registration Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your merchant account has been created and approved automatically!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="flex items-start space-x-3">
            <ClockIcon className="h-6 w-6 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Next step: Complete payment</h3>
              <p className="text-gray-600 text-sm mt-1">
                Login and complete payment to access the platform, then select your services.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <EnvelopeIcon className="h-6 w-6 text-green-500 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Account approved</h3>
              <p className="text-gray-600 text-sm mt-1">
                Your account is automatically approved. No waiting required!
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">After payment & service selection</h3>
              <p className="text-gray-600 text-sm mt-1">
                You'll have access to only the services you select and pay for.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <Link
            href="/login"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg inline-block"
          >
            Login & Complete Payment
          </Link>
          
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="mailto:support@sjfulfillment.com" className="text-blue-600 hover:text-blue-700">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
