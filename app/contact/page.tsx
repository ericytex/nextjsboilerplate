'use client'

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      company: formData.get('company'),
      message: formData.get('message'),
    }
    console.log('Form submitted:', data)
    alert('Form submitted! Check console for details.')
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Enterprise Pricing Request
        </h1>
        
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-8 space-y-6"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Submit Request
          </button>
        </form>
      </div>
    </main>
  )
}

