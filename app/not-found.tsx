'use client'

import { useRouter } from 'next/navigation'
import { HomeIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* 404 Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
              <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
            </div>

            {/* 404 Title */}
            <h1 className="text-6xl font-bold text-gray-900 mb-2">
              404
            </h1>

            {/* Page Not Found Message */}
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Page Not Found
            </h2>

            <p className="text-gray-600 mb-8">
              Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have entered the wrong URL.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Go Back
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Go Home
              </button>
            </div>

            {/* Helpful Links */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Here are some helpful links:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/welcome')}
                  className="block w-full text-sm text-blue-600 hover:text-blue-500 text-center"
                >
                  Login / Register
                </button>
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="block w-full text-sm text-blue-600 hover:text-blue-500 text-center"
                >
                  Admin Dashboard
                </button>
                <button
                  onClick={() => router.push('/merchant/dashboard')}
                  className="block w-full text-sm text-blue-600 hover:text-blue-500 text-center"
                >
                  Merchant Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
