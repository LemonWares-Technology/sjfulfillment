'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface ApiRequestInit extends RequestInit {
  silent?: boolean
}

export function useApi() {
  const [loading, setLoading] = useState(false)

  const request = async <T = any>(
    url: string,
    options: ApiRequestInit = {}
  ): Promise<T> => {
    setLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      })

      const data: ApiResponse<T> = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      if (!data.success) {
        throw new Error(data.error || 'Request failed')
      }

      return data.data as T
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      console.error('API Error:', errorMessage)
      // Only show toast for non-array requests to avoid spam
      if (!options.silent) {
        toast.error(errorMessage)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const get = <T = any>(url: string, options?: ApiRequestInit) => request<T>(url, options)
  
  const post = <T = any>(url: string, data?: any) => 
    request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })

  const put = <T = any>(url: string, data?: any) =>
    request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })

  const del = <T = any>(url: string) =>
    request<T>(url, {
      method: 'DELETE',
    })

  return {
    loading,
    request,
    get,
    post,
    put,
    delete: del,
  }
}
