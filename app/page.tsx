import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-black/10 px-10 py-3">
              <Link href="/" className="flex items-center gap-4 text-text-light hover:opacity-80 transition-opacity">
                <div className="size-6 text-primary">
                  <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path>
                  </svg>
                </div>
                <h2 className="text-text-light text-lg font-bold leading-tight tracking-[-0.015em]">NextGen Boilerplate</h2>
              </Link>
              <div className="hidden md:flex flex-1 justify-end gap-8">
                <div className="flex items-center gap-9">
                  <a className="text-text-light/80 hover:text-text-light transition-colors text-sm font-medium leading-normal no-underline" href="#features">Features</a>
                  <a className="text-text-light/80 hover:text-text-light transition-colors text-sm font-medium leading-normal no-underline" href="#testimonials">Testimonials</a>
                  <a className="text-text-light/80 hover:text-text-light transition-colors text-sm font-medium leading-normal no-underline" href="#pricing">Pricing</a>
                  <a className="text-text-light/80 hover:text-text-light transition-colors text-sm font-medium leading-normal no-underline" href="#">Docs</a>
                </div>
                <Button asChild className="min-w-[84px] max-w-[480px] h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 no-underline">
                  <Link href="/pricing" className="no-underline">
                    <span className="truncate">Get Started</span>
                  </Link>
                </Button>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex flex-col gap-16 md:gap-24">
              {/* Hero Section */}
              <div className="@container">
                <div className="@[480px]:p-4">
                  <div className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 items-center justify-center p-4 text-center">
                    <div className="flex flex-col gap-4">
                      <h1 className="text-text-light text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-6xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em]">
                        Launch Your Next Project in Days, Not Months
                      </h1>
                      <h2 className="text-text-light-secondary text-base font-normal leading-normal @[480px]:text-lg @[480px]:font-normal @[480px]:leading-normal max-w-2xl mx-auto">
                        A production-ready Next.js boilerplate with payments, authentication, and everything else you need to go live and start generating revenue.
                      </h2>
                    </div>
                    <div className="flex-wrap gap-4 flex justify-center">
                      <Button asChild className="min-w-[84px] max-w-[480px] h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 no-underline">
                        <Link href="/pricing" className="no-underline">
                          <span className="truncate">Get Started Now</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="min-w-[84px] max-w-[480px] h-12 px-5 bg-black/[.08] text-text-light text-base font-bold leading-normal tracking-[0.015em] hover:bg-black/10 border-0 no-underline">
                        <Link href="/dashboard" className="no-underline">
                          <span className="truncate">View Demo</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div id="features" className="flex flex-col gap-10 px-4 py-10 @container">
                <div className="flex flex-col gap-4 text-center">
                  <h2 className="text-text-light tracking-light text-[32px] font-bold leading-tight @[480px]:text-4xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em] max-w-[720px] mx-auto">
                    Packed with Powerful Features
                  </h2>
                  <p className="text-text-light-secondary text-base font-normal leading-normal max-w-[720px] mx-auto">
                    Our boilerplate is built with the best technologies to help you ship faster and focus on what matters most: your product.
                  </p>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-0">
                  <div className="flex flex-1 gap-4 rounded-xl border border-black/10 bg-white p-5 flex-col hover:bg-gray-50 transition-colors">
                    <div className="text-primary">
                      <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>credit_card</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-text-light text-lg font-bold leading-tight">Stripe Payments</h3>
                      <p className="text-text-light-secondary text-sm font-normal leading-normal">Pre-built integration with Stripe for subscriptions and one-time payments.</p>
                    </div>
                  </div>
                  <div className="flex flex-1 gap-4 rounded-xl border border-black/10 bg-white p-5 flex-col hover:bg-gray-50 transition-colors">
                    <div className="text-primary">
                      <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>palette</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-text-light text-lg font-bold leading-tight">Fully Customizable</h3>
                      <p className="text-text-light-secondary text-sm font-normal leading-normal">Easily change the look and feel to match your brand with Tailwind CSS.</p>
                    </div>
                  </div>
                  <div className="flex flex-1 gap-4 rounded-xl border border-black/10 bg-white p-5 flex-col hover:bg-gray-50 transition-colors">
                    <div className="text-primary">
                      <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>trending_up</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-text-light text-lg font-bold leading-tight">SEO Optimized</h3>
                      <p className="text-text-light-secondary text-sm font-normal leading-normal">Built-in best practices for search engine optimization to get you discovered.</p>
                    </div>
                  </div>
                  <div className="flex flex-1 gap-4 rounded-xl border border-black/10 bg-white p-5 flex-col hover:bg-gray-50 transition-colors">
                    <div className="text-primary">
                      <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>lock</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-text-light text-lg font-bold leading-tight">Developer-Ready Auth</h3>
                      <p className="text-text-light-secondary text-sm font-normal leading-normal">Secure, ready-to-use authentication so your users can sign up and log in.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonials Section */}
              <div id="testimonials" className="flex flex-col gap-8 items-center px-4">
                <h2 className="text-text-light text-3xl font-bold leading-tight tracking-[-0.015em] text-center">Trusted by Developers Worldwide</h2>
                <div className="w-full flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex items-stretch p-4 gap-8 w-full">
                    <div className="flex flex-1 flex-col gap-4 text-center rounded-lg min-w-72 pt-4 border border-black/10 bg-white p-6">
                      <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full flex flex-col self-center w-24 h-24" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAX7XsoItt7tL4K6V-ktD53xG5HFI2g3PjS3OvEkhH6Cn9UpNrLxijV4u8g8dcZ9L18oogHWh1Y6RzGPjpXIOrbZy2Nnm-OLVHt02SHyZTWAhsfXAbT8NnqgioXKxPPtZqXHBhA1makaxk2ksCXs_tSXCafhGRjKvlkIsAzIbZgoZwdiEzY9LgnjGiR7Gv4d1XsztmhYkpvHxGukafDBTTGDRDCj2FAxrBAv3IgFgYp6Hjxm1k-fnNmtqFvO9_q4V6QwahV7hTjk5St")' }}></div>
                      <div>
                        <p className="text-text-light-secondary text-sm font-normal leading-normal">
                          "This boilerplate saved us at least two months of development time. We went from idea to launch in a weekend!"
                        </p>
                        <p className="text-text-light text-base font-medium leading-normal mt-4">Sarah Day</p>
                        <p className="text-text-light/50 text-sm">Founder of StartupX</p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 text-center rounded-lg min-w-72 pt-4 border border-black/10 bg-white p-6">
                      <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full flex flex-col self-center w-24 h-24" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuALR6jKxoIkBdd9q-TdaI2EMKlWzCcJRiPataH5ffjgmA7uvylZPSM1FPFkVNTvosqB_pKS7Tc3W8B-CUyQGC5wmtH_JmkYpAhSnNIggnZqLEZVmdj1ed5eECbeN1uUNorIVN8YiusnSk3Hj8ao9hfQStCYCsv2zkJMcmUpv2-dW7Kxb9NQyag-CcEwBIxqAo1gUZx3BCe-Ua1fa76ZXL7peRN4VtatgLQO7lHppy6Q6UOOJ9PW9yZrMeB4HHzupRPEMqHC0RKpzjtl")' }}></div>
                      <div>
                        <p className="text-text-light-secondary text-sm font-normal leading-normal">
                          "The code is clean, well-documented, and a joy to work with. Highly recommended for any new SaaS project."
                        </p>
                        <p className="text-text-light text-base font-medium leading-normal mt-4">Mark Chen</p>
                        <p className="text-text-light/50 text-sm">Lead Developer</p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 text-center rounded-lg min-w-72 pt-4 border border-black/10 bg-white p-6">
                      <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full flex flex-col self-center w-24 h-24" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAi9YbgQSY2BNGGTKb5UNriLKzmlGIF9cmfdk9S_AN5Kx8u1tqLrfC34lX_xFKiIwZ9c1pBnSdsEWGMNuXfmvnIaYz3xtmJ15raIs_ggd2p6wWBzkW37TW_mOgtfEClRptWk_0VRF9sBo3pHFmEUnBybDel9oQ2XRKMTHS_RmSy1YDUvzUo4e4oX8wfQgnAayZEOQb7qM3ege1Uh32IXYtnUu-6o47suvnUpS_G8D3SA8ZwEv5pDi3H7Zy8APjr8SCPWrkCPnKhqWdX")' }}></div>
                      <div>
                        <p className="text-text-light-secondary text-sm font-normal leading-normal">"As a solo developer, this was a game-changer. The Stripe integration alone was worth it."</p>
                        <p className="text-text-light text-base font-medium leading-normal mt-4">Emily Rodriguez</p>
                        <p className="text-text-light/50 text-sm">Indie Hacker</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div id="pricing" className="flex flex-col gap-10 px-4 py-10 items-center">
                <div className="flex flex-col gap-4 text-center">
                  <h2 className="text-text-light text-4xl font-black leading-tight tracking-[-0.033em]">Choose Your Plan</h2>
                  <p className="text-text-light-secondary text-lg font-normal leading-normal max-w-2xl">Simple, transparent pricing to get you started on your next big idea.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
                  {/* Basic Plan */}
                  <div className="flex flex-col p-6 rounded-xl border border-black/10 bg-white">
                    <h3 className="text-text-light text-lg font-bold">Basic</h3>
                    <p className="text-text-light text-4xl font-black mt-4">$20</p>
                    <Button asChild variant="outline" className="w-full mt-8 h-10 px-4 bg-black/[.08] text-text-light text-sm font-bold leading-normal tracking-[0.015em] hover:bg-black/10 border-0 no-underline">
                      <Link href="/pricing" className="no-underline">Choose Basic</Link>
                    </Button>
                  </div>

                  {/* Pro Plan - Most Popular */}
                  <div className="flex flex-col p-6 rounded-xl border-2 border-primary bg-primary/5 relative">
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Most Popular</div>
                    <h3 className="text-text-light text-lg font-bold">Pro</h3>
                    <p className="text-text-light text-4xl font-black mt-4">$40</p>
                    <Button asChild className="w-full mt-8 h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 no-underline">
                      <Link href="/pricing" className="no-underline">Choose Pro</Link>
                    </Button>
                  </div>

                  {/* Business Plan */}
                  <div className="flex flex-col p-6 rounded-xl border border-black/10 bg-white">
                    <h3 className="text-text-light text-lg font-bold">Business</h3>
                    <p className="text-text-light text-4xl font-black mt-4">$100</p>
                    <Button asChild variant="outline" className="w-full mt-8 h-10 px-4 bg-black/[.08] text-text-light text-sm font-bold leading-normal tracking-[0.015em] hover:bg-black/10 border-0 no-underline">
                      <Link href="/pricing" className="no-underline">Choose Business</Link>
                    </Button>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="flex flex-col p-6 rounded-xl border border-black/10 bg-white">
                    <h3 className="text-text-light text-lg font-bold">Enterprise</h3>
                    <p className="text-text-light text-4xl font-black mt-4">Custom</p>
                    <Button asChild variant="outline" className="w-full mt-8 h-10 px-4 bg-black/[.08] text-text-light text-sm font-bold leading-normal tracking-[0.015em] hover:bg-black/10 border-0 no-underline">
                      <Link href="/contact" className="no-underline">Contact Us</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </main>

            {/* Footer */}
            <footer className="text-text-light-secondary mt-24 border-t border-black/10 px-10 py-8 text-center">
              <p>© 2024 NextGen Boilerplate. All rights reserved.</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
