'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('realistic')
  const [selectedVoice, setSelectedVoice] = useState('voice1')
  const [showDashboard, setShowDashboard] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    // Check if user has visited dashboard or is logged in
    // This is a simple check - replace with proper auth when implemented
    if (typeof window !== 'undefined') {
      const hasSession = localStorage.getItem('user_session') || localStorage.getItem('has_visited_dashboard')
      setShowDashboard(!!hasSession)
    }
  }, [])

  const videoStyles = [
    { id: 'realistic', name: 'Realistic', icon: 'photo' },
    { id: 'cartoon', name: 'Cartoon', icon: 'auto_awesome' },
    { id: 'ink', name: 'Japanese Ink', icon: 'brush' }
  ]

  const voiceSamples = [
    { id: 'voice1', name: 'Professional Male', accent: 'US' },
    { id: 'voice2', name: 'Friendly Female', accent: 'US' },
    { id: 'voice3', name: 'British Narrator', accent: 'UK' },
    { id: 'voice4', name: 'Energetic Voice', accent: 'US' }
  ]

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
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="#features">Features</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="/pricing">Pricing</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors" href="#blog">Resources</a>
            {showDashboard && (
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors">Dashboard</Link>
            )}
            <Link href="/signin" className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline transition-colors">Sign in</Link>
            <Button asChild className="h-9 px-4 bg-yellow-DEFAULT text-gray-900 text-sm font-bold hover:bg-yellow-dark transition-all no-underline">
              <Link href="/signup" className="no-underline">Start Free Trial</Link>
            </Button>
          </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="py-12 lg:py-20 mt-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left Side - Content */}
            <div className={`flex flex-col gap-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-yellow-light text-gray-700 px-4 py-2 rounded-lg w-fit">
                <svg className="w-4 h-4 text-yellow-DEFAULT" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h8v8l10-12h-8V2z"/>
                </svg>
                <span className="text-sm font-medium">AI-Powered Video Generation</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] text-gray-900">
                Create viral <span className="text-yellow-DEFAULT">faceless videos</span> in minutes—<span className="text-yellow-DEFAULT">no recording needed</span>.
              </h1>

              {/* Subheadline */}
              <p className="text-lg lg:text-xl text-gray-600 max-w-xl leading-relaxed">
                From prompt to published video in minutes. YouTube Shorts, TikTok, Instagram Reels—fully automated.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
              <Button asChild className="h-12 px-8 bg-yellow-DEFAULT text-gray-900 text-base font-bold hover:bg-yellow-dark hover:scale-105 transition-all shadow-lg hover:shadow-xl no-underline group">
                <Link href="/signup" className="no-underline flex items-center gap-2">
                  Start Free Trial
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </Button>
                <Button asChild variant="outline" className="h-12 px-6 bg-white border-2 border-gray-300 text-gray-900 text-base font-bold hover:bg-gray-50 hover:border-gray-400 transition-all no-underline">
                  <Link href="#demo" className="no-underline flex items-center gap-2">
                    <span className="material-symbols-outlined">play_circle</span>
                    Watch Demo
                  </Link>
                </Button>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-3 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-pink-400"
                      style={{
                        backgroundImage: `url(https://i.pravatar.cc/150?img=${i})`,
                        backgroundSize: 'cover'
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="material-symbols-outlined text-yellow-DEFAULT text-sm fill-yellow-DEFAULT">star</span>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Trusted by 27,000+ creators</span>
                </div>
              </div>
            </div>

            {/* Right Side - Video Preview Cards */}
            <div className="relative h-[500px] lg:h-[600px] hidden lg:block">
              <div className={`absolute right-0 top-20 w-64 h-80 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl shadow-2xl transform rotate-6 overflow-hidden transition-all duration-700 hover:scale-105 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="font-bold text-lg mb-1 drop-shadow-lg">YouTube Shorts</div>
                    <div className="text-xs drop-shadow-md">2.5M views • 45K likes</div>
                  </div>
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">play_circle</span>
                  </div>
                </div>
              </div>
              
              <div className={`absolute right-8 top-10 w-64 h-80 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl transform -rotate-3 overflow-hidden z-10 transition-all duration-700 hover:scale-105 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`} style={{ transitionDelay: '100ms' }}>
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="font-bold text-lg mb-1 drop-shadow-lg">TikTok</div>
                    <div className="text-xs drop-shadow-md">1.8M views • 120K likes</div>
                  </div>
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">play_circle</span>
                  </div>
                </div>
              </div>
              
              <div className={`absolute right-16 top-0 w-64 h-80 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-2xl shadow-2xl transform rotate-3 overflow-hidden z-20 transition-all duration-700 hover:scale-105 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`} style={{ transitionDelay: '200ms' }}>
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="font-bold text-lg mb-1 drop-shadow-lg">Instagram Reels</div>
                    <div className="text-xs drop-shadow-md">950K views • 35K likes</div>
                  </div>
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">play_circle</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Demo Section */}
          <section id="demo" className="py-20 bg-gray-50 rounded-3xl mb-20">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">See It In Action</h2>
                <p className="text-lg text-gray-600">Watch how easy it is to create viral videos from a simple prompt</p>
              </div>
              
              {/* Demo Video Placeholder */}
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video mb-8 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <button className="w-20 h-20 bg-yellow-DEFAULT rounded-full flex items-center justify-center mb-4 hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-gray-900 text-4xl">play_arrow</span>
                    </button>
                    <p className="text-gray-300">Demo Video: From Prompt to Published</p>
                  </div>
                </div>
              </div>

              {/* Interactive Workflow Preview */}
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { step: '1', title: 'Enter Prompt', desc: 'Describe your video idea', icon: 'edit' },
                  { step: '2', title: 'AI Generates', desc: 'Script, visuals, voice', icon: 'auto_awesome' },
                  { step: '3', title: 'Customize', desc: 'Style, voice, music', icon: 'tune' },
                  { step: '4', title: 'Auto-Publish', desc: 'To all platforms', icon: 'publish' }
                ].map((item, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-yellow-DEFAULT transition-all hover:shadow-lg text-center">
                    <div className="w-12 h-12 bg-yellow-DEFAULT rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-gray-900">{item.icon}</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 mb-2">{item.step}</div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Key Features Section */}
          <section id="features" className="py-20 mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Everything You Need to Go Viral</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Powerful AI tools to create, customize, and publish your videos automatically</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* AI-Generated Scripts */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-yellow-DEFAULT hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-yellow-light rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-yellow-DEFAULT text-3xl">auto_awesome</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">AI-Generated Scripts</h3>
                <p className="text-gray-600 leading-relaxed">Our AI writes engaging, viral-worthy scripts based on your topic. No writing skills needed—just describe your idea.</p>
              </div>

              {/* Customizable Video Styles */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-yellow-DEFAULT hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-yellow-light rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-yellow-DEFAULT text-3xl">palette</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Customizable Video Styles</h3>
                <p className="text-gray-600 leading-relaxed mb-4">Choose from multiple visual styles:</p>
                <div className="flex flex-wrap gap-2">
                  {videoStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedStyle === style.id
                          ? 'bg-yellow-DEFAULT text-gray-900'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm mr-1">{style.icon}</span>
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Voiceovers */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-yellow-DEFAULT hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-yellow-light rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-yellow-DEFAULT text-3xl">record_voice_over</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">AI Voiceovers</h3>
                <p className="text-gray-600 leading-relaxed mb-4">Natural-sounding voices in multiple accents. Preview samples:</p>
                <div className="space-y-2">
                  {voiceSamples.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${
                        selectedVoice === voice.id
                          ? 'bg-yellow-DEFAULT text-gray-900'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{voice.name}</span>
                      <span className="material-symbols-outlined text-lg">play_circle</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Music Library */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-yellow-DEFAULT hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-yellow-light rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-yellow-DEFAULT text-3xl">library_music</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Background Music Library</h3>
                <p className="text-gray-600 leading-relaxed">Thousands of royalty-free tracks. Choose by mood, genre, or tempo. Perfect for every video type.</p>
              </div>

              {/* Auto-Publishing */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-yellow-DEFAULT hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-yellow-light rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-yellow-DEFAULT text-3xl">publish</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Auto-Publish to Platforms</h3>
                <p className="text-gray-600 leading-relaxed mb-4">One-click publishing to:</p>
                <div className="flex gap-3">
                  {['YouTube Shorts', 'TikTok', 'Instagram Reels'].map((platform) => (
                    <div key={platform} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span className="text-sm font-medium">{platform}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* No Recording Needed */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-yellow-DEFAULT hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-yellow-light rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-yellow-DEFAULT text-3xl">videocam_off</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">100% Faceless</h3>
                <p className="text-gray-600 leading-relaxed">No camera, no recording, no editing. Everything is AI-generated. Perfect for creators who want to stay anonymous.</p>
              </div>
            </div>
          </section>

          {/* Social Proof - Testimonials */}
          <section className="py-20 bg-gray-50 rounded-3xl mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Loved by Creators Worldwide</h2>
              <p className="text-lg text-gray-600">See what creators are saying about aistoryshorts.com</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Sarah Chen',
                  role: 'TikTok Creator',
                  avatar: 1,
                  quote: 'I went from 10K to 500K followers in 3 months using aistoryshorts.com. The AI scripts are incredibly engaging!',
                  stats: '500K followers'
                },
                {
                  name: 'Marcus Johnson',
                  role: 'YouTube Shorts Creator',
                  avatar: 2,
                  quote: 'Creating 5 videos a day used to take me 10 hours. Now it takes 30 minutes. This is a game-changer.',
                  stats: '2M+ views/month'
                },
                {
                  name: 'Emma Rodriguez',
                  role: 'Instagram Creator',
                  avatar: 3,
                  quote: 'The auto-publishing feature saved me so much time. I can focus on strategy instead of manual posting.',
                  stats: '1.2M followers'
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400"
                      style={{
                        backgroundImage: `url(https://i.pravatar.cc/150?img=${testimonial.avatar})`,
                        backgroundSize: 'cover'
                      }}
                    />
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-yellow-DEFAULT">
                    <span className="material-symbols-outlined text-lg">trending_up</span>
                    {testimonial.stats}
                  </div>
                </div>
              ))}
            </div>
          </section>


          {/* Resources/Blog Section */}
          <section id="blog" className="py-20 mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Resources & Guides</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Learn how to create viral videos and optimize for each platform</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'How to Create Viral YouTube Shorts',
                  desc: 'Complete guide to optimizing your videos for YouTube Shorts algorithm',
                  category: 'Guide',
                  readTime: '5 min read'
                },
                {
                  title: 'TikTok Video Optimization Tips',
                  desc: 'Learn the secrets to getting millions of views on TikTok',
                  category: 'Tips',
                  readTime: '7 min read'
                },
                {
                  title: 'Instagram Reels Best Practices',
                  desc: 'Master Instagram Reels with these proven strategies',
                  category: 'Strategy',
                  readTime: '6 min read'
                }
              ].map((article, index) => (
                <Link
                  key={index}
                  href="#"
                  className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-yellow-DEFAULT hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-yellow-light text-yellow-dark text-xs font-bold rounded-full">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500">{article.readTime}</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-yellow-DEFAULT transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{article.desc}</p>
                  <div className="flex items-center gap-2 mt-4 text-yellow-DEFAULT font-semibold text-sm">
                    Read more
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-20 bg-gradient-to-br from-yellow-DEFAULT to-yellow-dark rounded-3xl mb-20 text-center">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
              Ready to Create Viral Videos?
            </h2>
            <p className="text-lg text-gray-800 mb-8 max-w-2xl mx-auto">
              Join 27,000+ creators who are already using AI to grow their audience. Start your free trial today.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild className="h-14 px-10 bg-gray-900 text-white text-lg font-bold hover:bg-gray-800 hover:scale-105 transition-all shadow-xl no-underline">
                <Link href="/signup" className="no-underline">Start Free Trial</Link>
              </Button>
              <Button asChild variant="outline" className="h-14 px-10 bg-white/90 border-2 border-gray-900 text-gray-900 text-lg font-bold hover:bg-white transition-all no-underline">
                <Link href="#demo" className="no-underline">Watch Demo</Link>
              </Button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-yellow-DEFAULT" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h8v8l10-12h-8V2z"/>
                </svg>
                <h3 className="font-bold text-gray-900">aistoryshorts.com</h3>
              </div>
              <p className="text-sm text-gray-600">Create viral faceless videos with AI. No recording needed.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-600 hover:text-gray-900 no-underline">Features</a></li>
                <li><a href="/pricing" className="text-gray-600 hover:text-gray-900 no-underline">Pricing</a></li>
                <li><a href="#demo" className="text-gray-600 hover:text-gray-900 no-underline">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#blog" className="text-gray-600 hover:text-gray-900 no-underline">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 no-underline">Guides</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 no-underline">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 no-underline">About</a></li>
                <li><a href="/contact" className="text-gray-600 hover:text-gray-900 no-underline">Contact</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 no-underline">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-sm text-gray-600">
              © 2024 aistoryshorts.com. Create viral videos effortlessly with AI-powered automation.
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
