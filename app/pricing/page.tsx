'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense, useState } from 'react'

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trial = searchParams.get('trial') === 'true'
  const planParam = searchParams.get('plan')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

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
      price: billingCycle === 'monthly' ? '$20' : '$200',
      priceNote: billingCycle === 'yearly' ? '$16.67/month' : '/month',
      videosPerMonth: 40,
      credits: 400,
      series: 1,
      buttonText: 'Start Free Trial',
      checkoutUrl: '/api/checkout/basic',
      trialDays: 14,
      highlight: trial && planParam === 'basic',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? '$40' : '$400',
      priceNote: billingCycle === 'yearly' ? '$33.33/month' : '/month',
      videosPerMonth: 120,
      credits: 1200,
      series: 2,
      buttonText: 'Choose Pro',
      checkoutUrl: '/api/checkout/pro',
      trialDays: 14,
      highlight: false,
    },
    {
      id: 'business',
      name: 'Business',
      price: billingCycle === 'monthly' ? '$100' : '$1000',
      priceNote: billingCycle === 'yearly' ? '$83.33/month' : '/month',
      videosPerMonth: 240,
      credits: 2400,
      series: 3,
      buttonText: 'Choose Business',
      checkoutUrl: '/api/checkout/business',
      trialDays: 14,
      highlight: false,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null,
      priceNote: '',
      videosPerMonth: 500,
      credits: 5000,
      series: 4,
      buttonText: 'Contact Us',
      checkoutUrl: '/contact',
      trialDays: 0,
      highlight: false,
    },
  ]

  const features = [
    'Voiceovers',
    'AI generated content',
    'Background music',
    'No watermark',
    'Auto-publish on TikTok and Youtube'
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
              <Link href="/signup" className="no-underline">Start Free Trial</Link>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-12 lg:py-20">
          {/* Top Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Pick up the plan that fits your needs
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Get 2 months free on yearly pricing. You can cancel your subscription at anytime.
            </p>

            {/* Trust Section */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                {/* Avatar Row */}
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-pink-400 shadow-md"
                      style={{
                        backgroundImage: `url(https://i.pravatar.cc/150?img=${i})`,
                        backgroundSize: 'cover'
                      }}
                    />
                  ))}
                </div>
                
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="material-symbols-outlined text-yellow-DEFAULT text-xl fill-yellow-DEFAULT">star</span>
                  ))}
                </div>
              </div>
              
              <p className="text-gray-700 font-semibold">Trusted by 27,000+ creators</p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yearly
              </button>
            </div>

            {trial && planParam === 'basic' && (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
                <span className="material-symbols-outlined">check_circle</span>
                <span className="font-semibold">14-Day Free Trial - No charge for 14 days</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl shadow-lg p-6 border-2 flex flex-col transition-all hover:shadow-xl ${
                  plan.highlight 
                    ? 'border-gray-800 bg-gray-900 text-white' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h2 className={`text-2xl font-black mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h2>
                
                <div className="mb-6">
                  {plan.id !== 'enterprise' ? (
                    <>
                      <div className={`text-4xl font-black mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                        {plan.price}
                      </div>
                      {plan.priceNote && (
                        <div className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                          {plan.priceNote}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={`text-lg font-semibold ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                      Custom pricing for your needs
                    </div>
                  )}
                  
                  {/* Plan Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>Videos per month</span>
                      <span className={`font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.videosPerMonth}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>Credits</span>
                      <span className={`font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.credits.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>Series</span>
                      <span className={`font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.series}</span>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="flex-1 mb-6">
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-lg ${
                          plan.highlight ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          check_circle
                        </span>
                        <span className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-700'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trial Info */}
                {plan.trialDays && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    plan.highlight ? 'bg-gray-800' : 'bg-green-50'
                  }`}>
                    <p className={`text-xs font-semibold ${
                      plan.highlight ? 'text-green-400' : 'text-green-700'
                    }`}>
                      {plan.trialDays}-day free trial
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => plan.id !== 'enterprise' ? handleCheckout(plan.id, plan.checkoutUrl) : router.push('/contact')}
                  className={`w-full h-12 font-bold transition-all hover:scale-105 no-underline ${
                    plan.highlight
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : plan.id === 'enterprise'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
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
