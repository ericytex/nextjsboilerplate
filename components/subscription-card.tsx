'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Calendar, TrendingUp, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"

interface Subscription {
  id: string
  plan: string
  planDisplayName: string
  status: string
  billingCycle: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  isTrial: boolean
  createdAt: string
}

export function SubscriptionCard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const userId = localStorage.getItem('user_id')
        if (!userId) {
          setLoading(false)
          return
        }

        const response = await fetch(`/api/user/subscription?userId=${userId}`)
        const data = await response.json()

        if (data.success && data.subscription) {
          setSubscription(data.subscription)
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  if (loading) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card className="border-2 border-dashed bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>Choose a plan to get started</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Link href="/pricing">View Plans</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getPlanGradient = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'starter':
      case 'basic':
        return 'from-blue-500 to-cyan-500'
      case 'pro':
        return 'from-purple-500 to-pink-500'
      case 'business':
        return 'from-orange-500 to-red-500'
      case 'enterprise':
        return 'from-indigo-500 to-purple-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'trialing':
        return 'bg-blue-500'
      case 'canceled':
        return 'bg-gray-500'
      case 'past_due':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card className="border-2 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg">
      <div className={`h-2 bg-gradient-to-r ${getPlanGradient(subscription.plan)}`} />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 bg-gradient-to-br ${getPlanGradient(subscription.plan)} rounded-xl shadow-lg`}>
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{subscription.planDisplayName || subscription.plan}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(subscription.status)} text-white border-0`}
                >
                  {subscription.isTrial ? 'Trial' : subscription.status}
                </Badge>
                <span className="text-xs">
                  {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} billing
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.currentPeriodEnd && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {subscription.isTrial ? 'Trial ends' : 'Next billing'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              ⚠️ Subscription will be cancelled
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Your access will end on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'the billing period end'}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href="/dashboard/settings/payments">Manage</Link>
          </Button>
          {!subscription.cancelAtPeriodEnd && (
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="flex-1"
            >
              <Link href="/pricing">Upgrade</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


