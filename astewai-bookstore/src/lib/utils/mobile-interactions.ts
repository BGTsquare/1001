/**
 * Enhanced mobile interactions and gesture handling
 */

import { useEffect, useRef, useState } from 'react'

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
}

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

/**
 * Hook for handling swipe gestures
 */
export function useSwipeGesture(
  onSwipe: (gesture: SwipeGesture) => void,
  options: {
    minDistance?: number
    minVelocity?: number
    maxDuration?: number
  } = {}
) {
  const {
    minDistance = 50,
    minVelocity = 0.3,
    maxDuration = 1000
  } = options

  const startPoint = useRef<TouchPoint | null>(null)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      startPoint.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startPoint.current) return

      const touch = e.changedTouches[0]
      const endPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      }

      const deltaX = endPoint.x - startPoint.current.x
      const deltaY = endPoint.y - startPoint.current.y
      const duration = endPoint.timestamp - startPoint.current.timestamp
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const velocity = distance / duration

      if (distance >= minDistance && velocity >= minVelocity && duration <= maxDuration) {
        let direction: SwipeGesture['direction']
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left'
        } else {
          direction = deltaY > 0 ? 'down' : 'up'
        }

        onSwipe({
          direction,
          distance,
          velocity,
          duration
        })
      }

      startPoint.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipe, minDistance, minVelocity, maxDuration])

  return elementRef
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: {
    threshold?: number
    resistance?: number
  } = {}
) {
  const { threshold = 80, resistance = 2.5 } = options
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef<number>(0)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing) return

      const currentY = e.touches[0].clientY
      const deltaY = currentY - startY.current

      if (deltaY > 0) {
        const distance = Math.min(deltaY / resistance, threshold * 1.5)
        setPullDistance(distance)
        
        if (distance > threshold) {
          // Add haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(10)
          }
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance > threshold && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
      setPullDistance(0)
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh, threshold, resistance, pullDistance, isRefreshing])

  return {
    elementRef,
    isRefreshing,
    pullDistance,
    shouldShowRefreshIndicator: pullDistance > threshold * 0.8
  }
}

/**
 * Hook for infinite scroll functionality
 */
export function useInfiniteScroll(
  onLoadMore: () => Promise<void>,
  options: {
    threshold?: number
    hasMore?: boolean
  } = {}
) {
  const { threshold = 200, hasMore = true } = options
  const [isLoading, setIsLoading] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || !hasMore) return

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } = element
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      if (distanceFromBottom < threshold && !isLoading) {
        setIsLoading(true)
        try {
          await onLoadMore()
        } finally {
          setIsLoading(false)
        }
      }
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => element.removeEventListener('scroll', handleScroll)
  }, [onLoadMore, threshold, hasMore, isLoading])

  return { elementRef, isLoading }
}

/**
 * Mobile-optimized touch feedback
 */
export function addTouchFeedback(element: HTMLElement) {
  const handleTouchStart = () => {
    element.style.transform = 'scale(0.98)'
    element.style.opacity = '0.8'
    element.style.transition = 'transform 0.1s ease, opacity 0.1s ease'
  }

  const handleTouchEnd = () => {
    element.style.transform = 'scale(1)'
    element.style.opacity = '1'
  }

  element.addEventListener('touchstart', handleTouchStart, { passive: true })
  element.addEventListener('touchend', handleTouchEnd, { passive: true })
  element.addEventListener('touchcancel', handleTouchEnd, { passive: true })

  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchend', handleTouchEnd)
    element.removeEventListener('touchcancel', handleTouchEnd)
  }
}

/**
 * Detect mobile device capabilities
 */
export function getMobileCapabilities() {
  if (typeof window === 'undefined') return {}

  return {
    hasTouch: 'ontouchstart' in window,
    hasHover: window.matchMedia('(hover: hover)').matches,
    hasPointerFine: window.matchMedia('(pointer: fine)').matches,
    supportsVibration: 'vibrate' in navigator,
    supportsDeviceMotion: 'DeviceMotionEvent' in window,
    supportsDeviceOrientation: 'DeviceOrientationEvent' in window,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    screenSize: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }
}
