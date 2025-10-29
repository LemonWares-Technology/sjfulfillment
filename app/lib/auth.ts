import jwt from 'jsonwebtoken'
import { cookies as nextCookies } from 'next/headers'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  merchantId?: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export async function getCurrentUser(request: NextRequest): Promise<JWTPayload | null> {
  let token = extractTokenFromRequest(request)
  if (!token) {
    // Try to get token from cookies using next/headers (App Router)
    try {
      const cookies = await nextCookies()
      const cookieToken = cookies.get('token')?.value
      if (cookieToken) token = cookieToken
    } catch {
      // Fallback to request.cookies for edge/runtime
      const cookieToken = request.cookies.get('token')?.value
      if (cookieToken) token = cookieToken
    }
  }
  if (!token) return null
  const user = verifyToken(token)
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    // console.log('Decoded JWT user:', user)
  }
  return user
}
