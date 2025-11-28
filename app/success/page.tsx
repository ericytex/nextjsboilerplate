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

  // Set session flag when payment is successful
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_session', 'true')
      localStorage.setItem('has_visited_dashboard', 'true')
    }
  }, [])

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
          {trial && isBasicPlan ? 'Free Trial Started!' : 'Payment Successful'}
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Plan: <span className="font-semibold capitalize">{plan}</span>
        </p>
        {trial && isBasicPlan && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-semibold mb-2">
              🎉 Your 14-Day Free Trial is Active!
            </p>
            <p className="text-sm text-green-700">
              Your card has been saved but you won't be charged for 14 days. Enjoy full access to all Basic plan features!
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

