import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount)
}

export function formatNumber(
  number: number,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(number)
}

export function formatPercent(
  number: number,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(number / 100)
}

export function formatDateTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(new Date(date))
}

export function getRelativeTime(date: Date | string | number) {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((past.getTime() - now.getTime()) / 1000)

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, "second")
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, "minute")
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, "hour")
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, "day")
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, "month")
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return rtf.format(diffInYears, "year")
}

export function truncateAddress(address: string, start = 6, end = 4) {
  if (address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand("copy")
      document.body.removeChild(textArea)
      return Promise.resolve()
    } catch (err) {
      document.body.removeChild(textArea)
      return Promise.reject(err)
    }
  }
}

export function generateRandomId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
) {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
) {
  let inThrottle: boolean
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)
}

export function calculateRiskReward(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
) {
  const risk = Math.abs(entryPrice - stopLoss)
  const reward = Math.abs(takeProfit - entryPrice)
  return risk > 0 ? reward / risk : 0
}

export function calculatePositionSize(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLoss: number
) {
  const riskAmount = accountBalance * (riskPercentage / 100)
  const riskPerShare = Math.abs(entryPrice - stopLoss)
  return riskPerShare > 0 ? riskAmount / riskPerShare : 0
}

export function getSignalColor(signal: string) {
  switch (signal?.toUpperCase()) {
    case "STRONG_BUY":
      return "text-green-600 dark:text-green-400"
    case "BUY":
      return "text-green-500"
    case "HOLD":
      return "text-yellow-500"
    case "SELL":
      return "text-red-500"
    case "STRONG_SELL":
      return "text-red-600 dark:text-red-400"
    default:
      return "text-gray-500"
  }
}

export function getSignalBgColor(signal: string) {
  switch (signal?.toUpperCase()) {
    case "STRONG_BUY":
      return "bg-green-600"
    case "BUY":
      return "bg-green-500"
    case "HOLD":
      return "bg-yellow-500"
    case "SELL":
      return "bg-red-500"
    case "STRONG_SELL":
      return "bg-red-600"
    default:
      return "bg-gray-500"
  }
}