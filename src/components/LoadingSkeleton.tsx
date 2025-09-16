import React from 'react'

interface LoadingSkeletonProps {
  className?: string
  children?: React.ReactNode
  'aria-label'?: string
}

export function LoadingSkeleton({ className = '', children, 'aria-label': ariaLabel }: LoadingSkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gray-700/50 rounded ${className}`}
      role="status"
      aria-label={ariaLabel || '載入中'}
    >
      {children}
      <span className="sr-only">載入中...</span>
    </div>
  )
}

export function AlbumListSkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden" role="status" aria-label="載入專輯列表">
      <div className="p-4 md:p-6 border-b border-gray-800">
        <LoadingSkeleton className="h-6 w-48" />
      </div>
      
      <div className="divide-y divide-gray-800">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Ranking */}
              <LoadingSkeleton className="w-8 md:w-12 h-6 md:h-8" />
              
              {/* Album cover */}
              <LoadingSkeleton className="w-12 h-12 md:w-16 md:h-16 rounded-lg" />
              
              {/* Album info */}
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-5 w-full max-w-xs" />
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <LoadingSkeleton className="h-4 w-20" />
                  <LoadingSkeleton className="h-4 w-16" />
                  <LoadingSkeleton className="h-4 w-24" />
                </div>
              </div>
              
              {/* Play button */}
              <LoadingSkeleton className="w-10 h-10 md:w-12 md:h-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">正在載入專輯列表，請稍候</span>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="status" aria-label="載入統計數據">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-gray-900 rounded-lg p-4 md:p-6">
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="w-10 h-10 md:w-12 md:h-12 rounded-lg" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-6 md:h-8 w-16" />
              <LoadingSkeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">正在載入統計數據，請稍候</span>
    </div>
  )
}

export function ChartSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 md:p-6" role="status" aria-label={`載入${title}`}>
      <LoadingSkeleton className="h-6 w-32 mb-4" />
      <LoadingSkeleton className="h-48 md:h-64 w-full rounded" />
      <span className="sr-only">正在載入{title}，請稍候</span>
    </div>
  )
}

export default LoadingSkeleton