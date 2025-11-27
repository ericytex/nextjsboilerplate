import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, LayoutDashboard, CreditCard, Users, Settings } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-4 py-24 md:py-32">
        <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
            Next.js Boilerplate
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            A production-ready Next.js App Router boilerplate with shadcn/ui, TypeScript, Tailwind CSS, and payment integration.
          </p>
          <div className="flex gap-4 mt-4">
            <Button asChild size="lg">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">
                <CreditCard className="mr-2 h-4 w-4" />
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-12 md:py-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <LayoutDashboard className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Modern Dashboard</CardTitle>
              <CardDescription>
                Beautiful shadcn/ui dashboard with charts, tables, and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost">
                <Link href="/dashboard">
                  Explore Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CreditCard className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Payment Integration</CardTitle>
              <CardDescription>
                Ready-to-use payment plans with Creem.io checkout integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost">
                <Link href="/pricing">
                  View Plans <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Settings className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Fully Customizable</CardTitle>
              <CardDescription>
                Built with shadcn/ui components - customize everything to match your brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost">
                <Link href="/dashboard">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-12 md:py-24">
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to get started?</CardTitle>
            <CardDescription>
              Start building your next project with this production-ready boilerplate
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Open Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">
                <CreditCard className="mr-2 h-4 w-4" />
                View Pricing
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

