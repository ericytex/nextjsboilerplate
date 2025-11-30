'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SessionTracker() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (typeof window !== 'undefined') {
      const userSession = localStorage.getItem('user_session')
      const userId = localStorage.getItem('user_id')

      if (!userSession || !userId || userSession !== 'true') {
        // User is not authenticated, redirect to signin
        router.push('/signin?redirect=/dashboard')
        return
      }

      // Set flag when user visits dashboard
      localStorage.setItem('has_visited_dashboard', 'true')
    }
  }, [router])

  return null
}

