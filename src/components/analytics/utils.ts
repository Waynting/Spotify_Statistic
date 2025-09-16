// Utility functions for Analytics

export const formatTimeByWindow = (totalMinutes: number, windowType: string) => {
  const hours = totalMinutes / 60
  const days = hours / 24
  
  switch (windowType) {
    case '7d':
      if (totalMinutes < 60) {
        return { value: `${Math.round(totalMinutes)}分鐘`, subtitle: `${Math.round(hours * 10) / 10}小時` }
      } else if (hours < 24) {
        return { value: `${Math.round(hours * 10) / 10}小時`, subtitle: `${totalMinutes}分鐘` }
      } else {
        return { value: `${Math.round(days * 10) / 10}天`, subtitle: `${Math.round(hours)}小時` }
      }
    case '30d':
      if (hours < 24) {
        return { value: `${Math.round(hours)}小時`, subtitle: `${totalMinutes}分鐘` }
      } else {
        return { value: `${Math.round(days)}天`, subtitle: `${Math.round(hours)}小時` }
      }
    case '90d':
    case '180d':
      if (days < 7) {
        return { value: `${Math.round(days)}天`, subtitle: `${Math.round(hours)}小時` }
      } else {
        return { value: `${Math.round(days / 7)}週`, subtitle: `${Math.round(days)}天` }
      }
    case '365d':
      const weeksInYear = days / 7
      if (weeksInYear < 8) {
        return { value: `${Math.round(weeksInYear)}週`, subtitle: `${Math.round(days)}天` }
      } else {
        const months = days / 30
        return { value: `${Math.round(months)}個月`, subtitle: `${Math.round(weeksInYear)}週` }
      }
    default:
      return { value: `${Math.round(hours)}小時`, subtitle: `${totalMinutes}分鐘` }
  }
}

export const shouldRetry = (error: any, failureCount: number): boolean => {
  if (error?.message?.includes('Failed to fetch') || 
      error?.message?.includes('Network') || 
      error?.message?.includes('timeout')) {
    return failureCount < 3
  }
  
  if (error?.message?.includes('token') || error?.message?.includes('auth')) {
    return failureCount < 1
  }
  
  return failureCount < 2
}

export const getRetryDelay = (attemptIndex: number): number => {
  if (attemptIndex === 0) return 1000 // 1秒
  if (attemptIndex === 1) return 2000 // 2秒  
  if (attemptIndex === 2) return 5000 // 5秒
  return 10000 // 10秒
}

export const shouldRetryForTimeSegments = (error: any, failureCount: number): boolean => {
  if (error?.message?.includes('Failed to fetch') || 
      error?.message?.includes('Network') || 
      error?.message?.includes('timeout')) {
    return failureCount < 3
  }
  
  if (error?.message?.includes('token') || error?.message?.includes('auth')) {
    return failureCount < 1
  }
  
  return failureCount < 2
}