import { requireAuth } from "@/lib/auth-server"

// Mark as dynamic since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require authentication - redirects to signin if not authenticated
  // This prevents any flicker by checking auth before rendering
  await requireAuth()

  return <>{children}</>
}



