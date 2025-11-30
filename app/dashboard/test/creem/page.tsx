'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Loader2, Copy } from 'lucide-react'
import { toast } from 'sonner'

export default function CreemTestPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, any>>({})

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(endpoint)
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(endpoint, options)
      const data = await response.json()

      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          data,
          timestamp: new Date().toISOString(),
        },
      }))

      if (response.ok) {
        toast.success(`✅ ${endpoint} - Success`)
      } else {
        toast.error(`❌ ${endpoint} - Error: ${data.error?.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      }))
      toast.error(`❌ ${endpoint} - ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Creem.io API Testing</h1>
          <p className="text-muted-foreground mt-2">
            Test all Creem.io API endpoints. Make sure CREEM_API_KEY is set in .env.local
          </p>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
            <TabsTrigger value="discounts">Discounts</TabsTrigger>
            <TabsTrigger value="licenses">Licenses</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Product</CardTitle>
                <CardDescription>Create a new product in Creem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input id="product-name" defaultValue="Test Product" />
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input id="product-price" type="number" defaultValue="29.99" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Description</Label>
                    <Input id="product-desc" defaultValue="A test product for API testing" />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    const name = (document.getElementById('product-name') as HTMLInputElement)?.value
                    const price = parseFloat((document.getElementById('product-price') as HTMLInputElement)?.value || '0')
                    const description = (document.getElementById('product-desc') as HTMLInputElement)?.value
                    testEndpoint('/api/creem/products', 'POST', {
                      name,
                      price,
                      description,
                      currency: 'USD',
                    })
                  }}
                  disabled={loading === '/api/creem/products'}
                >
                  {loading === '/api/creem/products' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </Button>
                {results['/api/creem/products'] && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Response:</span>
                      <Badge variant={results['/api/creem/products'].status === 200 ? 'default' : 'destructive'}>
                        {results['/api/creem/products'].status || 'Error'}
                      </Badge>
                    </div>
                    <pre className="text-xs overflow-auto max-h-64">
                      {formatJSON(results['/api/creem/products'])}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(formatJSON(results['/api/creem/products']))}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Response
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>List Products</CardTitle>
                <CardDescription>Get all products</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => testEndpoint('/api/creem/products')}
                  disabled={loading === '/api/creem/products'}
                >
                  {loading === '/api/creem/products' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'List Products'
                  )}
                </Button>
                {results['/api/creem/products'] && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto max-h-64">
                      {formatJSON(results['/api/creem/products'])}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checkout Tab */}
          <TabsContent value="checkout" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Checkout</CardTitle>
                <CardDescription>Create a checkout session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product ID</Label>
                  <Input id="checkout-product-id" placeholder="Enter product ID from products tab" />
                </div>
                <div className="space-y-2">
                  <Label>Customer Email</Label>
                  <Input id="checkout-email" type="email" defaultValue="test@example.com" />
                </div>
                <Button
                  onClick={() => {
                    const productId = (document.getElementById('checkout-product-id') as HTMLInputElement)?.value
                    const email = (document.getElementById('checkout-email') as HTMLInputElement)?.value
                    if (!productId) {
                      toast.error('Product ID is required')
                      return
                    }
                    testEndpoint('/api/creem/checkout', 'POST', {
                      productId,
                      customerEmail: email,
                      successUrl: typeof window !== 'undefined' ? `${window.location.origin}/success` : '/success',
                      cancelUrl: typeof window !== 'undefined' ? `${window.location.origin}/cancel` : '/cancel',
                    })
                  }}
                  disabled={loading === '/api/creem/checkout'}
                >
                  {loading === '/api/creem/checkout' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Checkout'
                  )}
                </Button>
                {results['/api/creem/checkout'] && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto max-h-64">
                      {formatJSON(results['/api/creem/checkout'])}
                    </pre>
                    {results['/api/creem/checkout']?.data?.data?.checkoutUrl && (
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.open(results['/api/creem/checkout'].data.data.checkoutUrl, '_blank')
                          }
                        }}
                      >
                        Open Checkout URL
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discounts Tab */}
          <TabsContent value="discounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Discount Code</CardTitle>
                <CardDescription>Create a discount code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input id="discount-code" defaultValue="TEST10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select id="discount-type" className="w-full p-2 border rounded">
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input id="discount-value" type="number" defaultValue="10" />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    const code = (document.getElementById('discount-code') as HTMLInputElement)?.value
                    const type = (document.getElementById('discount-type') as HTMLSelectElement)?.value
                    const value = parseFloat((document.getElementById('discount-value') as HTMLInputElement)?.value || '0')
                    testEndpoint('/api/creem/discounts', 'POST', {
                      code,
                      type,
                      value,
                      description: 'Test discount code',
                    })
                  }}
                  disabled={loading === '/api/creem/discounts'}
                >
                  {loading === '/api/creem/discounts' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Discount'
                  )}
                </Button>
                {results['/api/creem/discounts'] && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto max-h-64">
                      {formatJSON(results['/api/creem/discounts'])}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Licenses Tab */}
          <TabsContent value="licenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Validate License Key</CardTitle>
                <CardDescription>Validate a license key</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>License Key</Label>
                  <Input id="license-key" placeholder="Enter license key" />
                </div>
                <Button
                  onClick={() => {
                    const licenseKey = (document.getElementById('license-key') as HTMLInputElement)?.value
                    if (!licenseKey) {
                      toast.error('License key is required')
                      return
                    }
                    testEndpoint('/api/creem/licenses?action=validate', 'POST', {
                      licenseKey,
                    })
                  }}
                  disabled={loading === '/api/creem/licenses?action=validate'}
                >
                  {loading === '/api/creem/licenses?action=validate' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate License'
                  )}
                </Button>
                {results['/api/creem/licenses?action=validate'] && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto max-h-64">
                      {formatJSON(results['/api/creem/licenses?action=validate'])}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Get Subscription</CardTitle>
                <CardDescription>Get subscription details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subscription ID</Label>
                  <Input id="subscription-id" placeholder="Enter subscription ID" />
                </div>
                <Button
                  onClick={() => {
                    const subscriptionId = (document.getElementById('subscription-id') as HTMLInputElement)?.value
                    if (!subscriptionId) {
                      toast.error('Subscription ID is required')
                      return
                    }
                    testEndpoint(`/api/creem/subscriptions?subscriptionId=${subscriptionId}`)
                  }}
                  disabled={loading?.includes('/api/creem/subscriptions')}
                >
                  {loading?.includes('/api/creem/subscriptions') ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Get Subscription'
                  )}
                </Button>
                {results[Object.keys(results).find(k => k.includes('/api/creem/subscriptions')) || ''] && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto max-h-64">
                      {formatJSON(results[Object.keys(results).find(k => k.includes('/api/creem/subscriptions')) || ''])}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhook Tab */}
          <TabsContent value="webhook" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Endpoint</CardTitle>
                <CardDescription>Test webhook endpoint availability</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Webhook URL: <code className="bg-muted px-2 py-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/creem</code>
                </p>
                <Button
                  onClick={() => testEndpoint('/api/webhooks/creem')}
                  disabled={loading === '/api/webhooks/creem'}
                >
                  {loading === '/api/webhooks/creem' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Webhook Endpoint'
                  )}
                </Button>
                {results['/api/webhooks/creem'] && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto max-h-64">
                      {formatJSON(results['/api/webhooks/creem'])}
                    </pre>
                  </div>
                )}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    💡 Webhook Testing Tips:
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Use ngrok for local testing: <code>ngrok http 3000</code></li>
                    <li>Add the ngrok URL to Creem Dashboard → Developers → Webhooks</li>
                    <li>Trigger events in Creem to test webhook delivery</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

