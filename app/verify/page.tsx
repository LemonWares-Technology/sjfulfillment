"use client"
import React from "react";
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { NIGERIA_STATES } from "../data/nigeria-states"
import Image from "next/image"

export default function MerchantVerifyPage() {
  const router = useRouter()
  // Wrap useSearchParams in Suspense boundary
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div></div>}>
      <VerifyPageContent router={router} />
    </React.Suspense>
  );
}

function VerifyPageContent({ router }: { router: ReturnType<typeof useRouter> }) {
  const searchParams: any = useSearchParams();
  const token = searchParams.get("token");
  // ...existing code...

  const [form, setForm] = useState({
    businessName: "",
    businessPhone: "",
    contactPerson: "",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
    cacNumber: "",
    taxId: "",
    firstName: "",
    lastName: "",
    phone: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Track if user has manually edited firstName or lastName
  const [manualFirstName, setManualFirstName] = useState(false)
  const [manualLastName, setManualLastName] = useState(false)
  const [manualPhone, setManualPhone] = useState(false)

  // Countdown state - MUST be declared before any conditional returns
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!token) setError("Invalid or missing verification token.")
  }, [token])

  // Countdown effect
  useEffect(() => {
    if (!success) return

    if (countdown === 0) {
      router.push("/welcome")
      return
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [success, countdown, router])

  const formatPhone = (input: string) => {
    const trimmed = input.trim()
    // Only auto-format if starts with 0 and does not already start with +
    if (trimmed.startsWith("0") && !trimmed.startsWith("+")) {
      return "+234" + trimmed.slice(1)
    }
    return trimmed
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target
    let updatedForm = { ...form, [name]: value }

    if (name === "firstName") setManualFirstName(true)
    if (name === "lastName") setManualLastName(true)
    if (name === "phone") setManualPhone(true)

    // Live autofill personal details from contactPerson unless manually edited
    if (name === "contactPerson") {
      const parts = value.trim().split(/\s+/)
      if (!manualFirstName) updatedForm.firstName = parts[0] || ""
      if (!manualLastName) updatedForm.lastName = parts.length > 1 ? parts.slice(1).join(" ") : ""
    }
    // Live autofill phone in personal details from businessPhone unless manually edited
    if (name === "businessPhone") {
      updatedForm.businessPhone = formatPhone(value)
      if (!manualPhone) updatedForm.phone = formatPhone(value)
    }
    // Always format phone field
    if (name === "phone") {
      updatedForm.phone = formatPhone(value)
    }
    setForm(updatedForm)
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/merchants/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Verification failed")
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="w-full min-h-screen my-5 flex items-center flex-col justify-center text-white bg-[#0A0A0A]">
        <div className="mt-8">
          <Image
            src={`https://sjfulfillment.com/wp-content/uploads/2020/09/cropped-Main-Logo-white-886x.png`}
            loading="lazy"
            alt="SJF Logo"
            height={120}
            width={150}
            className="object-cover"
          />
        </div>
        <div className="w-[500px] max-md:w-[95%] flex flex-col items-center px-4 py-3 rounded-[5px] bg-white/10 h-auto mt-10">
          <h2 className="text-2xl font-bold mb-2 text-[#f08c17]">Invalid Verification Link</h2>
          <p className="text-gray-300">The verification link is invalid or expired.</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="w-full min-h-screen flex items-center flex-col justify-center text-white bg-[#0A0A0A]">
        <div className="mt-8">
          <Image
            src={`https://sjfulfillment.com/wp-content/uploads/2020/09/cropped-Main-Logo-white-886x.png`}
            loading="lazy"
            alt="SJF Logo"
            height={120}
            width={150}
            className="object-cover"
          />
        </div>
        <div className="w-[500px] max-md:w-[95%] flex flex-col items-center px-4 py-3 rounded-[5px] bg-white/10 h-auto mt-10">
          <h2 className="text-2xl font-bold mb-2 text-green-500">Account Verified!</h2>
          <p className="text-gray-300 mb-4">Your account has been successfully verified. You can now login to your dashboard.</p>
          <div className="text-lg font-semibold text-[#f08c17] mb-2">Redirecting to login in {countdown} seconds...</div>
          <button
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-medium py-2 px-4 rounded-[5px] mt-2"
            onClick={() => router.push("/welcome")}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex items-center flex-col justify-center text-white bg-[#0A0A0A]">
      <div className="mt-8">
        <Image
          src={`https://sjfulfillment.com/wp-content/uploads/2020/09/cropped-Main-Logo-white-886x.png`}
          loading="lazy"
          alt="SJF Logo"
          height={120}
          width={150}
          className="object-cover"
        />
      </div>
      <div className="w-[500px] max-md:w-[95%] flex flex-col items-center px-4 py-3 rounded-[5px] bg-white/10 h-auto mt-10">
        <h2 className="text-2xl font-bold mb-4 text-[#f08c17]">Merchant Verification</h2>
        <p className="mb-6 text-gray-300">Please fill in your business and personal details to activate your account.</p>
        {error && <div className="mb-4 text-red-500 font-medium">{error}</div>}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input name="businessName" value={form.businessName} onChange={handleChange} required placeholder="Business Name" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
            <input name="businessPhone" value={form.businessPhone} onChange={handleChange} required placeholder="Business Phone" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} required placeholder="Contact Person" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
            <input name="address" value={form.address} onChange={handleChange} required placeholder="Business Address" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
            <input name="city" value={form.city} onChange={handleChange} required placeholder="City" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
            <select
              name="state"
              value={form.state}
              onChange={handleChange}
              required
              className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] focus:outline-none focus:border-[#F08C17] focus:bg-white/10"
            >
              <option value="">Select State</option>
              {NIGERIA_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <input name="country" value={form.country} onChange={handleChange} required placeholder="Country" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
            <input name="cacNumber" value={form.cacNumber} onChange={handleChange} required placeholder="CAC Number" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
            <input name="taxId" value={form.taxId} onChange={handleChange} required placeholder="Tax ID" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
          </div>
          <h3 className="text-lg font-bold mb-2 mt-4">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="First Name" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
            <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Last Name" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
            <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Phone" className="border-[#F08C17] border bg-white/5 px-3 py-2 rounded-[5px] text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10" />
          </div>
          <button type="submit" disabled={submitting} className="rounded-[5px] text-black tracking-wide font-semibold w-full h-[40px] bg-[#F08C17] mt-3 hover:cursor-pointer hover:bg-[#ff9b2a] transition-all ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {submitting ? "Verifying..." : "Activate Account"}
          </button>
        </form>
      </div>
    </div>
  )
}