'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
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
    <div className="relative flex min-h-screen w-full flex-col bg-white overflow-x-hidden" style={{
      backgroundImage: 'radial-gradient(circle, #f3f4f6 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity">
            <svg className="w-6 h-6 text-yellow-DEFAULT" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h8v8l10-12h-8V2z"/>
            </svg>
            <h2 className="text-lg font-semibold">StoryShort.ai</h2>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="/#features">Features</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="/#pricing">Pricing</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="/#blog">Resources</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="#">Sign in</a>
            <Button asChild className="h-9 px-4 bg-yellow-DEFAULT text-gray-900 text-sm font-bold hover:bg-yellow-dark transition-all no-underline">
              <Link href="/pricing?plan=basic&trial=true" className="no-underline">Start Free Trial</Link>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-12 lg:py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Pricing Plans</h1>
            {trial && planParam === 'basic' && (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
                <span className="material-symbols-outlined">check_circle</span>
                <span className="font-semibold">14-Day Free Trial - No charge for 14 days</span>
              </div>
            )}
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start your free trial today. Add your card details now, but you won't be charged for the first 14 days.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 flex flex-col transition-all hover:shadow-xl ${
                  plan.highlight 
                    ? 'border-yellow-DEFAULT bg-yellow-light scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.highlight && (
                  <div className="bg-yellow-DEFAULT text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase text-center mb-4">
                    Recommended
                  </div>
                )}
                <h2 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h2>
                <div className="mb-4">
                  <div className="text-4xl font-black text-gray-900">
                    {plan.price}
                  </div>
                  {plan.trialDays && (
                    <div className="text-sm text-green-600 font-bold mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {plan.trialDays}-day free trial
                    </div>
                  )}
                </div>
                {plan.trialDays && (
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Add your card details now, but you won't be charged for {plan.trialDays} days
                  </p>
                )}
                {!plan.trialDays && plan.id !== 'enterprise' && (
                  <div className="mb-6 flex-1"></div>
                )}
                {plan.id === 'enterprise' && (
                  <div className="mb-6 flex-1">
                    <p className="text-sm text-gray-600">Custom pricing for large teams</p>
                  </div>
                )}
                <Button
                  onClick={() => handleCheckout(plan.id, plan.checkoutUrl)}
                  className={`w-full h-12 font-bold transition-all hover:scale-105 no-underline ${
                    plan.highlight
                      ? 'bg-yellow-DEFAULT text-gray-900 hover:bg-yellow-dark'
                      : plan.id === 'enterprise'
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 mb-4">
              All plans include full access to all features during the trial period.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
                <span>14-day money-back guarantee</span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-12 mt-20">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2024 StoryShort.ai. Create viral videos effortlessly with AI-powered automation.
            </p>
            <p className="text-xs mt-2 text-gray-500">
              Transform your content into engaging videos for TikTok, YouTube, and beyond.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen w-full flex-col bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between py-4 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-yellow-DEFAULT" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h8v8l10-12h-8V2z"/>
              </svg>
              <h2 className="text-lg font-semibold">StoryShort.ai</h2>
            </div>
          </header>
          <main className="flex items-center justify-center h-screen">
            <div className="text-center text-gray-500">Loading...</div>
          </main>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
