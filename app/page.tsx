export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
        <p className="text-gray-600 mb-8">Next.js App Router Boilerplate</p>
        <a 
          href="/pricing" 
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          View Pricing
        </a>
      </div>
    </main>
  )
}

