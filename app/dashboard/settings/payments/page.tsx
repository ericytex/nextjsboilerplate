'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Calendar,
  Download,
  Receipt,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

export default function PaymentsPage() {
  const [loading, setLoading] = useState(false)

  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    },
    {
      id: '2',
      type: 'card',
      last4: '8888',
      brand: 'Mastercard',
      expiryMonth: 6,
      expiryYear: 2026,
      isDefault: false
    }
  ])

  const [subscription] = useState({
    plan: 'Pro',
    status: 'active',
    billingCycle: 'monthly',
    amount: '$40',
    nextBillingDate: '2024-02-15',
    cancelAtPeriodEnd: false
  })

  const [invoices] = useState([
    {
      id: 'inv_001',
      date: '2024-01-15',
      amount: '$40.00',
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'inv_002',
      date: '2023-12-15',
      amount: '$40.00',
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'inv_003',
      date: '2023-11-15',
      amount: '$40.00',
      status: 'paid',
      downloadUrl: '#'
    }
  ])

  const handleAddPaymentMethod = () => {
    // TODO: Integrate with Stripe or payment provider
    toast.info('Redirecting to add payment method...')
  }

  const handleSetDefault = (id: string) => {
    setPaymentMethods(paymentMethods.map(pm => ({
      ...pm,
      isDefault: pm.id === id
    })))
    toast.success('Default payment method updated')
  }

  const handleDeletePaymentMethod = (id: string) => {
    if (paymentMethods.find(pm => pm.id === id)?.isDefault) {
      toast.error('Cannot delete default payment method')
      return
    }
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id))
    toast.success('Payment method removed')
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) {
      return
    }

    setLoading(true)
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Subscription will be cancelled at the end of the billing period')
    } catch (error) {
      toast.error('Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your payment methods, subscriptions, and billing history
          </p>
        </div>

        <div className="grid gap-6">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>
                Your active subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{subscription.plan} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} billing
                    </p>
                  </div>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold">{subscription.amount}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subscription.billingCycle === 'monthly' ? 'per month' : 'per year'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Next Billing Date
                    </p>
                    <p className="text-lg font-semibold">
                      {new Date(subscription.nextBillingDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Subscription will be cancelled
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Your subscription will end on {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Change Plan
                  </Button>
                  {!subscription.cancelAtPeriodEnd && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelSubscription}
                      disabled={loading}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Manage your saved payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {method.brand} •••• {method.last4}
                          </p>
                          {method.isDefault && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddPaymentMethod}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold">{invoice.amount}</p>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={invoice.downloadUrl}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

