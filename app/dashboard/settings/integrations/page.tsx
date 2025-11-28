'use client'

import { useState, useEffect } from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Database, 
  Key, 
  CreditCard, 
  BarChart3, 
  Search, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Info,
  Save
} from 'lucide-react'

interface IntegrationConfig {
  enabled: boolean
  apiKey?: string
  secretKey?: string
  databaseUrl?: string
  customSettings?: Record<string, any>
}

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  config: IntegrationConfig
  documentation: string
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<Record<string, 'success' | 'error' | null>>({})

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/settings/integrations')
      const data = await response.json()
      setIntegrations(data.integrations || getDefaultIntegrations())
    } catch (error) {
      console.error('Failed to load integrations:', error)
      setIntegrations(getDefaultIntegrations())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultIntegrations = (): Integration[] => [
    {
      id: 'nextauth',
      name: 'NextAuth.js',
      description: 'Authentication provider for user login and session management',
      icon: <Shield className="h-5 w-5" />,
      category: 'Authentication',
      config: {
        enabled: false,
        apiKey: '',
        secretKey: '',
        customSettings: {
          providers: ['google', 'github'],
          sessionStrategy: 'jwt'
        }
      },
      documentation: 'https://next-auth.js.org/getting-started/introduction'
    },
    {
      id: 'prisma',
      name: 'Prisma + PostgreSQL',
      description: 'Database ORM and PostgreSQL connection for data persistence',
      icon: <Database className="h-5 w-5" />,
      category: 'Database',
      config: {
        enabled: false,
        databaseUrl: '',
        customSettings: {
          connectionPool: 10,
          ssl: true
        }
      },
      documentation: 'https://www.prisma.io/docs/getting-started'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing for subscriptions and one-time payments',
      icon: <CreditCard className="h-5 w-5" />,
      category: 'Payments',
      config: {
        enabled: false,
        apiKey: '',
        secretKey: '',
        customSettings: {
          webhookSecret: '',
          currency: 'usd'
        }
      },
      documentation: 'https://stripe.com/docs'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Track user behavior and application metrics',
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'Analytics',
      config: {
        enabled: false,
        apiKey: '',
        customSettings: {
          trackingId: '',
          enablePageViews: true,
          enableEvents: true
        }
      },
      documentation: 'https://developers.google.com/analytics'
    },
    {
      id: 'algolia',
      name: 'Algolia Search',
      description: 'Powerful search functionality with instant results',
      icon: <Search className="h-5 w-5" />,
      category: 'Search',
      config: {
        enabled: false,
        apiKey: '',
        secretKey: '',
        customSettings: {
          appId: '',
          indexName: 'main'
        }
      },
      documentation: 'https://www.algolia.com/doc/'
    }
  ]

  const handleToggle = async (integrationId: string, enabled: boolean) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, config: { ...integration.config, enabled } }
        : integration
    ))
    
    await saveIntegration(integrationId, { enabled })
  }

  const handleConfigChange = (integrationId: string, field: string, value: any) => {
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === integrationId) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.')
          return {
            ...integration,
            config: {
              ...integration.config,
              customSettings: {
                ...integration.config.customSettings,
                [child]: value
              }
            }
          }
        }
        return {
          ...integration,
          config: {
            ...integration.config,
            [field]: value
          }
        }
      }
      return integration
    }))
  }

  const saveIntegration = async (integrationId: string, updates: Partial<IntegrationConfig>) => {
    setSaving(integrationId)
    setSaveStatus({ ...saveStatus, [integrationId]: null })

    try {
      const integration = integrations.find(i => i.id === integrationId)
      if (!integration) return

      const response = await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId,
          config: { ...integration.config, ...updates }
        })
      })

      if (response.ok) {
        setSaveStatus({ ...saveStatus, [integrationId]: 'success' })
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [integrationId]: null }))
        }, 3000)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Failed to save integration:', error)
      setSaveStatus({ ...saveStatus, [integrationId]: 'error' })
    } finally {
      setSaving(null)
    }
  }

  const handleSave = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId)
    if (!integration) return

    await saveIntegration(integrationId, integration.config)
  }

  const categories = ['All', 'Authentication', 'Database', 'Payments', 'Analytics', 'Search']
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredIntegrations = selectedCategory === 'All' 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory)

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex items-center justify-center h-screen">
            <div className="text-gray-500">Loading integrations...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Integrations</h1>
                <p className="text-gray-600 mt-1">Configure and manage your application integrations</p>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="all" onClick={() => setSelectedCategory('All')}>All</TabsTrigger>
                <TabsTrigger value="active" onClick={() => setSelectedCategory('All')}>
                  Active ({integrations.filter(i => i.config.enabled).length})
                </TabsTrigger>
                <TabsTrigger value="inactive" onClick={() => setSelectedCategory('All')}>
                  Inactive ({integrations.filter(i => !i.config.enabled).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid gap-6">
                  {filteredIntegrations.map((integration) => (
                    <Card key={integration.id} className="relative">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {integration.icon}
                            </div>
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {integration.name}
                                {integration.config.enabled ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {integration.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`toggle-${integration.id}`} className="text-sm">
                                {integration.config.enabled ? 'Enabled' : 'Disabled'}
                              </Label>
                              <Switch
                                id={`toggle-${integration.id}`}
                                checked={integration.config.enabled}
                                onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                              />
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      {integration.config.enabled && (
                        <CardContent className="space-y-4">
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              Configuration
                            </h4>

                            <div className="grid gap-4">
                              {integration.id === 'prisma' && (
                                <div className="space-y-2">
                                  <Label htmlFor={`db-url-${integration.id}`}>Database URL</Label>
                                  <Input
                                    id={`db-url-${integration.id}`}
                                    type="password"
                                    placeholder="postgresql://user:password@localhost:5432/dbname"
                                    value={integration.config.databaseUrl || ''}
                                    onChange={(e) => {
                                      handleConfigChange(integration.id, 'databaseUrl', e.target.value)
                                    }}
                                  />
                                </div>
                              )}

                              {(integration.id === 'nextauth' || integration.id === 'stripe' || integration.id === 'algolia') && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor={`api-key-${integration.id}`}>API Key</Label>
                                    <Input
                                      id={`api-key-${integration.id}`}
                                      type="password"
                                      placeholder="Enter your API key"
                                      value={integration.config.apiKey || ''}
                                      onChange={(e) => {
                                        handleConfigChange(integration.id, 'apiKey', e.target.value)
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`secret-key-${integration.id}`}>Secret Key</Label>
                                    <Input
                                      id={`secret-key-${integration.id}`}
                                      type="password"
                                      placeholder="Enter your secret key"
                                      value={integration.config.secretKey || ''}
                                      onChange={(e) => {
                                        handleConfigChange(integration.id, 'secretKey', e.target.value)
                                      }}
                                    />
                                  </div>
                                </>
                              )}

                              {integration.id === 'analytics' && (
                                <div className="space-y-2">
                                  <Label htmlFor={`tracking-id-${integration.id}`}>Tracking ID</Label>
                                  <Input
                                    id={`tracking-id-${integration.id}`}
                                    placeholder="G-XXXXXXXXXX"
                                    value={integration.config.customSettings?.trackingId || ''}
                                    onChange={(e) => {
                                      handleConfigChange(integration.id, 'customSettings.trackingId', e.target.value)
                                    }}
                                  />
                                </div>
                              )}

                              {integration.id === 'algolia' && (
                                <div className="space-y-2">
                                  <Label htmlFor={`app-id-${integration.id}`}>Application ID</Label>
                                  <Input
                                    id={`app-id-${integration.id}`}
                                    placeholder="Your Algolia App ID"
                                    value={integration.config.customSettings?.appId || ''}
                                    onChange={(e) => {
                                      handleConfigChange(integration.id, 'customSettings.appId', e.target.value)
                                    }}
                                  />
                                </div>
                              )}

                              {integration.id === 'stripe' && (
                                <div className="space-y-2">
                                  <Label htmlFor={`webhook-secret-${integration.id}`}>Webhook Secret</Label>
                                  <Input
                                    id={`webhook-secret-${integration.id}`}
                                    type="password"
                                    placeholder="whsec_..."
                                    value={integration.config.customSettings?.webhookSecret || ''}
                                    onChange={(e) => {
                                      handleConfigChange(integration.id, 'customSettings.webhookSecret', e.target.value)
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                              <a
                                href={integration.documentation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Info className="h-4 w-4" />
                                View Documentation
                              </a>
                              <div className="flex items-center gap-2">
                                {saveStatus[integration.id] === 'success' && (
                                  <span className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Saved
                                  </span>
                                )}
                                {saveStatus[integration.id] === 'error' && (
                                  <span className="text-sm text-red-600 flex items-center gap-1">
                                    <XCircle className="h-4 w-4" />
                                    Error
                                  </span>
                                )}
                                <Button
                                  onClick={() => handleSave(integration.id)}
                                  disabled={saving === integration.id}
                                  size="sm"
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  {saving === integration.id ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

