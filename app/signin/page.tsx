'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SigninPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate login process
    try {
      // TODO: Replace with actual login API call
      // await fetch('/api/auth/signin', { method: 'POST', body: JSON.stringify(formData) })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to dashboard after login
      router.push('/dashboard')
    } catch (error) {
      console.error('Signin error:', error)
      alert('Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignin = () => {
    // TODO: Implement Google OAuth
    router.push('/dashboard')
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white overflow-x-hidden" style={{
      backgroundImage: 'radial-gradient(circle, #f3f4f6 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-gray-200 fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 shadow-sm">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity">
            <svg className="w-6 h-6 text-yellow-DEFAULT" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h8v8l10-12h-8V2z"/>
            </svg>
            <h2 className="text-lg font-semibold">aistoryshorts.com</h2>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="/#features">Features</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="/pricing">Pricing</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="/#blog">Resources</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="/signup">Sign up</a>
          </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-12 lg:py-20 mt-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Side - Signin Form */}
            <div className="w-full">
              <div className="flex items-center gap-2 mb-8">
                <svg className="w-6 h-6 text-yellow-DEFAULT" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h8v8l10-12h-8V2z"/>
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">aistoryshorts.com</h2>
              </div>

              <h1 className="text-4xl font-black text-gray-900 mb-8">Sign in to your account</h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-12 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all no-underline disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-gray-900 font-semibold hover:underline no-underline">
                    Sign up
                  </Link>
                </p>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleSignin}
                disabled={loading}
                variant="outline"
                className="w-full h-12 bg-white border-2 border-gray-300 text-gray-900 font-bold hover:bg-gray-50 transition-all no-underline flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
            </div>

            {/* Right Side - Trust Section */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-12">
              <div className="flex flex-col items-center gap-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-pink-400 shadow-md"
                      style={{
                        backgroundImage: `url(https://i.pravatar.cc/150?img=${i})`,
                        backgroundSize: 'cover'
                      }}
                    />
                  ))}
                </div>
                
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="material-symbols-outlined text-yellow-DEFAULT text-2xl fill-yellow-DEFAULT">star</span>
                  ))}
                </div>
                
                <p className="text-gray-700 font-semibold text-lg">Trusted by 27,000+ creators</p>
                
                <div className="text-center mt-4">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Join Thousands Of Content Creators</h3>
                  <p className="text-gray-600">Who use aistoryshorts.com to create and share their stories.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

