/**
 * Creem.io API Client
 * Handles authentication, base URL switching, and error handling
 * Documentation: https://docs.creem.io/api-reference
 */

import type {
  CreemClientConfig,
  CreemApiResponse,
  CreateCheckoutRequest,
  CheckoutSession,
  GetCheckoutRequest,
  CreateProductRequest,
  Product,
  ListProductsRequest,
  ListProductsResponse,
  ActivateLicenseRequest,
  License,
  DeactivateLicenseRequest,
  ValidateLicenseRequest,
  ValidateLicenseResponse,
  CreateDiscountRequest,
  Discount,
  GetDiscountRequest,
  DeleteDiscountRequest,
  Subscription,
  GetSubscriptionRequest,
  CancelSubscriptionRequest,
  UpdateSubscriptionRequest,
  UpgradeSubscriptionRequest,
} from '@/types/creem'
import { CreemApiError } from '@/types/creem'

export class CreemClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: CreemClientConfig) {
    this.apiKey = config.apiKey

    if (config.baseUrl) {
      this.baseUrl = config.baseUrl
    } else {
      // Use test API in test mode, production API otherwise
      this.baseUrl = config.testMode
        ? 'https://test-api.creem.io'
        : 'https://api.creem.io'
    }
  }

  /**
   * Make an authenticated request to the Creem API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json().catch(() => ({})) as CreemApiResponse<T>

      if (!response.ok) {
        const errorMessage = data.error?.message || `HTTP ${response.status}: ${response.statusText}`
        const errorCode = data.error?.code || `HTTP_${response.status}`
        
        throw new CreemApiError(
          response.status,
          errorCode,
          errorMessage,
          data.error?.details
        )
      }

      // Return data directly if it's in the response.data field, otherwise return the whole response
      return (data.data !== undefined ? data.data : data) as T
    } catch (error) {
      if (error instanceof CreemApiError) {
        throw error
      }

      // Handle network errors
      throw new CreemApiError(
        0,
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network request failed',
        error
      )
    }
  }

  // ==================== CHECKOUT API ====================

  /**
   * Create a checkout session
   * POST /v1/checkouts
   */
  async createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession> {
    return this.request<CheckoutSession>('/v1/checkouts', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Get a checkout session
   * GET /v1/checkouts
   */
  async getCheckout(request: GetCheckoutRequest): Promise<CheckoutSession> {
    return this.request<CheckoutSession>(`/v1/checkouts?id=${request.checkoutId}`)
  }

  // ==================== PRODUCT API ====================

  /**
   * Create a product
   * POST /v1/products
   */
  async createProduct(request: CreateProductRequest): Promise<Product> {
    return this.request<Product>('/v1/products', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Get a product
   * GET /v1/products
   */
  async getProduct(productId: string): Promise<Product> {
    return this.request<Product>(`/v1/products?id=${productId}`)
  }

  /**
   * List products
   * GET /v1/products/search
   */
  async listProducts(request: ListProductsRequest = {}): Promise<ListProductsResponse> {
    const params = new URLSearchParams()
    if (request.page) params.append('page', request.page.toString())
    if (request.limit) params.append('limit', request.limit.toString())
    if (request.search) params.append('search', request.search)

    const queryString = params.toString()
    return this.request<ListProductsResponse>(
      `/v1/products/search${queryString ? `?${queryString}` : ''}`
    )
  }

  // ==================== LICENSE API ====================

  /**
   * Activate a license key
   * POST /v1/licenses/activate
   */
  async activateLicense(request: ActivateLicenseRequest): Promise<License> {
    return this.request<License>('/v1/licenses/activate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Deactivate a license key
   * POST /v1/licenses/deactivate
   */
  async deactivateLicense(request: DeactivateLicenseRequest): Promise<License> {
    return this.request<License>('/v1/licenses/deactivate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Validate a license key
   * POST /v1/licenses/validate
   */
  async validateLicense(request: ValidateLicenseRequest): Promise<ValidateLicenseResponse> {
    return this.request<ValidateLicenseResponse>('/v1/licenses/validate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // ==================== DISCOUNT API ====================

  /**
   * Create a discount code
   * POST /v1/discounts
   */
  async createDiscount(request: CreateDiscountRequest): Promise<Discount> {
    return this.request<Discount>('/v1/discounts', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Get a discount code
   * GET /v1/discounts
   */
  async getDiscount(request: GetDiscountRequest): Promise<Discount> {
    return this.request<Discount>(`/v1/discounts?id=${request.discountId}`)
  }

  /**
   * Delete a discount code
   * DELETE /v1/discounts/{id}/delete
   */
  async deleteDiscount(request: DeleteDiscountRequest): Promise<void> {
    return this.request<void>(`/v1/discounts/${request.discountId}/delete`, {
      method: 'DELETE',
    })
  }

  // ==================== SUBSCRIPTION API ====================

  /**
   * Get a subscription
   * GET /v1/subscriptions
   */
  async getSubscription(request: GetSubscriptionRequest): Promise<Subscription> {
    return this.request<Subscription>(`/v1/subscriptions?id=${request.subscriptionId}`)
  }

  /**
   * Cancel a subscription
   * POST /v1/subscriptions/{id}/cancel
   */
  async cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription> {
    return this.request<Subscription>(`/v1/subscriptions/${request.subscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        cancelImmediately: request.cancelImmediately,
        reason: request.reason,
      }),
    })
  }

  /**
   * Update a subscription
   * POST /v1/subscriptions/{id}
   */
  async updateSubscription(request: UpdateSubscriptionRequest): Promise<Subscription> {
    return this.request<Subscription>(`/v1/subscriptions/${request.subscriptionId}`, {
      method: 'POST',
      body: JSON.stringify({
        metadata: request.metadata,
        cancelAtPeriodEnd: request.cancelAtPeriodEnd,
      }),
    })
  }

  /**
   * Upgrade a subscription
   * POST /v1/subscriptions/{id}/upgrade
   */
  async upgradeSubscription(request: UpgradeSubscriptionRequest): Promise<Subscription> {
    return this.request<Subscription>(`/v1/subscriptions/${request.subscriptionId}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({
        newProductId: request.newProductId,
        prorate: request.prorate,
      }),
    })
  }
}

/**
 * Create a Creem client instance
 */
export function createCreemClient(config: CreemClientConfig): CreemClient {
  return new CreemClient(config)
}

/**
 * Get Creem client from environment variables
 */
export function getCreemClientFromEnv(): CreemClient {
  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) {
    throw new Error('CREEM_API_KEY environment variable is not set')
  }

  const testMode = process.env.NODE_ENV !== 'production' || process.env.CREEM_TEST_MODE === 'true'

  return new CreemClient({
    apiKey,
    testMode,
  })
}

