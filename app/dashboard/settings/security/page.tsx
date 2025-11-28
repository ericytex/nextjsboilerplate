'use client'

import { useState } from 'react'
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
  const [showApiKey, setShowApiKey] = useState(false)

  const [apiKeys, setApiKeys] = useState([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_51H...',
      lastUsed: '2024-01-15',
      createdAt: '2023-12-01',
      permissions: ['read', 'write']
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'sk_test_42K...',
      lastUsed: '2024-01-10',
      createdAt: '2024-01-01',
      permissions: ['read']
    }
  ])

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

  const handleCreateApiKey = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newKey = {
        id: Date.now().toString(),
        name: `API Key ${apiKeys.length + 1}`,
        key: `sk_${Math.random().toString(36).substring(2, 15)}...`,
        lastUsed: 'Never',
        createdAt: new Date().toISOString().split('T')[0],
        permissions: ['read', 'write']
      }
      setApiKeys([...apiKeys, newKey])
      toast.success('API key created successfully')
    } catch (error) {
      toast.error('Failed to create API key')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteApiKey = (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }
    setApiKeys(apiKeys.filter(key => key.id !== id))
    toast.success('API key deleted')
  }

  const handleCopyApiKey = (key: string) => {
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
                <Button onClick={handleCreateApiKey} disabled={loading}>
                  <Key className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{apiKey.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {apiKey.permissions.join(', ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {showApiKey ? apiKey.key : '••••••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyApiKey(apiKey.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                          <span>Last used: {apiKey.lastUsed === 'Never' ? 'Never' : new Date(apiKey.lastUsed).toLocaleDateString()}</span>
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

