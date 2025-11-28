'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  Save,
  ExternalLink,
  TestTube,
  AlertCircle,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react'
import { toast } from "sonner"

interface IntegrationConfig {
  enabled: boolean
  apiKey?: string
  secretKey?: string
  databaseUrl?: string
  customSettings?: Record<string, any>
  connectionStatus?: 'connected' | 'disconnected' | 'testing' | 'error'
}

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  config: IntegrationConfig
  documentation: string
  setupSteps?: string[]
  requiredFields?: string[]
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/settings/integrations')
      const data = await response.json()
      // Always use default integrations if API returns empty or no integrations
      const defaultIntegrations = getDefaultIntegrations()
      if (data.integrations && Array.isArray(data.integrations) && data.integrations.length > 0) {
        // Merge API data with defaults, keeping API configs where they exist
        const merged = defaultIntegrations.map(defaultInt => {
          const apiInt = data.integrations.find((api: any) => api.id === defaultInt.id)
          return apiInt ? { ...defaultInt, config: apiInt.config || defaultInt.config } : defaultInt
        })
        setIntegrations(merged)
      } else {
        setIntegrations(defaultIntegrations)
      }
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
        connectionStatus: 'disconnected',
        customSettings: {
          providers: ['google', 'github'],
          sessionStrategy: 'jwt',
          baseUrl: ''
        }
      },
      documentation: 'https://next-auth.js.org/getting-started/introduction',
      setupSteps: [
        'Install NextAuth.js: npm install next-auth',
        'Create API route at /api/auth/[...nextauth].ts',
        'Add NEXTAUTH_SECRET to your environment variables',
        'Configure OAuth providers (Google, GitHub, etc.)'
      ],
      requiredFields: ['secretKey', 'baseUrl']
    },
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Open-source Firebase alternative with PostgreSQL database, authentication, and real-time subscriptions',
      icon: <Database className="h-5 w-5" />,
      category: 'Database',
      config: {
        enabled: false,
        apiKey: '',
        secretKey: '',
        databaseUrl: '',
        connectionStatus: 'disconnected',
        customSettings: {
          projectUrl: '',
          anonKey: '',
          serviceRoleKey: '',
          poolerUrl: '',
          poolSize: 10,
          connectionTimeout: 5000
        }
      },
      documentation: 'https://supabase.com/docs',
      setupSteps: [
        'Create a Supabase project at supabase.com',
        'Get your Project URL and API keys from Settings > API',
        'Copy your anon/public key and service role key',
        'Add SUPABASE_URL and SUPABASE_ANON_KEY to environment variables'
      ],
      requiredFields: ['customSettings.projectUrl', 'customSettings.anonKey']
    },
    {
      id: 'prisma',
      name: 'Prisma + PostgreSQL',
      description: 'Next-generation ORM for Node.js and TypeScript with PostgreSQL support',
      icon: <Database className="h-5 w-5" />,
      category: 'Database',
      config: {
        enabled: false,
        databaseUrl: '',
        connectionStatus: 'disconnected',
        customSettings: {
          connectionPool: 10,
          ssl: true
        }
      },
      documentation: 'https://www.prisma.io/docs/getting-started',
      setupSteps: [
        'Install Prisma: npm install prisma @prisma/client',
        'Initialize Prisma: npx prisma init',
        'Set DATABASE_URL in your .env file',
        'Run migrations: npx prisma migrate dev'
      ],
      requiredFields: ['databaseUrl']
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
        connectionStatus: 'disconnected',
        customSettings: {
          webhookSecret: '',
          currency: 'usd',
          publishableKey: ''
        }
      },
      documentation: 'https://stripe.com/docs',
      setupSteps: [
        'Create a Stripe account at stripe.com',
        'Get your API keys from Dashboard > Developers > API keys',
        'Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to environment variables',
        'Set up webhooks for payment events'
      ],
      requiredFields: ['secretKey', 'customSettings.publishableKey']
    },
    {
      id: 'creem',
      name: 'Creem.io',
      description: 'Payment gateway for subscriptions and checkout management',
      icon: <CreditCard className="h-5 w-5" />,
      category: 'Payments',
      config: {
        enabled: false,
        apiKey: '',
        secretKey: '',
        connectionStatus: 'disconnected',
        customSettings: {
          merchantId: '',
          checkoutUrl: '',
          webhookUrl: ''
        }
      },
      documentation: 'https://creem.io/docs',
      setupSteps: [
        'Sign up for Creem.io account',
        'Get your Merchant ID and API keys from dashboard',
        'Configure checkout URLs for each plan',
        'Set up webhook endpoints for payment events'
      ],
      requiredFields: ['apiKey', 'customSettings.merchantId']
    },
    {
      id: 'analytics',
      name: 'Google Analytics',
      description: 'Track user behavior and application metrics',
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'Analytics',
      config: {
        enabled: false,
        apiKey: '',
        connectionStatus: 'disconnected',
        customSettings: {
          trackingId: '',
          enablePageViews: true,
          enableEvents: true
        }
      },
      documentation: 'https://developers.google.com/analytics',
      setupSteps: [
        'Create a Google Analytics property',
        'Get your Measurement ID (G-XXXXXXXXXX)',
        'Add GA_MEASUREMENT_ID to environment variables',
        'Install gtag.js in your application'
      ],
      requiredFields: ['customSettings.trackingId']
    },
    {
      id: 'algolia',
      name: 'Algolia Search',
      description: 'Powerful search functionality with instant results and typo tolerance',
      icon: <Search className="h-5 w-5" />,
      category: 'Search',
      config: {
        enabled: false,
        apiKey: '',
        secretKey: '',
        connectionStatus: 'disconnected',
        customSettings: {
          appId: '',
          indexName: 'main',
          searchOnlyKey: ''
        }
      },
      documentation: 'https://www.algolia.com/doc/',
      setupSteps: [
        'Create an Algolia account',
        'Get your Application ID and API keys',
        'Create an index for your data',
        'Add ALGOLIA_APP_ID and ALGOLIA_API_KEY to environment variables'
      ],
      requiredFields: ['customSettings.appId', 'apiKey']
    }
  ]

  const handleToggle = async (integrationId: string, enabled: boolean) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, config: { ...integration.config, enabled, connectionStatus: enabled ? 'disconnected' : 'disconnected' } }
        : integration
    ))
    
    // Get the full config for this integration and save
    const integration = integrations.find(i => i.id === integrationId)
    if (integration) {
      const updatedConfig = { ...integration.config, enabled }
      const result = await saveIntegration(integrationId, updatedConfig)
      // Show appropriate message based on persistence
      if (result?.persisted) {
        toast.success(`${integration.name} ${enabled ? 'enabled' : 'disabled'}`)
      }
    }
  }

  const handleSave = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId)
    if (!integration) return

    const result = await saveIntegration(integrationId, integration.config)
    
    // Show special message for Supabase setup
    if (integrationId === 'supabase' && result?.needsTable) {
      toast.error('Database table not found. Please create it first.', {
        description: 'Check DATABASE_SETUP.md for SQL schema',
        duration: 10000,
        action: {
          label: 'View SQL',
          onClick: () => {
            // Copy SQL to clipboard
            const sql = `CREATE TABLE IF NOT EXISTS integration_configs (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
            navigator.clipboard.writeText(sql)
            toast.success('SQL copied to clipboard!')
          }
        }
      })
    } else if (integrationId === 'supabase' && result?.persisted) {
      toast.success('🎉 Supabase configured! All configurations will now persist to database.', {
        duration: 5000
      })
    } else if (!result?.persisted && integrationId !== 'supabase') {
      toast.warning('Configuration saved temporarily. Set up Supabase database for persistence.', {
        duration: 5000
      })
    }
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

  const testConnection = async (integrationId: string) => {
    setTesting(integrationId)
    const integration = integrations.find(i => i.id === integrationId)
    if (!integration) return

    setIntegrations(prev => prev.map(i => 
      i.id === integrationId 
        ? { ...i, config: { ...i.config, connectionStatus: 'testing' } }
        : i
    ))

    try {
      // Test Supabase connection specifically
      if (integrationId === 'supabase') {
        const projectUrl = integration.config.customSettings?.projectUrl
        const anonKey = integration.config.customSettings?.anonKey
        
        if (!projectUrl || !anonKey) {
          throw new Error('Please enter Project URL and Anon Key to test connection')
        }

        // Test Supabase connection with credentials from form
        const response = await fetch('/api/supabase/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: projectUrl,
            key: anonKey
          })
        })

        const data = await response.json()
        
        if (data.connected) {
          setIntegrations(prev => prev.map(i => 
            i.id === integrationId 
              ? { ...i, config: { ...i.config, connectionStatus: 'connected' } }
              : i
          ))
          toast.success('✅ Supabase connection successful! You can now save and start using it.')
        } else {
          throw new Error(data.error || 'Connection failed')
        }
      } else {
        // Generic connection test for other integrations
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const isConfigured = integration.requiredFields?.some(field => {
          if (field.includes('.')) {
            const [parent, child] = field.split('.')
            return integration.config.customSettings?.[child]
          }
          return integration.config[field as keyof IntegrationConfig]
        }) || false
        
        if (isConfigured) {
          setIntegrations(prev => prev.map(i => 
            i.id === integrationId 
              ? { ...i, config: { ...i.config, connectionStatus: 'connected' } }
              : i
          ))
          toast.success(`${integration.name} configuration looks good!`)
        } else {
          throw new Error('Please complete the required fields')
        }
      }
    } catch (error: any) {
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, config: { ...i.config, connectionStatus: 'error' } }
          : i
      ))
      toast.error(error.message || `Failed to test ${integration.name} connection`)
    } finally {
      setTesting(null)
    }
  }

  const saveIntegration = async (integrationId: string, config: IntegrationConfig) => {
    setSaving(integrationId)

    try {
      const integration = integrations.find(i => i.id === integrationId)
      if (!integration) return null

      const response = await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId,
          config
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Don't show toast here - handleSave will show appropriate message
        return data
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error: any) {
      console.error('Failed to save integration:', error)
      return { error: error.message, persisted: false }
    } finally {
      setSaving(null)
    }
  }

  const toggleSecretVisibility = (integrationId: string, field: string) => {
    const key = `${integrationId}-${field}`
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const categories = ['All', 'Authentication', 'Database', 'Payments', 'Analytics', 'Search']
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredIntegrations = selectedCategory === 'All' 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading integrations...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Configure and manage key integrations for your application. Enable services and add your API keys to get started.
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              💡 How to use:
            </p>
            <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Toggle ON the integration you want to configure</li>
              <li>Enter your API keys and credentials in the form</li>
              <li>Click "Test Connection" to verify your credentials</li>
              <li>Click "Save Changes" to store your configuration</li>
            </ol>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
              {category !== 'All' && (
                <Badge variant="secondary" className="ml-2">
                  {integrations.filter(i => i.category === category).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Integrations List */}
        <div className="grid gap-6">
          {filteredIntegrations.map((integration) => {
            const isConfigured = integration.requiredFields?.some(field => {
              if (field.includes('.')) {
                const [parent, child] = field.split('.')
                return integration.config.customSettings?.[child]
              }
              return integration.config[field as keyof IntegrationConfig]
            }) || false

            return (
              <Card key={integration.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${
                        integration.config.enabled 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : 'bg-muted'
                      }`}>
                        {integration.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle>{integration.name}</CardTitle>
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
                          {integration.config.connectionStatus === 'connected' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                          {integration.config.connectionStatus === 'error' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mb-3">
                          {integration.description}
                        </CardDescription>
                        {integration.setupSteps && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              Quick Setup:
                            </p>
                            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                              {integration.setupSteps.slice(0, 2).map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`toggle-${integration.id}`} className="text-sm font-medium">
                            {integration.config.enabled ? (
                              <span className="text-green-600 dark:text-green-400">Enabled</span>
                            ) : (
                              <span className="text-gray-500">Disabled</span>
                            )}
                          </Label>
                          <Switch
                            id={`toggle-${integration.id}`}
                            checked={integration.config.enabled}
                            onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>
                        {!integration.config.enabled && (
                          <p className="text-xs text-muted-foreground">Toggle ON to configure</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {integration.config.enabled && (
                  <CardContent className="space-y-6">
                    <Separator />

                    {/* Configuration Fields */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Configuration
                      </h4>

                      {/* Supabase Database Configuration */}
                      {integration.id === 'supabase' && (
                        <div className="space-y-4 p-4 bg-muted rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="h-4 w-4" />
                            <h5 className="font-semibold text-sm">Database Connection</h5>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`db-url-${integration.id}`}>
                              Connection String (PostgreSQL) <span className="text-xs text-muted-foreground">(Optional)</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id={`db-url-${integration.id}`}
                                type={showSecrets[`${integration.id}-databaseUrl`] ? 'text' : 'password'}
                                placeholder="postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres"
                                value={integration.config.databaseUrl || ''}
                                onChange={(e) => {
                                  handleConfigChange(integration.id, 'databaseUrl', e.target.value)
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => toggleSecretVisibility(integration.id, 'databaseUrl')}
                              >
                                {showSecrets[`${integration.id}-databaseUrl`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>• Found in: Supabase Dashboard → Settings → Database → Connection string</p>
                              <p>• Use this for direct PostgreSQL connections (Prisma, raw SQL, etc.)</p>
                              <p>• Format: <code className="bg-background px-1 rounded">postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres</code></p>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <Label htmlFor={`db-pooler-${integration.id}`}>
                              Connection Pooler URL <span className="text-xs text-muted-foreground">(Optional - Recommended)</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id={`db-pooler-${integration.id}`}
                                type={showSecrets[`${integration.id}-poolerUrl`] ? 'text' : 'password'}
                                placeholder="postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
                                value={integration.config.customSettings?.poolerUrl || ''}
                                onChange={(e) => {
                                  handleConfigChange(integration.id, 'customSettings.poolerUrl', e.target.value)
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => toggleSecretVisibility(integration.id, 'poolerUrl')}
                              >
                                {showSecrets[`${integration.id}-poolerUrl`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>• Found in: Supabase Dashboard → Settings → Database → Connection pooling</p>
                              <p>• Use for serverless/edge functions (better connection management)</p>
                              <p>• Supports up to 15,000 concurrent connections</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`db-pool-size-${integration.id}`}>
                                Pool Size <span className="text-xs text-muted-foreground">(Optional)</span>
                              </Label>
                              <Input
                                id={`db-pool-size-${integration.id}`}
                                type="number"
                                min="1"
                                max="100"
                                placeholder="10"
                                value={integration.config.customSettings?.poolSize || '10'}
                                onChange={(e) => {
                                  handleConfigChange(integration.id, 'customSettings.poolSize', parseInt(e.target.value) || 10)
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                Number of connections in pool (default: 10)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`db-timeout-${integration.id}`}>
                                Connection Timeout (ms) <span className="text-xs text-muted-foreground">(Optional)</span>
                              </Label>
                              <Input
                                id={`db-timeout-${integration.id}`}
                                type="number"
                                min="1000"
                                max="30000"
                                placeholder="5000"
                                value={integration.config.customSettings?.connectionTimeout || '5000'}
                                onChange={(e) => {
                                  handleConfigChange(integration.id, 'customSettings.connectionTimeout', parseInt(e.target.value) || 5000)
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                Timeout in milliseconds (default: 5000)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div className="text-xs text-amber-800 dark:text-amber-200">
                              <p className="font-medium mb-1">Database Connection Tips:</p>
                              <ul className="space-y-1 list-disc list-inside">
                                <li>Use <strong>Connection Pooler</strong> for serverless/edge functions</li>
                                <li>Use <strong>Direct Connection</strong> for long-lived server connections</li>
                                <li>Pooler URL uses port <code>6543</code> (transaction mode) or <code>5432</code> (session mode)</li>
                                <li>Direct connection always uses port <code>5432</code></li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Prisma Database URL */}
                      {integration.id === 'prisma' && (
                        <div className="space-y-2">
                          <Label htmlFor={`db-url-${integration.id}`}>
                            Database URL (PostgreSQL Connection String)
                          </Label>
                          <div className="relative">
                            <Input
                              id={`db-url-${integration.id}`}
                              type={showSecrets[`${integration.id}-databaseUrl`] ? 'text' : 'password'}
                              placeholder="postgresql://user:password@localhost:5432/dbname"
                              value={integration.config.databaseUrl || ''}
                              onChange={(e) => {
                                handleConfigChange(integration.id, 'databaseUrl', e.target.value)
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => toggleSecretVisibility(integration.id, 'databaseUrl')}
                            >
                              {showSecrets[`${integration.id}-databaseUrl`] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Your PostgreSQL connection string. Can use Supabase connection string.
                          </p>
                        </div>
                      )}

                      {/* Supabase Specific Fields */}
                      {integration.id === 'supabase' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`supabase-url-${integration.id}`}>Project URL *</Label>
                            <Input
                              id={`supabase-url-${integration.id}`}
                              type="url"
                              placeholder="https://[project-ref].supabase.co"
                              value={integration.config.customSettings?.projectUrl || ''}
                              onChange={(e) => {
                                handleConfigChange(integration.id, 'customSettings.projectUrl', e.target.value)
                              }}
                            />
                            <p className="text-xs text-muted-foreground">
                              Found in Supabase Dashboard → Settings → API → Project URL
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`supabase-anon-${integration.id}`}>Anon/Public Key *</Label>
                            <div className="relative">
                              <Input
                                id={`supabase-anon-${integration.id}`}
                                type={showSecrets[`${integration.id}-anonKey`] ? 'text' : 'password'}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                value={integration.config.customSettings?.anonKey || ''}
                                onChange={(e) => {
                                  handleConfigChange(integration.id, 'customSettings.anonKey', e.target.value)
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => toggleSecretVisibility(integration.id, 'anonKey')}
                              >
                                {showSecrets[`${integration.id}-anonKey`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Found in Supabase Dashboard → Settings → API → anon/public key
                            </p>
                          </div>
                          
                          {/* Quick Test Button - Only for Supabase */}
                          {integration.id === 'supabase' && (
                            <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  Ready to test?
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  Enter your Project URL and Anon Key above, then click Test Connection
                                </p>
                              </div>
                              <Button
                                type="button"
                                onClick={() => testConnection(integration.id)}
                                disabled={
                                  testing === integration.id || 
                                  !integration.config.customSettings?.projectUrl || 
                                  !integration.config.customSettings?.anonKey
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                size="sm"
                              >
                                <TestTube className="h-4 w-4 mr-2" />
                                {testing === integration.id ? 'Testing...' : 'Test Connection'}
                              </Button>
                            </div>
                          )}

                          <Separator />

                          <div className="space-y-2">
                            <Label htmlFor={`supabase-service-${integration.id}`}>Service Role Key (Optional)</Label>
                            <div className="relative">
                              <Input
                                id={`supabase-service-${integration.id}`}
                                type={showSecrets[`${integration.id}-serviceRoleKey`] ? 'text' : 'password'}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                value={integration.config.customSettings?.serviceRoleKey || ''}
                                onChange={(e) => {
                                  handleConfigChange(integration.id, 'customSettings.serviceRoleKey', e.target.value)
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => toggleSecretVisibility(integration.id, 'serviceRoleKey')}
                              >
                                {showSecrets[`${integration.id}-serviceRoleKey`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              ⚠️ Keep this secret! Only use for server-side operations.
                            </p>
                          </div>
                        </>
                      )}

                      {/* API Key & Secret Key (for most integrations) */}
                      {(integration.id === 'nextauth' || integration.id === 'stripe' || integration.id === 'creem' || integration.id === 'algolia') && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`api-key-${integration.id}`}>
                              {integration.id === 'nextauth' ? 'NEXTAUTH_SECRET' : 'API Key'}
                            </Label>
                            <div className="relative">
                              <Input
                                id={`api-key-${integration.id}`}
                                type={showSecrets[`${integration.id}-apiKey`] ? 'text' : 'password'}
                                placeholder="Enter your API key"
                                value={integration.config.apiKey || ''}
                                onChange={(e) => {
                                  handleConfigChange(integration.id, 'apiKey', e.target.value)
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => toggleSecretVisibility(integration.id, 'apiKey')}
                              >
                                {showSecrets[`${integration.id}-apiKey`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          {(integration.id === 'stripe' || integration.id === 'creem' || integration.id === 'algolia') && (
                            <div className="space-y-2">
                              <Label htmlFor={`secret-key-${integration.id}`}>Secret Key</Label>
                              <div className="relative">
                                <Input
                                  id={`secret-key-${integration.id}`}
                                  type={showSecrets[`${integration.id}-secretKey`] ? 'text' : 'password'}
                                  placeholder="Enter your secret key"
                                  value={integration.config.secretKey || ''}
                                  onChange={(e) => {
                                    handleConfigChange(integration.id, 'secretKey', e.target.value)
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => toggleSecretVisibility(integration.id, 'secretKey')}
                                >
                                  {showSecrets[`${integration.id}-secretKey`] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Creem.io Specific Fields */}
                      {integration.id === 'creem' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`creem-merchant-${integration.id}`}>Merchant ID</Label>
                            <Input
                              id={`creem-merchant-${integration.id}`}
                              placeholder="Your Creem.io merchant ID"
                              value={integration.config.customSettings?.merchantId || ''}
                              onChange={(e) => {
                                handleConfigChange(integration.id, 'customSettings.merchantId', e.target.value)
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`creem-webhook-${integration.id}`}>Webhook URL</Label>
                            <Input
                              id={`creem-webhook-${integration.id}`}
                              placeholder="https://yourdomain.com/api/webhooks/creem"
                              value={integration.config.customSettings?.webhookUrl || ''}
                              onChange={(e) => {
                                handleConfigChange(integration.id, 'customSettings.webhookUrl', e.target.value)
                              }}
                            />
                          </div>
                        </>
                      )}

                      {/* Stripe Specific Fields */}
                      {integration.id === 'stripe' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`stripe-publishable-${integration.id}`}>Publishable Key</Label>
                            <Input
                              id={`stripe-publishable-${integration.id}`}
                              placeholder="pk_live_..."
                              value={integration.config.customSettings?.publishableKey || ''}
                              onChange={(e) => {
                                handleConfigChange(integration.id, 'customSettings.publishableKey', e.target.value)
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`webhook-secret-${integration.id}`}>Webhook Secret</Label>
                            <div className="relative">
                              <Input
                                id={`webhook-secret-${integration.id}`}
                                type={showSecrets[`${integration.id}-webhookSecret`] ? 'text' : 'password'}
                                placeholder="whsec_..."
                                value={integration.config.customSettings?.webhookSecret || ''}
                                onChange={(e) => {
                                  handleConfigChange(integration.id, 'customSettings.webhookSecret', e.target.value)
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => toggleSecretVisibility(integration.id, 'webhookSecret')}
                              >
                                {showSecrets[`${integration.id}-webhookSecret`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Analytics Tracking ID */}
                      {integration.id === 'analytics' && (
                        <div className="space-y-2">
                          <Label htmlFor={`tracking-id-${integration.id}`}>Measurement ID</Label>
                          <Input
                            id={`tracking-id-${integration.id}`}
                            placeholder="G-XXXXXXXXXX"
                            value={integration.config.customSettings?.trackingId || ''}
                            onChange={(e) => {
                              handleConfigChange(integration.id, 'customSettings.trackingId', e.target.value)
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Found in Google Analytics → Admin → Data Streams
                          </p>
                        </div>
                      )}

                      {/* Algolia Specific Fields */}
                      {integration.id === 'algolia' && (
                        <>
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
                          <div className="space-y-2">
                            <Label htmlFor={`index-name-${integration.id}`}>Index Name</Label>
                            <Input
                              id={`index-name-${integration.id}`}
                              placeholder="main"
                              value={integration.config.customSettings?.indexName || 'main'}
                              onChange={(e) => {
                                handleConfigChange(integration.id, 'customSettings.indexName', e.target.value)
                              }}
                            />
                          </div>
                        </>
                      )}

                      {/* NextAuth Base URL */}
                      {integration.id === 'nextauth' && (
                        <div className="space-y-2">
                          <Label htmlFor={`base-url-${integration.id}`}>Base URL</Label>
                          <Input
                            id={`base-url-${integration.id}`}
                            type="url"
                            placeholder="https://yourdomain.com"
                            value={integration.config.customSettings?.baseUrl || ''}
                            onChange={(e) => {
                              handleConfigChange(integration.id, 'customSettings.baseUrl', e.target.value)
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <a
                          href={integration.documentation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Documentation
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isConfigured && integration.config.enabled && (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            Configuration incomplete
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(integration.id)}
                          disabled={testing === integration.id || !isConfigured}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          {testing === integration.id ? 'Testing...' : 'Test Connection'}
                        </Button>
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
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {filteredIntegrations.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground text-lg font-medium">No integrations found in this category.</p>
              <p className="text-sm text-muted-foreground">
                Try selecting "All" to see all available integrations.
              </p>
              <Button
                variant="outline"
                onClick={() => setSelectedCategory('All')}
                className="mt-4"
              >
                Show All Integrations
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
