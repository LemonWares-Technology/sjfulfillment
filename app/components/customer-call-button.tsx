'use client'
import React, { useState } from 'react'
import { PhoneIcon } from '@heroicons/react/24/outline'
import CallModal from './call-modal'


interface CustomerCallButtonProps {
  customer: {
    id: string
    name: string
    phone: string
    email: string
  }
  className?: string
  orderNumber?: string
}

export default function CustomerCallButton({ customer, className, orderNumber }: CustomerCallButtonProps) {
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)

  const handleStartCall = () => {
    setIsCallModalOpen(true)
  }

  const handleEndCall = () => {
    setIsCallModalOpen(false)
  }

  const getCallTitle = () => {
    const orderInfo = orderNumber ? ` (Order #${orderNumber})` : ''
    return `Start Audio Call with ${customer.name}${orderInfo}`
  }

  return (
    <>
      <button
        onClick={handleStartCall}
        className={`p-2 rounded-full bg-green-500 hover:bg-green-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${className || ''}`}
        title={getCallTitle()}
      >
        <PhoneIcon className="h-5 w-5" />
      </button>
      {isCallModalOpen && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={handleEndCall}
          callType={'audio'}
          contactInfo={{
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            role: orderNumber ? `Customer (Order #${orderNumber})` : 'Customer'
          }}
        />
      )}
    </>
  )
}
