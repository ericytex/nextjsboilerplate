'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Lock, 
  Key, 
  Shield, 
  Activity,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"

export default function SecurityPage() {
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [apiKeys, setApiKeys] = useState<Array<{
    id: string
    name: string
    key?: string
    lastUsed: string
    createdAt: string
    permissions: string[]
    expiresAt?: string | null
    isExpired?: boolean
  }>>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read'])
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ key: string; name: string } | null>(null)

  const [activityLog] = useState([
    {
      id: '1',
      action: 'API Key Created',
      ip: '192.168.1.1',
      location: 'San Francisco, US',
      timestamp: '2024-01-15 10:30 AM',
      status: 'success'
    },
    {
      id: '2',
      action: 'Login',
      ip: '192.168.1.1',
      location: 'San Francisco, US',
      timestamp: '2024-01-15 09:15 AM',
      status: 'success'
    },
    {
      id: '3',
      action: 'Failed Login Attempt',
      ip: '203.0.113.0',
      location: 'Unknown',
      timestamp: '2024-01-14 11:45 PM',
      status: 'failed'
    }
  ])

  // Fetch API keys on mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const userId = localStorage.getItem('user_id')
        if (!userId) {
          setLoadingKeys(false)
          return
        }

        const response = await fetch(`/api/user/api-keys?userId=${userId}`)
        const data = await response.json()

        if (data.success && data.apiKeys) {
          setApiKeys(data.apiKeys)
        }
      } catch (error) {
        console.error('Failed to fetch API keys:', error)
      } finally {
        setLoadingKeys(false)
      }
    }

    fetchApiKeys()
  }, [])

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    setLoading(true)
    try {
      const userId = localStorage.getItem('user_id')
      if (!userId) {
        toast.error('Please sign in to create an API key')
        setLoading(false)
        return
      }

      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: newKeyName.trim(),
          permissions: newKeyPermissions
        })
      })

      const data = await response.json()

      if (data.success && data.apiKey) {
        setNewlyCreatedKey({ key: data.apiKey, name: data.keyInfo.name })
        setNewKeyName('')
        setNewKeyPermissions(['read'])
        setShowCreateForm(false)
        // Refresh API keys list
        const keysResponse = await fetch(`/api/user/api-keys?userId=${userId}`)
        const keysData = await keysResponse.json()
        if (keysData.success && keysData.apiKeys) {
          setApiKeys(keysData.apiKeys)
        }
      } else {
        toast.error(data.error || 'Failed to create API key')
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      toast.error('Failed to create API key')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      const userId = localStorage.getItem('user_id')
      if (!userId) {
        toast.error('Please sign in to delete an API key')
        return
      }

      const response = await fetch(`/api/user/api-keys?userId=${userId}&keyId=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setApiKeys(apiKeys.filter(key => key.id !== id))
        toast.success('API key deleted')
      } else {
        toast.error(data.error || 'Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  const handleCopyApiKey = (key?: string) => {
    if (!key) {
      toast.error('API key not available')
      return
    }
    navigator.clipboard.writeText(key)
    toast.success('API key copied to clipboard')
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage API keys, access tokens, and view security activity logs
          </p>
        </div>

        <div className="grid gap-6">
          {/* API Keys */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Manage your API keys for programmatic access
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateForm(true)} disabled={loading}>
                  <Key className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingKeys ? (
                <div className="text-center py-8 text-muted-foreground">Loading API keys...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No API keys yet</p>
                  <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)}>
                    Create your first API key
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{apiKey.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {apiKey.permissions.join(', ')}
                            </Badge>
                            {apiKey.isExpired && (
                              <Badge variant="destructive" className="text-xs">Expired</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              sk_••••••••••••••••••••••••••••••••
                            </code>
                            <p className="text-xs text-muted-foreground">Key hidden for security</p>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                            <span>Last used: {apiKey.lastUsed}</span>
                            {apiKey.expiresAt && (
                              <span>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create API Key Form */}
              {showCreateForm && (
                <div className="mt-6 p-4 border rounded-lg space-y-4 bg-muted/50">
                  <div>
                    <Label htmlFor="keyName">API Key Name</Label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API Key"
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Give your API key a descriptive name to identify it later
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateApiKey}
                      disabled={loading || !newKeyName.trim()}
                    >
                      {loading ? 'Creating...' : 'Create API Key'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewKeyName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Show newly created key */}
              {newlyCreatedKey && (
                <div className="mt-6 p-4 border-2 border-amber-500 rounded-lg bg-amber-50 dark:bg-amber-900/20 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        ⚠️ Save this API key now!
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                        This is the only time you&apos;ll be able to see this key. Make sure to copy it and store it securely.
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded border flex-1 font-mono break-all">
                          {newlyCreatedKey.key}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyApiKey(newlyCreatedKey.key)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                        Key name: {newlyCreatedKey.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewlyCreatedKey(null)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Security Activity Log
              </CardTitle>
              <CardDescription>
                Recent security-related activities on your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityLog.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        activity.status === 'success' 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : 'bg-red-100 dark:bg-red-900'
                      }`}>
                        {activity.status === 'success' ? (
                          <CheckCircle2 className={`h-5 w-5 ${
                            activity.status === 'success' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`} />
                        ) : (
                          <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.ip} • {activity.location} • {activity.timestamp}
                        </p>
                      </div>
                    </div>
                    <Badge variant={activity.status === 'success' ? 'default' : 'destructive'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Data Export</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Download a copy of all your data
                </p>
                <Button variant="outline" size="sm">
                  Export Data
                </Button>
              </div>

              <Separator />

              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium mb-2 text-destructive">Danger Zone</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data
                </p>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

