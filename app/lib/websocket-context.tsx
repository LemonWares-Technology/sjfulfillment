'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './auth-context'
import { useNotifications } from './notification-context'

interface WebSocketMessage {
  type: 'order_update' | 'stock_alert' | 'payment_received' | 'logistics_update' | 'warehouse_alert' | 'system_notification'
  data: any
  timestamp: string
}

interface WebSocketContextType {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  sendMessage: (message: any) => void
  subscribe: (eventType: string, callback: (data: any) => void) => void
  unsubscribe: (eventType: string, callback: (data: any) => void) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [subscribers, setSubscribers] = useState<Map<string, Set<(data: any) => void>>>(new Map())

  const connect = useCallback(() => {
    if (!user || socket) return

    try {
      setConnectionStatus('connecting')
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/api/ws`
        : `ws://localhost:3000/api/ws`
      
      const newSocket = new WebSocket(wsUrl)
      
      newSocket.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionStatus('connected')
        
        // Send authentication message
        newSocket.send(JSON.stringify({
          type: 'auth',
          token: localStorage.getItem('token'),
          userId: user.id,
          role: user.role,
          merchantId: user.merchantId
        }))
      }

      newSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      newSocket.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        setConnectionStatus('disconnected')
        setSocket(null)
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (user) {
            connect()
          }
        }, 5000)
      }

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
      }

      setSocket(newSocket)
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }, [user, socket])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close()
      setSocket(null)
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }
  }, [socket])

  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Handle different message types
    switch (message.type) {
      case 'order_update':
        handleOrderUpdate(message.data)
        break
      case 'stock_alert':
        handleStockAlert(message.data)
        break
      case 'payment_received':
        handlePaymentReceived(message.data)
        break
      case 'logistics_update':
        handleLogisticsUpdate(message.data)
        break
      case 'warehouse_alert':
        handleWarehouseAlert(message.data)
        break
      case 'system_notification':
        handleSystemNotification(message.data)
        break
    }

    // Notify subscribers
    const callbacks = subscribers.get(message.type)
    if (callbacks) {
      callbacks.forEach(callback => callback(message.data))
    }
  }, [subscribers])

  const handleOrderUpdate = useCallback((data: any) => {
    addNotification({
      title: `Order ${data.orderNumber} Updated`,
      message: `Status changed to ${data.status}`,
      type: 'ORDER',
      data
    })
  }, [addNotification])

  const handleStockAlert = useCallback((data: any) => {
    addNotification({
      title: 'Low Stock Alert',
      message: `${data.productName} is running low (${data.currentStock} remaining)`,
      type: 'STOCK',
      data
    })
  }, [addNotification])

  const handlePaymentReceived = useCallback((data: any) => {
    addNotification({
      title: 'Payment Received',
      message: `Payment of ₦${data.amount.toLocaleString()} received for order ${data.orderNumber}`,
      type: 'PAYMENT',
      data
    })
  }, [addNotification])

  const handleLogisticsUpdate = useCallback((data: any) => {
    addNotification({
      title: 'Logistics Update',
      message: `${data.partnerName} status: ${data.status}`,
      type: 'LOGISTICS',
      data
    })
  }, [addNotification])

  const handleWarehouseAlert = useCallback((data: any) => {
    addNotification({
      title: 'Warehouse Alert',
      message: `${data.warehouseName}: ${data.alert}`,
      type: 'WAREHOUSE',
      data
    })
  }, [addNotification])

  const handleSystemNotification = useCallback((data: any) => {
    addNotification({
      title: data.title,
      message: data.message,
      type: 'SYSTEM',
      data
    })
  }, [addNotification])

  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [socket])

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    setSubscribers(prev => {
      const newSubscribers = new Map(prev)
      if (!newSubscribers.has(eventType)) {
        newSubscribers.set(eventType, new Set())
      }
      newSubscribers.get(eventType)!.add(callback)
      return newSubscribers
    })
  }, [])

  const unsubscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    setSubscribers(prev => {
      const newSubscribers = new Map(prev)
      const callbacks = newSubscribers.get(eventType)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          newSubscribers.delete(eventType)
        }
      }
      return newSubscribers
    })
  }, [])

  // Connect when user is available
  useEffect(() => {
    if (user && !socket) {
      connect()
    } else if (!user && socket) {
      disconnect()
    }
  }, [user, socket, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const value: WebSocketContextType = {
    isConnected,
    connectionStatus,
    sendMessage,
    subscribe,
    unsubscribe
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

// Hook for real-time data updates
export function useRealtimeData<T>(
  eventType: string,
  initialData: T,
  updateCallback: (data: T, newData: any) => T
): [T, boolean] {
  const { isConnected, subscribe, unsubscribe } = useWebSocket()
  const [data, setData] = useState<T>(initialData)

  useEffect(() => {
    const handleUpdate = (newData: any) => {
      setData(prevData => updateCallback(prevData, newData))
    }

    subscribe(eventType, handleUpdate)
    return () => unsubscribe(eventType, handleUpdate)
  }, [eventType, subscribe, unsubscribe, updateCallback])

  return [data, isConnected]
}

