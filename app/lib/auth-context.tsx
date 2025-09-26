'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SJFS_ADMIN' | 'MERCHANT_ADMIN' | 'MERCHANT_STAFF' | 'WAREHOUSE_STAFF'
  merchantId?: string
  merchant?: {
    id: string
    businessName: string
    onboardingStatus: string
  }
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      fetchUserProfile(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.data)
      } else {
        localStorage.removeItem('token')
        setToken(null)
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      localStorage.removeItem('token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()
    const { user: userData, token: authToken } = data.data

    setUser(userData)
    setToken(authToken)
    localStorage.setItem('token', authToken)

    // Redirect based on user role
    switch (userData.role) {
      case 'SJFS_ADMIN':
        router.push('/admin/dashboard')
        break
      case 'MERCHANT_ADMIN':
        // Check if merchant has selected services
        if (userData.merchantId) {
          try {
            const servicesResponse = await fetch('/api/merchant-services/status', {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            })
            
            if (servicesResponse.ok) {
              const servicesData = await servicesResponse.json()
              // If no services selected, redirect to service selection
              if (!servicesData.data.hasServices) {
                router.push('/service-selection')
              } else {
                router.push('/merchant/dashboard')
              }
            } else {
              // If error checking services, redirect to service selection
              router.push('/service-selection')
            }
          } catch (error) {
            // If error checking services, redirect to service selection
            router.push('/service-selection')
          }
        } else {
          router.push('/merchant/dashboard')
        }
        break
      case 'MERCHANT_STAFF':
        router.push('/staff/dashboard')
        break
      case 'WAREHOUSE_STAFF':
        router.push('/warehouse/dashboard')
        break
      default:
        router.push('/dashboard')
    }
  }

  const logout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    }

    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    router.push('/welcome')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
