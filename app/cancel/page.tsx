import Link from 'next/link'

export default function CancelPage() {
  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          Payment Canceled
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your payment was canceled. You can try again anytime.
        </p>
        <Link
          href="/pricing"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </Link>
      </div>
    </main>
  )
}

