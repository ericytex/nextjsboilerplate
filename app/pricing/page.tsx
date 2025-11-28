'use client'

import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const router = useRouter()

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$20',
      buttonText: 'Choose Basic',
      checkoutUrl: '/api/checkout/basic',
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
        <h1 className="text-4xl font-bold text-center mb-12">Pricing Plans</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex flex-col"
            >
              <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
              <div className="text-3xl font-bold mb-2 text-gray-900">
                {plan.price}
              </div>
              <button
                onClick={() => handleCheckout(plan.id, plan.checkoutUrl)}
                className="mt-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center w-full"
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

