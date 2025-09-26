'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import DashboardLayout from '@/app/components/dashboard-layout'
import PerformanceDashboard from '@/app/components/performance-dashboard'
import { useBundleAnalysis, useBundlePerformance } from '@/app/lib/bundle-analyzer'
import { cacheManager } from '@/app/lib/cache-manager'
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
  const { analysis: bundleAnalysis, loading: bundleLoading } = useBundleAnalysis()
  const bundleMetrics = useBundlePerformance()
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  useEffect(() => {
    // Get cache statistics
    const updateCacheStats = () => {
      const stats = {
        api: cacheManager.getStats ? cacheManager.getStats() : { size: 0, hits: 0, misses: 0 },
        image: { size: 0, hits: 0, misses: 0 },
        user: { size: 0, hits: 0, misses: 0 }
      }
      setCacheStats(stats)
    }

    updateCacheStats()
    const interval = setInterval(updateCacheStats, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleOptimize = async () => {
    setIsOptimizing(true)
    
    try {
      // Clear expired cache entries
      cacheManager.cleanup()
      // Image cache cleanup placeholder
      // User cache cleanup placeholder
      
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
      
      // Update cache stats
      const stats = {
        api: cacheManager.getStats ? cacheManager.getStats() : { size: 0, hits: 0, misses: 0 },
        image: { size: 0, hits: 0, misses: 0 },
        user: { size: 0, hits: 0, misses: 0 }
      }
      setCacheStats(stats)
      
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

        {/* Performance Dashboard */}
        <div className="mb-8">
          <PerformanceDashboard />
        </div>

        {/* Bundle Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Bundle Analysis</h3>
              </div>
              {bundleLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
            </div>

            {bundleAnalysis && (
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

                {bundleAnalysis.recommendations.length > 0 && (
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
                )}
              </div>
            )}
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
                  {bundleMetrics.loadTime.toFixed(2)}ms
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Parse Time</span>
                <span className="text-sm font-medium">
                  {bundleMetrics.parseTime.toFixed(2)}ms
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Execute Time</span>
                <span className="text-sm font-medium">
                  {bundleMetrics.executeTime.toFixed(2)}ms
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Size</span>
                <span className="text-sm font-medium">
                  {formatBytes(bundleMetrics.totalSize)}
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

            {cacheStats && (
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
                        <span className="ml-2 font-medium">{stats.hitRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Strategy:</span>
                        <span className="ml-2 font-medium">{stats.strategy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  cacheManager.clear()
                  // Image cache clear placeholder
                  // User cache clear placeholder
                }}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Clear All Caches
              </button>

              <button
                onClick={() => {
                  // Preload critical chunks
                  import('@/app/lib/bundle-analyzer').then(({ BundleOptimizer }) => {
                    BundleOptimizer.preloadCriticalChunks()
                  })
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

