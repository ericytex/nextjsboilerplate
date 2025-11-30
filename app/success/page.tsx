'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan') || 'unknown'
  const trial = searchParams.get('trial') === 'true'
  const isBasicPlan = plan === 'basic'
  const isFreePlan = plan === 'free'

  // Set session flag when payment is successful
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_session', 'true')
      localStorage.setItem('has_visited_dashboard', 'true')
    }
  }, [])

  // Track free plan signup
  useEffect(() => {
    if (isFreePlan && typeof window !== 'undefined') {
      const userId = localStorage.getItem('user_id')
      const userEmail = localStorage.getItem('user_email')
      
      // Track free plan signup
      fetch('/api/track-free-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          email: userEmail,
          plan: 'free'
        })
      }).catch(error => {
        console.error('Failed to track free plan signup:', error)
        // Don't show error to user - tracking is non-critical
      })
    }
  }, [isFreePlan])

  // Automatically redirect to dashboard after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000) // 3 second delay

    return () => clearTimeout(timer)
  }, [router])

  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4 text-green-600">
          {isFreePlan ? 'Welcome!' : trial && isBasicPlan ? 'Free Trial Started!' : 'Payment Successful'}
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Plan: <span className="font-semibold capitalize">{plan}</span>
        </p>
        {isFreePlan && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-semibold mb-2">
              🎉 Your Free Plan is Active!
            </p>
            <p className="text-sm text-green-700">
              Your free plan is active. We&apos;re covering the cost for you! Enjoy full access to all free plan features.
            </p>
          </div>
        )}
        {trial && isBasicPlan && !isFreePlan && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-semibold mb-2">
              🎉 Your 14-Day Free Trial is Active!
            </p>
            <p className="text-sm text-green-700">
              Your card has been saved but you won&apos;t be charged for 14 days. Enjoy full access to all Basic plan features!
            </p>
          </div>
        )}
        <p className="text-sm text-gray-500 mb-6">
          Redirecting to your dashboard in a few seconds...
        </p>
        <div className="mt-8 space-x-4">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard Now
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}

