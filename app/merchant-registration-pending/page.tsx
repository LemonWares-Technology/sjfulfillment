'use client'

import { EnvelopeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function MerchantRegistrationPendingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <EnvelopeIcon className="mx-auto h-16 w-16 text-[#f08c17] mb-4" />
          <h1 className="text-3xl font-bold text-gray-200 mb-2">
            Account Created!
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            Your merchant account has been created.<br />
            Please check your email inbox (or spam folder) for a verification link to continue your registration.
          </p>
        </div>
        <div className="bg-white/30 rounded-[5px] shadow-lg p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-200">Next step: Email verification</h3>
            <p className="text-gray-200 text-sm mt-1">
              Click the link in your email to verify your account and continue with your business details.
            </p>
          </div>
        </div>
        <div className="text-center space-y-4">
          <Link
            href="/welcome"
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-medium py-3 px-4 rounded-[5px] inline-block"
          >
            Back to Login
          </Link>
          <p className="text-sm text-gray-200">
            Didn't get the email?{' '}
            <a href="mailto:support@sjfulfillment.com" className="text-amber-600 hover:text-amber-700">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
