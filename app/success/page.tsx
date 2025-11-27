import Link from 'next/link'

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  const plan = searchParams?.plan || 'unknown'

  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">
          Payment Successful
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Plan: <span className="font-semibold capitalize">{plan}</span>
        </p>
        <div className="mt-8 space-x-4">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    </main>
  )
}

