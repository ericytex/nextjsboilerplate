'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white overflow-x-hidden" style={{
      backgroundImage: 'radial-gradient(circle, #f3f4f6 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity">
            <svg className="w-6 h-6 text-yellow-DEFAULT" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h8v8l10-12h-8V2z"/>
            </svg>
            <h2 className="text-lg font-semibold">StoryShort</h2>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="#pricing">Pricing</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="#">Blog</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline relative transition-colors" href="#">
              Affiliate Program
              <span className="absolute -top-1 -right-8 bg-yellow-DEFAULT text-yellow-dark text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">New</span>
            </a>
            <button className="text-gray-700 hover:text-gray-900 transition-colors">
              <span className="material-symbols-outlined text-xl">light_mode</span>
            </button>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="#">Sign in</a>
            <Button asChild className="h-9 px-4 bg-white border border-gray-300 text-gray-900 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all no-underline">
              <Link href="/pricing" className="no-underline">Get Started</Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className={`flex flex-col gap-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Powered by GPT-5 Badge */}
              <div className="inline-flex items-center gap-2 bg-yellow-light text-gray-700 px-4 py-2 rounded-lg w-fit hover:bg-yellow-DEFAULT/20 transition-colors cursor-default">
                <svg className="w-4 h-4 text-yellow-DEFAULT" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h8v8l10-12h-8V2z"/>
                </svg>
                <span className="text-sm font-medium">Powered by GPT-5</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] text-gray-900">
                Create <span className="text-yellow-DEFAULT">viral</span> <span className="text-yellow-DEFAULT">faceless videos</span> on Auto-Pilot.
              </h1>

              {/* Subheadline */}
              <p className="text-lg lg:text-xl text-gray-600 max-w-xl leading-relaxed">
                Generate AI Videos in minutes. Our AI creation tool crafts viral AI videos for you.
              </p>

              {/* CTA Button */}
              <Button asChild className="w-fit h-12 px-8 bg-yellow-DEFAULT text-gray-900 text-base font-bold hover:bg-yellow-dark hover:scale-105 transition-all shadow-lg hover:shadow-xl no-underline group">
                <Link href="/pricing" className="no-underline flex items-center gap-2">
                  Get Started
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </Button>
            </div>

            {/* Right Side - Video Preview Cards */}
            <div className="relative h-[500px] lg:h-[600px] hidden lg:block">
              {/* Back Card */}
              <div className={`absolute right-0 top-20 w-64 h-80 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl shadow-2xl transform rotate-6 overflow-hidden transition-all duration-700 hover:scale-105 hover:rotate-3 hover:shadow-3xl ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="font-bold text-lg mb-1 drop-shadow-lg">REACHED THE</div>
                    <div className="text-sm drop-shadow-md">day Apollo 11 landed on the moon</div>
                  </div>
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">play_circle</span>
                  </div>
                </div>
              </div>
              
              {/* Middle Card */}
              <div className={`absolute right-8 top-10 w-64 h-80 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl transform -rotate-3 overflow-hidden z-10 transition-all duration-700 hover:scale-105 hover:-rotate-1 hover:shadow-3xl ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`} style={{ transitionDelay: '100ms' }}>
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="font-bold text-lg mb-1 drop-shadow-lg">trapped climbers</div>
                    <div className="text-sm drop-shadow-md">saddest story on Everest</div>
                  </div>
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">play_circle</span>
                  </div>
                </div>
              </div>
              
              {/* Front Card */}
              <div className={`absolute right-16 top-0 w-64 h-80 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-2xl shadow-2xl transform rotate-3 overflow-hidden z-20 transition-all duration-700 hover:scale-105 hover:rotate-5 hover:shadow-3xl ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`} style={{ transitionDelay: '200ms' }}>
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="font-bold text-lg mb-1 drop-shadow-lg">HAD AN</div>
                    <div className="text-sm drop-shadow-md">The Cleopatra Effect</div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-red-400 text-xl">favorite</span>
                      <span className="text-xs">2.5M views</span>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">play_circle</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Section */}
          <div className={`mt-16 lg:mt-24 flex flex-col items-center gap-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '300ms' }}>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {/* Avatar Row */}
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-pink-400 hover:scale-110 transition-transform cursor-pointer shadow-md"
                    style={{
                      backgroundImage: `url(https://i.pravatar.cc/150?img=${i})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
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
            
            <p className="text-gray-700 font-semibold text-lg">Trusted by 27,000+ creators</p>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-4xl lg:text-5xl font-black leading-tight text-gray-900">
                Everything You Need to Create Viral Videos
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Say goodbye to boring videos. Get started with StoryShort.ai today and start creating engaging videos for TikTok and YouTube on autopilot.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { icon: 'smart_toy', title: 'AI-Driven Video Generation', desc: 'Utilize advanced AI models to create unique faceless videos tailored to various niches.' },
                { icon: 'video_library', title: 'Text to Video Conversion', desc: 'Generate scripts with AI, choose a style, a voice, and a background to produce videos in seconds.' },
                { icon: 'image', title: 'Realistic Image Generation', desc: 'Employ advanced AI models to create lifelike images, which can be incorporated into videos.' },
                { icon: 'record_voice_over', title: 'Automatic Voiceover', desc: 'Use ElevenLabs & OpenAI voices to generate videos with a real human voice.' },
                { icon: 'subtitles', title: 'Customizable Captions', desc: 'Your videos come with beautiful, customizable captions.' }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 hover:border-yellow-DEFAULT/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="text-yellow-DEFAULT group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>{feature.icon}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-gray-900 text-lg font-bold">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-gray-50/50 rounded-3xl my-8">
          <div className="flex flex-col gap-10 items-center">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-4xl lg:text-5xl font-black leading-tight text-gray-900">Choose Your Plan</h2>
              <p className="text-lg lg:text-xl text-gray-600 max-w-2xl leading-relaxed">Simple, transparent pricing to get you started on your next big idea.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
              {[
                { name: 'Basic', price: '$20', href: '/pricing', label: 'Choose Basic' },
                { name: 'Pro', price: '$40', href: '/pricing', label: 'Choose Pro', popular: true },
                { name: 'Business', price: '$100', href: '/pricing', label: 'Choose Business' },
                { name: 'Enterprise', price: 'Custom', href: '/contact', label: 'Contact Us' }
              ].map((plan, index) => (
                <div 
                  key={index}
                  className={`flex flex-col p-6 rounded-xl border-2 ${plan.popular ? 'border-yellow-DEFAULT bg-yellow-light' : 'border-gray-200 bg-white'} relative hover:shadow-xl transition-all duration-300 hover:scale-105`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-yellow-DEFAULT text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-gray-900 text-lg font-bold">{plan.name}</h3>
                  <p className="text-gray-900 text-4xl font-black mt-4">{plan.price}</p>
                  <Button 
                    asChild 
                    className={`w-full mt-8 h-10 px-4 text-sm font-bold transition-all hover:scale-105 no-underline ${
                      plan.popular 
                        ? 'bg-yellow-DEFAULT text-gray-900 hover:bg-yellow-dark' 
                        : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Link href={plan.href} className="no-underline">{plan.label}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-600">
            © 2024 StoryShort.ai. Create viral videos effortlessly with AI-powered automation.
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Transform your content into engaging videos for TikTok, YouTube, and beyond.
          </p>
        </footer>
      </div>
    </div>
  )
}
