'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  ClockIcon, 
  ArrowPathIcon,
  TrashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function PerformancePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bundleMetrics, setBundleMetrics] = useState({
    loadTime: 0,
    parseTime: 0,
    executeTime: 0,
    totalSize: 0
  })
  const [bundleAnalysis, setBundleAnalysis] = useState({
    totalSize: 2048000,
    chunkSizes: {
      'main': 1024000,
      'vendor': 512000,
      'pages': 256000,
      'commons': 128000,
      'runtime': 32000
    },
    recommendations: [
      'Consider code splitting for large components',
      'Remove unused dependencies',
      'Optimize images and assets'
    ]
  })
  const [cacheStats, setCacheStats] = useState({
    api: { size: 0, hits: 0, misses: 0, hitRate: 0, maxSize: 1000, strategy: 'LRU' },
    image: { size: 0, hits: 0, misses: 0, hitRate: 0, maxSize: 1000, strategy: 'LRU' },
    user: { size: 0, hits: 0, misses: 0, hitRate: 0, maxSize: 1000, strategy: 'LRU' }
  })
  const [isOptimizing, setIsOptimizing] = useState(false)

  useEffect(() => {
    try {
      // Simulate loading performance data
      const loadPerformanceData = () => {
        try {
          // Simulate bundle metrics
          if (typeof window !== 'undefined' && window.performance) {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
            if (navigation) {
              setBundleMetrics({
                loadTime: (navigation.loadEventEnd || 0) - (navigation.loadEventStart || 0),
                parseTime: (navigation.domContentLoadedEventEnd || 0) - (navigation.domContentLoadedEventStart || 0),
                executeTime: (navigation.domComplete || 0) - (navigation.domContentLoadedEventEnd || 0),
                totalSize: 2048000
              })
            }
          }
          
          setLoading(false)
        } catch (err) {
          console.error('Failed to load performance data:', err)
          setLoading(false)
        }
      }

      // Load data after a short delay
      const timer = setTimeout(loadPerformanceData, 1000)
      return () => clearTimeout(timer)
    } catch (err) {
      console.error('Performance page initialization error:', err)
      setError('Failed to initialize performance monitoring')
      setLoading(false)
    }
  }, [])

  const handleOptimize = async () => {
    setIsOptimizing(true)
    
    try {
      // Clear service worker cache
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        )
      }
      
      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc()
      }
      
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <DashboardLayout userRole={user?.role || 'SJFS_ADMIN'}>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole={user?.role || 'SJFS_ADMIN'}>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Performance Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Reload Page
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={user?.role || 'SJFS_ADMIN'}>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Monitoring</h1>
          <p className="mt-2 text-gray-600">
            Monitor and optimize your application's performance
          </p>
        </div>

        {/* Performance Overview */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{bundleMetrics.loadTime ? bundleMetrics.loadTime.toFixed(2) : '0.00'}ms</div>
                <div className="text-sm text-gray-600">Load Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{bundleMetrics.parseTime ? bundleMetrics.parseTime.toFixed(2) : '0.00'}ms</div>
                <div className="text-sm text-gray-600">Parse Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatBytes(bundleMetrics.totalSize || 0)}</div>
                <div className="text-sm text-gray-600">Bundle Size</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bundle Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Bundle Analysis</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Bundle Size</span>
                <span className="text-sm font-medium">
                  {formatBytes(bundleAnalysis.totalSize)}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Chunk Sizes</h4>
                {Object.entries(bundleAnalysis.chunkSizes).map(([name, size]) => (
                  <div key={name} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{name}</span>
                    <span className="text-sm font-medium">{formatBytes(size)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Recommendations</h4>
                <ul className="space-y-1">
                  {bundleAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <CpuChipIcon className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Bundle Performance</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Load Time</span>
                <span className="text-sm font-medium">
                  {bundleMetrics.loadTime ? bundleMetrics.loadTime.toFixed(2) : '0.00'}ms
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Parse Time</span>
                <span className="text-sm font-medium">
                  {bundleMetrics.parseTime ? bundleMetrics.parseTime.toFixed(2) : '0.00'}ms
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Execute Time</span>
                <span className="text-sm font-medium">
                  {bundleMetrics.executeTime ? bundleMetrics.executeTime.toFixed(2) : '0.00'}ms
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Size</span>
                <span className="text-sm font-medium">
                  {formatBytes(bundleMetrics.totalSize || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cache Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Cache Statistics</h3>
              </div>
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isOptimizing ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                Optimize
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(cacheStats).map(([name, stats]: [string, any]) => (
                <div key={name} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                    {name} Cache
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Size:</span>
                      <span className="ml-2 font-medium">{stats.size}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Max Size:</span>
                      <span className="ml-2 font-medium">{stats.maxSize}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Hit Rate:</span>
                      <span className="ml-2 font-medium">{stats.hitRate ? stats.hitRate.toFixed(1) : '0.0'}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Strategy:</span>
                      <span className="ml-2 font-medium">{stats.strategy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <ArrowPathIcon className="h-6 w-6 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Optimization Tools</h3>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  // Clear all caches
                  console.log('Clearing all caches...')
                }}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Clear All Caches
              </button>

              <button
                onClick={() => {
                  // Preload critical chunks
                  console.log('Preloading critical chunks...')
                }}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Preload Critical Chunks
              </button>

              <button
                onClick={() => {
                  // Force garbage collection if available
                  if ('gc' in window) {
                    (window as any).gc()
                  }
                }}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                <CpuChipIcon className="h-4 w-4 mr-2" />
                Force Garbage Collection
              </button>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Code Splitting</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use dynamic imports for route-based splitting</li>
                <li>• Lazy load non-critical components</li>
                <li>• Split vendor libraries from application code</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Caching</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Implement service worker caching</li>
                <li>• Use HTTP caching headers</li>
                <li>• Cache API responses appropriately</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use next/image for optimization</li>
                <li>• Implement lazy loading</li>
                <li>• Use appropriate image formats</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Bundle Size</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Remove unused dependencies</li>
                <li>• Use tree shaking</li>
                <li>• Minimize and compress assets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

