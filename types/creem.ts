/**
 * Creem.io API TypeScript Types
 * Based on: https://docs.creem.io/api-reference
 */

// Base API Response
export interface CreemApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

// Checkout Types
export interface CreateCheckoutRequest {
  productId: string
  customerEmail?: string
  customerName?: string
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, any>
  discountCode?: string
  quantity?: number
}

export interface CheckoutSession {
  id: string
  checkoutUrl: string
  productId: string
  customerEmail?: string
  customerName?: string
  status: 'pending' | 'completed' | 'expired' | 'cancelled'
  amount: number
  currency: string
  createdAt: string
  expiresAt: string
  metadata?: Record<string, any>
}

export interface GetCheckoutRequest {
  checkoutId: string
}

// Product Types
export interface CustomFieldRequest {
  type: 'text' | 'checkbox'
  key: string
  label: string
  optional?: boolean
  text?: {
    max_length?: number
    min_length?: number
  }
  checkbox?: {
    label: string
  }
}

export interface CreateProductRequest {
  name: string // Required
  description?: string
  image_url?: string // Note: snake_case, not camelCase
  price: number // Required, in cents, minimum 100
  currency: string // Required, three-letter ISO currency code (e.g., "USD")
  billing_type: 'recurring' | 'onetime' // Required
  billing_period?: string // Required if billing_type is recurring (e.g., "every-month", "every-year")
  tax_mode?: 'inclusive' | 'exclusive' // Default: "inclusive"
  tax_category?: string[] // e.g., ["saas", "digital-goods-service", "ebooks"]
  default_success_url?: string
  custom_field?: CustomFieldRequest[] // Up to 3 fields supported
  abandoned_cart_recovery_enabled?: boolean // Default: false
}

export interface Feature {
  id: string
  type: string
  description: string
}

export interface Product {
  id: string
  mode: 'test' | 'prod' | 'sandbox'
  object: string
  name: string
  description?: string
  image_url?: string
  features?: Feature[]
  price: number // in cents
  currency: string
  billing_type: 'recurring' | 'onetime'
  billing_period?: string
  status: string
  tax_mode?: 'inclusive' | 'exclusive'
  tax_category?: string[]
  product_url?: string // The product page URL for express checkout
  default_success_url?: string
  created_at: string // ISO 8601 date-time
  updated_at: string // ISO 8601 date-time
}

export interface ListProductsRequest {
  page?: number
  limit?: number
  search?: string
}

export interface ListProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// License Key Types
export interface ActivateLicenseRequest {
  licenseKey: string
  customerEmail?: string
  customerName?: string
  metadata?: Record<string, any>
}

export interface License {
  id: string
  licenseKey: string
  productId: string
  status: 'active' | 'inactive' | 'expired' | 'revoked'
  customerEmail?: string
  customerName?: string
  activatedAt?: string
  expiresAt?: string
  metadata?: Record<string, any>
}

export interface DeactivateLicenseRequest {
  licenseKey: string
  reason?: string
}

export interface ValidateLicenseRequest {
  licenseKey: string
}

export interface ValidateLicenseResponse {
  valid: boolean
  license?: License
  message?: string
}

// Discount Code Types
export interface CreateDiscountRequest {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  description?: string
  maxUses?: number
  expiresAt?: string
  productIds?: string[]
  minAmount?: number
  metadata?: Record<string, any>
}

export interface Discount {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  description?: string
  maxUses?: number
  usedCount: number
  expiresAt?: string
  productIds?: string[]
  minAmount?: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface GetDiscountRequest {
  discountId: string
}

export interface DeleteDiscountRequest {
  discountId: string
}

// Subscription Types
export interface Subscription {
  id: string
  productId: string
  customerId: string
  customerEmail: string
  customerName?: string
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string
  trialStart?: string
  trialEnd?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface GetSubscriptionRequest {
  subscriptionId: string
}

export interface CancelSubscriptionRequest {
  subscriptionId: string
  cancelImmediately?: boolean
  reason?: string
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string
  metadata?: Record<string, any>
  cancelAtPeriodEnd?: boolean
}

export interface UpgradeSubscriptionRequest {
  subscriptionId: string
  newProductId: string
  prorate?: boolean
}

// Customer Types
export interface Customer {
  id: string
  email: string
  name?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ListCustomersRequest {
  page?: number
  limit?: number
  email?: string
}

export interface ListCustomersResponse {
  customers: Customer[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Transaction Types
export interface Transaction {
  id: string
  checkoutId?: string
  subscriptionId?: string
  customerId: string
  productId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface ListTransactionsRequest {
  page?: number
  limit?: number
  customerId?: string
  subscriptionId?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface ListTransactionsResponse {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Webhook Types
export interface WebhookEvent {
  id: string
  type: WebhookEventType
  data: any
  createdAt: string
}

export type WebhookEventType =
  | 'checkout.completed'
  | 'checkout.expired'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.renewed'
  | 'license.activated'
  | 'license.deactivated'
  | 'transaction.completed'
  | 'transaction.failed'
  | 'refund.processed'

// API Client Configuration
export interface CreemClientConfig {
  apiKey: string
  testMode?: boolean
  baseUrl?: string
}

// Error Types
export class CreemApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'CreemApiError'
  }
}

