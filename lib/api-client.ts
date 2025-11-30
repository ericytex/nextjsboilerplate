/**
 * API Client Utilities
 * Helper functions for making authenticated API calls
 */

/**
 * Get authentication headers for API requests
 * Includes userId from localStorage or cookies
 */
export function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') {
    return {}
  }

  const userId = localStorage.getItem('user_id')
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Add Authorization header if userId is available
  if (userId) {
    headers['Authorization'] = `UserId ${userId}`
  }

  return headers
}

/**
 * Make an authenticated API request
 * Automatically includes authentication headers
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Get userId from localStorage (client-side only)
 */
export function getUserId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('user_id')
}


