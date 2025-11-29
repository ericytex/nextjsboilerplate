'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Save, Upload, User, Mail, Phone, MapPin, Calendar, Crown } from "lucide-react"
import { toast } from "sonner"

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

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    company: '',
    website: '',
    avatar: ''
  })

  // Fetch user profile and subscription
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('user_id')
        if (!userId) {
          setProfileLoading(false)
          setSubscriptionLoading(false)
          return
        }

        // Fetch profile and subscription in parallel
        const [profileResponse, subscriptionResponse] = await Promise.all([
          fetch(`/api/user/profile?userId=${userId}`),
          fetch(`/api/user/subscription?userId=${userId}`)
        ])

        const profileData = await profileResponse.json()
        const subscriptionData = await subscriptionResponse.json()

        if (profileData.success && profileData.profile) {
          setFormData({
            fullName: profileData.profile.fullName || '',
            email: profileData.profile.email || '',
            phone: profileData.profile.phone || '',
            location: profileData.profile.location || '',
            bio: profileData.profile.bio || '',
            company: profileData.profile.company || '',
            website: profileData.profile.website || '',
            avatar: profileData.profile.avatar || ''
          })
        }

        if (subscriptionData.success && subscriptionData.subscription) {
          setSubscription(subscriptionData.subscription)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setProfileLoading(false)
        setSubscriptionLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userId = localStorage.getItem('user_id')
      if (!userId) {
        toast.error('Please sign in to update your profile')
        setLoading(false)
        return
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fullName: formData.fullName,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          company: formData.company,
          website: formData.website,
          avatar: formData.avatar
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Profile updated successfully')
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // For now, convert to base64 data URL
      // TODO: Upload to storage service (Supabase Storage, AWS S3, etc.)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string })
        toast.info('Avatar preview updated. Save to persist changes.')
      }
      reader.onerror = () => {
        toast.error('Failed to read image file')
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and account details
          </p>
        </div>

        {profileLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Avatar Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>
                    Upload a new profile picture. Recommended size: 400x400px
                  </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={formData.avatar} alt={formData.fullName} />
                    <AvatarFallback className="text-2xl">
                      {formData.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Subscription Plan
                </CardTitle>
                <CardDescription>
                  Your current subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionLoading ? (
                  <div className="text-sm text-muted-foreground">Loading subscription...</div>
                ) : subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">{subscription.planDisplayName} Plan</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} billing
                        </p>
                      </div>
                      <Badge 
                        variant={
                          subscription.status === 'active' 
                            ? 'default' 
                            : subscription.status === 'trialing'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {subscription.isTrial ? 'Trial' : subscription.status}
                      </Badge>
                    </div>

                    {subscription.currentPeriodEnd && (
                      <>
                        <Separator />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {subscription.isTrial ? 'Trial ends' : 'Next billing'}:{' '}
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </>
                    )}

                    {subscription.cancelAtPeriodEnd && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                        Subscription will be cancelled at the end of the billing period
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No active subscription</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/pricing">View Plans</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your basic account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bio Section */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>About</CardTitle>
                <CardDescription>
                  Tell us about yourself
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Write a short bio about yourself..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

            <div className="mt-6 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

