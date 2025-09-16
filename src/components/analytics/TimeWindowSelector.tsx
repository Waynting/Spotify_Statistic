import React, { useRef, useEffect } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { TimeWindowOption } from './AnalyticsTypes'

interface TimeWindowSelectorProps {
  selectedWindow: string
  onWindowChange: (window: string) => void
  isMenuOpen: boolean
  onMenuToggle: () => void
  timeWindows: TimeWindowOption[]
}

export default function TimeWindowSelector({
  selectedWindow,
  onWindowChange,
  isMenuOpen,
  onMenuToggle,
  timeWindows
}: TimeWindowSelectorProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onMenuToggle()
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen, onMenuToggle])

  return (
    <div className="mb-8">
      {/* Desktop/平板版本 */}
      <div className="hidden sm:flex flex-wrap gap-3">
        {timeWindows.map((window) => (
          <button
            key={window.value}
            onClick={() => onWindowChange(window.value)}
            className={`
              px-4 py-2 rounded-lg transition-all duration-200 text-sm
              ${selectedWindow === window.value
                ? 'bg-white text-black shadow-lg transform scale-105'
                : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
              }
            `}
          >
            <div className="font-medium">{window.label}</div>
            <div className="text-xs opacity-75">{window.description}</div>
          </button>
        ))}
      </div>

      {/* 手機版本 - 下拉選單 */}
      <div className="sm:hidden relative" ref={menuRef}>
        <button
          onClick={onMenuToggle}
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white hover:bg-gray-800 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium text-sm">
                  {timeWindows.find(w => w.value === selectedWindow)?.label}
                </div>
                <div className="text-xs text-gray-400">
                  {timeWindows.find(w => w.value === selectedWindow)?.description}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
              isMenuOpen ? 'rotate-180' : ''
            }`} />
          </div>
        </button>

        {/* 下拉選項 */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-40 max-h-60 overflow-y-auto">
            {timeWindows.map((window) => (
              <button
                key={window.value}
                onClick={() => {
                  onWindowChange(window.value)
                  onMenuToggle()
                }}
                className={`
                  w-full p-3 text-left hover:bg-gray-800 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl
                  ${selectedWindow === window.value ? 'bg-gray-800' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-300" />
                  <div>
                    <div className="font-medium text-white text-sm">{window.label}</div>
                    <div className="text-xs text-gray-400">{window.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}