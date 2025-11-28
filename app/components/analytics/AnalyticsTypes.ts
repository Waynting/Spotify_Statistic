import { LucideIcon } from 'lucide-react'

// Types for Analytics components
export interface StatsCardProps {
  icon: LucideIcon
  title: string
  value: string
  subtitle?: string
  color?: string
}

export interface TimeWindowOption {
  value: string
  label: string
  description: string
}