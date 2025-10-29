
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApi } from '@/app/lib/use-api'
import Image from 'next/image'
import { LockClosedIcon } from '@heroicons/react/24/outline'

export default function MerchantRegisterPage() {
  const router = useRouter()
  const { post, loading } = useApi()
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Live confirm password validation
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm({ ...form, confirmPassword: value });
    if (form.password && value !== form.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else {
      setErrors((prev) => {
        const { confirmPassword, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!form.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format'
    if (!form.password) newErrors.password = 'Password is required'
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await post('/api/merchants/register-public', {
        email: form.email,
        password: form.password
      })
  router.push('/merchant-registration-pending')
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' })
    }
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
      <div className="my-5" />
      <div className="w-[500px] max-md:w-[95%] flex flex-col items-center px-4 py-3 rounded-[5px] bg-white/10 h-auto">
        <div className="text-2xl tracking-wide font-semibold mb-3">Create Merchant Account</div>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="w-full">
            <input 
              type="email" 
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              disabled={loading}
              className="w-full h-[40px] border-[#F08C17] border rounded-[5px] bg-white/5 px-3 text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" 
              placeholder="Enter email address" 
            />
            <div className="h-[12px]">
              {errors.email && (
                <div className="text-[12px] flex justify-end text-white">{errors.email}</div>
              )}
            </div>
          </div>
          <div className="w-full mt-3">
            <input 
              type="password" 
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              disabled={loading}
              className="w-full h-[40px] border-[#F08C17] border rounded-[5px] bg-white/5 px-3 text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" 
              placeholder="Enter password" 
            />
            <div className="h-[12px]">
              {errors.password && (
                <div className="text-[12px] flex justify-end text-white">{errors.password}</div>
              )}
            </div>
          </div>
          <div className="w-full mt-3">
            <input 
              type="password" 
              value={form.confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={loading}
              className="w-full h-[40px] border-[#F08C17] border rounded-[5px] bg-white/5 px-3 text-[#F08C17] placeholder:text-[#F08C17]/60 focus:outline-none focus:border-[#F08C17] focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" 
              placeholder="Confirm password" 
            />
            <div className="h-[12px]">
              {errors.confirmPassword && (
                <div className="text-[12px] flex justify-end text-white">{errors.confirmPassword}</div>
              )}
            </div>
          </div>
          {errors.submit && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-[5px]">
              <p className="text-red-600">{errors.submit}</p>
            </div>
          )}
          <button 
            type="submit"
            disabled={loading}
            className="rounded-[5px] text-black tracking-wide font-semibold w-full h-[40px] bg-[#F08C17] mt-3 hover:cursor-pointer hover:bg-[#ff9b2a] transition-all ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
          <div className="mt-3 text-center">
            Already have an account?{' '}
            <a href="/welcome" className="text-[#F08C17] hover:cursor-pointer hover:underline">
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
