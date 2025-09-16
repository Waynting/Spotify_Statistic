import React from 'react'
import { StatsCardProps } from './AnalyticsTypes'

export default function StatsCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color = "text-white" 
}: StatsCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-gray-400 mb-1">{title}</p>
          <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${color} mb-1`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${color.replace('text-', 'text-').replace('white', 'gray-400')} opacity-60`} />
      </div>
    </div>
  )
}