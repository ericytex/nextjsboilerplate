'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Bell, Mail, Smartphone, MessageSquare, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false)
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [notifications, setNotifications] = useState({
    email: {
      enabled: true,
      marketing: true,
      productUpdates: true,
      securityAlerts: true,
      weeklyDigest: false,
      comments: true,
      mentions: true
    },
    push: {
      enabled: true,
      newVideos: true,
      comments: true,
      mentions: false,
      securityAlerts: true
    },
    inApp: {
      enabled: true,
      newVideos: true,
      comments: true,
      mentions: true,
      systemUpdates: true
    }
  })

  // Fetch notification preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const userId = localStorage.getItem('user_id')
        if (!userId) {
          setLoadingPreferences(false)
          return
        }

        const response = await fetch(`/api/user/notifications?userId=${userId}`)
        const data = await response.json()

        if (data.success && data.notifications) {
          setNotifications(data.notifications)
        }
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error)
      } finally {
        setLoadingPreferences(false)
      }
    }

    fetchPreferences()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const userId = localStorage.getItem('user_id')
      if (!userId) {
        toast.error('Please sign in to save preferences')
        setLoading(false)
        return
      }

      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          notifications
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Notification preferences saved')
      } else {
        toast.error(data.error || 'Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const updateNotification = (category: string, key: string, value: boolean) => {
    setNotifications({
      ...notifications,
      [category]: {
        ...notifications[category as keyof typeof notifications],
        [key]: value
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage how and when you receive notifications
          </p>
        </div>

        {loadingPreferences ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading preferences...</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="grid gap-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Control which emails you receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email.enabled}
                    onCheckedChange={(checked) => updateNotification('email', 'enabled', checked)}
                  />
                </div>

                {notifications.email.enabled && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Marketing Emails</Label>
                          <p className="text-sm text-muted-foreground">
                            Product updates, tips, and promotional content
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email.marketing}
                          onCheckedChange={(checked) => updateNotification('email', 'marketing', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Product Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            New features and improvements
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email.productUpdates}
                          onCheckedChange={(checked) => updateNotification('email', 'productUpdates', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Security Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Important security notifications
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email.securityAlerts}
                          onCheckedChange={(checked) => updateNotification('email', 'securityAlerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Weekly Digest</Label>
                          <p className="text-sm text-muted-foreground">
                            Weekly summary of your activity
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email.weeklyDigest}
                          onCheckedChange={(checked) => updateNotification('email', 'weeklyDigest', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Comments</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify when someone comments on your videos
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email.comments}
                          onCheckedChange={(checked) => updateNotification('email', 'comments', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Mentions</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify when someone mentions you
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email.mentions}
                          onCheckedChange={(checked) => updateNotification('email', 'mentions', checked)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  Receive notifications on your device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your device
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push.enabled}
                    onCheckedChange={(checked) => updateNotification('push', 'enabled', checked)}
                  />
                </div>

                {notifications.push.enabled && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>New Videos</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify when new videos are published
                          </p>
                        </div>
                        <Switch
                          checked={notifications.push.newVideos}
                          onCheckedChange={(checked) => updateNotification('push', 'newVideos', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Comments</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify about new comments
                          </p>
                        </div>
                        <Switch
                          checked={notifications.push.comments}
                          onCheckedChange={(checked) => updateNotification('push', 'comments', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Mentions</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify when someone mentions you
                          </p>
                        </div>
                        <Switch
                          checked={notifications.push.mentions}
                          onCheckedChange={(checked) => updateNotification('push', 'mentions', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Security Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Important security notifications
                          </p>
                        </div>
                        <Switch
                          checked={notifications.push.securityAlerts}
                          onCheckedChange={(checked) => updateNotification('push', 'securityAlerts', checked)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* In-App Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  In-App Notifications
                </CardTitle>
                <CardDescription>
                  Notifications within the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable In-App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications within the app
                    </p>
                  </div>
                  <Switch
                    checked={notifications.inApp.enabled}
                    onCheckedChange={(checked) => updateNotification('inApp', 'enabled', checked)}
                  />
                </div>

                {notifications.inApp.enabled && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>New Videos</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify about new video publications
                          </p>
                        </div>
                        <Switch
                          checked={notifications.inApp.newVideos}
                          onCheckedChange={(checked) => updateNotification('inApp', 'newVideos', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Comments</Label>
                          <p className="text-sm text-muted-foreground">
                            Show comment notifications
                          </p>
                        </div>
                        <Switch
                          checked={notifications.inApp.comments}
                          onCheckedChange={(checked) => updateNotification('inApp', 'comments', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Mentions</Label>
                          <p className="text-sm text-muted-foreground">
                            Show mention notifications
                          </p>
                        </div>
                        <Switch
                          checked={notifications.inApp.mentions}
                          onCheckedChange={(checked) => updateNotification('inApp', 'mentions', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>System Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Important system announcements
                          </p>
                        </div>
                        <Switch
                          checked={notifications.inApp.systemUpdates}
                          onCheckedChange={(checked) => updateNotification('inApp', 'systemUpdates', checked)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
          </form>
        )}
      </div>
    </div>
  )
}

