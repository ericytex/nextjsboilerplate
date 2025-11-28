'use client'

import { useEffect } from 'react'

export function SessionTracker() {
  useEffect(() => {
    // Set flag when user visits dashboard
    if (typeof window !== 'undefined') {
      localStorage.setItem('has_visited_dashboard', 'true')
    }
  }, [])

  return null
}

