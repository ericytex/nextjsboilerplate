'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan') || 'unknown'
  const isFree = plan === 'free'

  // Track free plan signup (business will be charged)
  useEffect(() => {
    if (isFree) {
      fetch('/api/track-free-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'free', timestamp: new Date().toISOString() }),
      }).catch((error) => {
        console.error('Failed to track free signup:', error)
      })
    }
  }, [isFree])

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
        <h1 className={`text-4xl font-bold mb-4 ${isFree ? 'text-blue-600' : 'text-green-600'}`}>
          {isFree ? 'Welcome!' : 'Payment Successful'}
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Plan: <span className="font-semibold capitalize">{plan}</span>
        </p>
        {isFree && (
          <p className="text-sm text-gray-500 mb-4 italic">
            Your free plan is active. We're covering the cost for you!
          </p>
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

