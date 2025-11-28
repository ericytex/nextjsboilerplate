'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trial = searchParams.get('trial') === 'true'
  const planParam = searchParams.get('plan')

  useEffect(() => {
    // If trial=true and plan=basic, auto-trigger checkout
    if (trial && planParam === 'basic') {
      const timer = setTimeout(() => {
        handleCheckout('basic', '/api/checkout/basic')
      }, 500) // Small delay for better UX
      return () => clearTimeout(timer)
    }
  }, [trial, planParam])

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$20',
      buttonText: 'Start Free Trial',
      checkoutUrl: '/api/checkout/basic',
      trialDays: 14,
      highlight: trial && planParam === 'basic',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$40',
      buttonText: 'Choose Pro',
      checkoutUrl: '/api/checkout/pro',
    },
    {
      id: 'business',
      name: 'Business',
      price: '$100',
      buttonText: 'Choose Business',
      checkoutUrl: '/api/checkout/business',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      buttonText: 'Contact Us',
      checkoutUrl: '/contact',
    },
  ]

  const handleCheckout = async (planId: string, checkoutUrl: string) => {
    if (planId === 'enterprise') {
      router.push(checkoutUrl)
      return
    }

    try {
      const response = await fetch(checkoutUrl)
      const data = await response.json()
      
      // Check for errors from API
      if (data.error || !data.url) {
        alert(data.error || 'Checkout URL is not configured. Please set the environment variable in Vercel.')
        return
      }
      
      // Validate URL is not a placeholder
      const placeholderPatterns = [
        'test-link',
        'placeholder',
        'your-actual',
        'your-',
        'example',
        'demo'
      ]
      
      const isPlaceholder = placeholderPatterns.some(pattern => 
        data.url.toLowerCase().includes(pattern)
      )
      
      if (isPlaceholder) {
        alert('Checkout URL appears to be a placeholder. Please set the actual Creem.io checkout URL in Vercel environment variables.')
        return
      }
      
      // Redirect to checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Error initiating checkout. Please try again.')
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Pricing Plans</h1>
          {trial && planParam === 'basic' && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
              <span className="material-symbols-outlined">check_circle</span>
              <span className="font-semibold">14-Day Free Trial - No charge for 14 days</span>
            </div>
          )}
          <p className="text-gray-600">Start your free trial today. No credit card required for the first 14 days.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 flex flex-col transition-all ${
                plan.highlight 
                  ? 'border-yellow-DEFAULT bg-yellow-light scale-105' 
                  : 'border-gray-200'
              }`}
            >
              {plan.highlight && (
                <div className="bg-yellow-DEFAULT text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase text-center mb-4">
                  Recommended
                </div>
              )}
              <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
              <div className="mb-2">
                <div className="text-3xl font-bold text-gray-900">
                  {plan.price}
                </div>
                {plan.trialDays && (
                  <div className="text-sm text-green-600 font-semibold mt-1">
                    {plan.trialDays}-day free trial
                  </div>
                )}
              </div>
              {plan.trialDays && (
                <p className="text-sm text-gray-600 mb-4">
                  Add your card details now, but you won't be charged for {plan.trialDays} days
                </p>
              )}
              <button
                onClick={() => handleCheckout(plan.id, plan.checkoutUrl)}
                className={`mt-auto px-4 py-2 rounded-lg hover:opacity-90 transition text-center w-full font-bold ${
                  plan.highlight
                    ? 'bg-yellow-DEFAULT text-gray-900 hover:bg-yellow-dark'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </main>
    }>
      <PricingContent />
    </Suspense>
  )
}

