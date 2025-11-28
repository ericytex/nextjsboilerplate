import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white overflow-x-hidden" style={{
      backgroundImage: 'radial-gradient(circle, #f3f4f6 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity">
            <svg className="w-6 h-6 text-yellow-DEFAULT" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h8v8l10-12h-8V2z"/>
            </svg>
            <h2 className="text-lg font-semibold">StoryShort</h2>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline" href="#pricing">Pricing</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline" href="#">Blog</a>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline relative" href="#">
              Affiliate Program
              <span className="absolute -top-1 -right-8 bg-yellow-DEFAULT text-yellow-dark text-[10px] font-bold px-1.5 py-0.5 rounded">New</span>
            </a>
            <button className="text-gray-700 hover:text-gray-900">
              <span className="material-symbols-outlined text-xl">light_mode</span>
            </button>
            <a className="text-gray-700 hover:text-gray-900 text-sm font-medium no-underline" href="#">Sign in</a>
            <Button asChild className="h-9 px-4 bg-white border border-gray-300 text-gray-900 text-sm font-medium hover:bg-gray-50 no-underline">
              <Link href="/pricing" className="no-underline">Get Started</Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="flex flex-col gap-6">
              {/* Powered by GPT-5 Badge */}
              <div className="inline-flex items-center gap-2 bg-yellow-light text-gray-700 px-4 py-2 rounded-lg w-fit">
                <svg className="w-4 h-4 text-yellow-DEFAULT" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h8v8l10-12h-8V2z"/>
                </svg>
                <span className="text-sm font-medium">Powered by GPT-5</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-6xl font-black leading-tight text-gray-900">
                Create <span className="text-yellow-DEFAULT">viral</span> <span className="text-yellow-DEFAULT">faceless videos</span> on Auto-Pilot.
              </h1>

              {/* Subheadline */}
              <p className="text-lg text-gray-600 max-w-xl">
                Generate AI Videos in minutes. Our AI creation tool crafts viral AI videos for you.
              </p>

              {/* CTA Button */}
              <Button asChild className="w-fit h-12 px-6 bg-yellow-DEFAULT text-gray-900 text-base font-bold hover:bg-yellow-dark no-underline">
                <Link href="/pricing" className="no-underline flex items-center gap-2">
                  Get Started
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </Link>
              </Button>
            </div>

            {/* Right Side - Video Preview Cards */}
            <div className="relative h-[500px] lg:h-[600px]">
              {/* Back Card */}
              <div className="absolute right-0 top-20 w-64 h-80 bg-gray-200 rounded-2xl shadow-lg transform rotate-6 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-white font-bold text-lg mb-2">REACHED THE</div>
                    <div className="text-white text-sm">day Apollo 11 landed on .noon</div>
                  </div>
                </div>
              </div>
              
              {/* Middle Card */}
              <div className="absolute right-8 top-10 w-64 h-80 bg-gray-200 rounded-2xl shadow-xl transform -rotate-3 overflow-hidden z-10">
                <div className="w-full h-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-white font-bold text-lg mb-2">trapped climbers</div>
                    <div className="text-white text-sm">sadest story on est</div>
                  </div>
                </div>
              </div>
              
              {/* Front Card */}
              <div className="absolute right-16 top-0 w-64 h-80 bg-gray-200 rounded-2xl shadow-2xl transform rotate-3 overflow-hidden z-20">
                <div className="w-full h-full bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-white font-bold text-lg mb-2">HAD AN</div>
                    <div className="text-white text-sm">The Cleopatre Effect</div>
                    <span className="material-symbols-outlined text-white text-2xl mt-2">favorite</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Section */}
          <div className="mt-16 lg:mt-24 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar Row */}
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-pink-400"
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
                  <span key={i} className="material-symbols-outlined text-yellow-DEFAULT text-xl">star</span>
                ))}
              </div>
            </div>
            
            <p className="text-gray-700 font-medium">Trusted by 27,000+ creators</p>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-4xl font-black leading-tight text-gray-900">
                Everything You Need to Create Viral Videos
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Say goodbye to boring videos. Get started with StoryShort.ai today and start creating engaging videos for TikTok and YouTube on autopilot.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 transition-colors">
                <div className="text-yellow-DEFAULT">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>smart_toy</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-gray-900 text-lg font-bold">AI-Driven Video Generation</h3>
                  <p className="text-gray-600 text-sm">Utilize advanced AI models to create unique faceless videos tailored to various niches.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 transition-colors">
                <div className="text-yellow-DEFAULT">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>video_library</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-gray-900 text-lg font-bold">Text to Video Conversion</h3>
                  <p className="text-gray-600 text-sm">Generate scripts with AI, choose a style, a voice, and a background to produce videos in seconds.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 transition-colors">
                <div className="text-yellow-DEFAULT">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>image</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-gray-900 text-lg font-bold">Realistic Image Generation</h3>
                  <p className="text-gray-600 text-sm">Employ advanced AI models to create lifelike images, which can be incorporated into videos.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 transition-colors">
                <div className="text-yellow-DEFAULT">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>record_voice_over</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-gray-900 text-lg font-bold">Automatic Voiceover</h3>
                  <p className="text-gray-600 text-sm">Use ElevenLabs & OpenAI voices to generate videos with a real human voice.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 transition-colors">
                <div className="text-yellow-DEFAULT">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>subtitles</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-gray-900 text-lg font-bold">Customizable Captions</h3>
                  <p className="text-gray-600 text-sm">Your videos come with beautiful, customizable captions.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="flex flex-col gap-10 items-center">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-4xl font-black leading-tight text-gray-900">Choose Your Plan</h2>
              <p className="text-lg text-gray-600 max-w-2xl">Simple, transparent pricing to get you started on your next big idea.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
              <div className="flex flex-col p-6 rounded-xl border border-gray-200 bg-white">
                <h3 className="text-gray-900 text-lg font-bold">Basic</h3>
                <p className="text-gray-900 text-4xl font-black mt-4">$20</p>
                <Button asChild variant="outline" className="w-full mt-8 h-10 px-4 bg-white border border-gray-300 text-gray-900 text-sm font-bold hover:bg-gray-50 no-underline">
                  <Link href="/pricing" className="no-underline">Choose Basic</Link>
                </Button>
              </div>
              <div className="flex flex-col p-6 rounded-xl border-2 border-yellow-DEFAULT bg-yellow-light relative">
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-yellow-DEFAULT text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase">Most Popular</div>
                <h3 className="text-gray-900 text-lg font-bold">Pro</h3>
                <p className="text-gray-900 text-4xl font-black mt-4">$40</p>
                <Button asChild className="w-full mt-8 h-10 px-4 bg-yellow-DEFAULT text-gray-900 text-sm font-bold hover:bg-yellow-dark no-underline">
                  <Link href="/pricing" className="no-underline">Choose Pro</Link>
                </Button>
              </div>
              <div className="flex flex-col p-6 rounded-xl border border-gray-200 bg-white">
                <h3 className="text-gray-900 text-lg font-bold">Business</h3>
                <p className="text-gray-900 text-4xl font-black mt-4">$100</p>
                <Button asChild variant="outline" className="w-full mt-8 h-10 px-4 bg-white border border-gray-300 text-gray-900 text-sm font-bold hover:bg-gray-50 no-underline">
                  <Link href="/pricing" className="no-underline">Choose Business</Link>
                </Button>
              </div>
              <div className="flex flex-col p-6 rounded-xl border border-gray-200 bg-white">
                <h3 className="text-gray-900 text-lg font-bold">Enterprise</h3>
                <p className="text-gray-900 text-4xl font-black mt-4">Custom</p>
                <Button asChild variant="outline" className="w-full mt-8 h-10 px-4 bg-white border border-gray-300 text-gray-900 text-sm font-bold hover:bg-gray-50 no-underline">
                  <Link href="/contact" className="no-underline">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 text-center">
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
