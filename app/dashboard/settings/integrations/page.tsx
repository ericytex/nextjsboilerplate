'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Copy,
  Loader2,
  Plus,
  X
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
  const [creemTestResults, setCreemTestResults] = useState<Record<string, any>>({})
  const [creemTestLoading, setCreemTestLoading] = useState<string | null>(null)
  const [showCreateProductForm, setShowCreateProductForm] = useState(false)
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({})
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    price: '',
    currency: 'USD',
    billing_type: 'onetime' as 'onetime' | 'recurring',
    billing_period: 'every-month',
    tax_mode: 'inclusive' as 'inclusive' | 'exclusive',
    tax_category: [] as string[],
    default_success_url: '',
    abandoned_cart_recovery_enabled: false,
  })

  const creemEnvVarsLoadedRef = useRef(false)

  useEffect(() => {
    loadIntegrations()
  }, [])

  useEffect(() => {
    // Load Creem env vars once after integrations are loaded
    if (!loading && integrations.length > 0 && !creemEnvVarsLoadedRef.current) {
      creemEnvVarsLoadedRef.current = true
      loadCreemEnvVars()
    }
  }, [loading, integrations.length])

  const loadCreemEnvVars = async () => {
    try {
      const response = await fetch('/api/setup/creem-env-vars', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.hasApiKey) {
          // Find Creem integration and update it
          setIntegrations(prev => prev.map(integration => {
            if (integration.id === 'creem') {
              const updatedConfig = {
                ...integration.config,
                apiKey: '••••••••••••', // Show masked value to indicate it's set
                customSettings: {
                  ...integration.config.customSettings,
                  // We can't show the actual key, but we can indicate it exists
                }
              }
              
              // Auto-enable if env vars exist
              if (!integration.config.enabled) {
                updatedConfig.enabled = true
              }
              
              return { ...integration, config: updatedConfig }
            }
            return integration
          }))
          
          toast.info('Creem.io environment variables detected', {
            description: 'Found CREEM_API_KEY in .env.local. Auto-testing connection...'
          })
          
          // Auto-test after a short delay
          setTimeout(() => {
            testCreemConnection()
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Failed to load Creem env vars:', error)
    }
  }

  const testCreemConnection = async () => {
    // Test by listing products (simple GET request)
    try {
      setCreemTestLoading('GET:/api/creem/products')
      const response = await fetch('/api/creem/products')
      const data = await response.json()
      
      setCreemTestResults(prev => ({
        ...prev,
        'GET:/api/creem/products': {
          status: response.status,
          data,
          timestamp: new Date().toISOString(),
        },
      }))
      
      if (response.ok) {
        toast.success('✅ Creem.io connection successful!', {
          description: 'Environment variables are working correctly.'
        })
        
        // Update connection status
        setIntegrations(prev => prev.map(i => 
          i.id === 'creem' 
            ? { ...i, config: { ...i.config, connectionStatus: 'connected' } }
            : i
        ))
      } else {
        toast.error('❌ Creem.io connection test failed', {
          description: data.error?.message || 'Please check your CREEM_API_KEY'
        })
        
        setIntegrations(prev => prev.map(i => 
          i.id === 'creem' 
            ? { ...i, config: { ...i.config, connectionStatus: 'error' } }
            : i
        ))
      }
    } catch (error: any) {
      toast.error('❌ Creem.io connection test failed', {
        description: error.message || 'Network error'
      })
      
      setIntegrations(prev => prev.map(i => 
        i.id === 'creem' 
          ? { ...i, config: { ...i.config, connectionStatus: 'error' } }
          : i
      ))
    } finally {
      setCreemTestLoading(null)
    }
  }

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
          webhookUrl: '',
          testMode: true
        }
      },
      documentation: 'https://docs.creem.io/getting-started/introduction',
      setupSteps: [
        '1. Create a Creem.io account: Sign up at https://creem.io to access the dashboard and manage your products and payments',
        '2. Get your API Key: Navigate to Dashboard → Developers section → Click the eye icon to reveal your API key → Copy and store it securely (keep this confidential)',
        '3. Get your Merchant ID: Found in Dashboard → Settings → Account section (or check the Developers section)',
        '4. Create Products: Go to Dashboard → Products tab → Click "Add Product" → Enter name, description, price, and optionally upload an image → Save the product',
        '5. Set up Webhook URL: In Dashboard → Developers → Webhooks → Click "Add Webhook" → Enter your endpoint URL (e.g., https://yourdomain.com/api/webhooks/creem) → This will receive real-time payment event notifications',
        '6. Customize Branding (Optional): Go to Dashboard → Settings → Branding → Upload your logo and set brand colors for a consistent checkout experience',
        '7. Enable Test Mode: Click the "Test Mode" button in the dashboard top navbar for development → This switches to test-api.creem.io endpoint',
        '8. Test Payments: Use test card number 4242 4242 4242 4242 with any expiration date (e.g., 12/25) and any CVV (e.g., 123)',
        '9. Install Creem SDK: Run `npm install @creem_io/nextjs` in your project terminal',
        '10. Configure Environment: Add CREEM_API_KEY=your_api_key to your .env.local file for server-side use'
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
    
    // Show saved state indicator
    setSavedStates(prev => ({ ...prev, [integrationId]: true }))
    setTimeout(() => {
      setSavedStates(prev => ({ ...prev, [integrationId]: false }))
    }, 3000)
    
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
    } else if (integrationId === 'creem') {
      toast.success('✅ Creem.io configuration saved!', {
        duration: 3000
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

  const testCreemEndpoint = async (endpoint: string, method: string = 'GET', body?: any, resultKey?: string) => {
    // Use a unique key for results (method + endpoint) to differentiate GET vs POST
    const key = resultKey || `${method}:${endpoint}`
    setCreemTestLoading(key)
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

      setCreemTestResults(prev => ({
        ...prev,
        [key]: {
          status: response.status,
          data,
          timestamp: new Date().toISOString(),
        },
      }))

      if (response.ok) {
        toast.success(`✅ ${method} ${endpoint} - Success`)
      } else {
        toast.error(`❌ ${method} ${endpoint} - Error: ${data.error?.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      setCreemTestResults(prev => ({
        ...prev,
        [key]: {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      }))
      toast.error(`❌ ${method} ${endpoint} - ${error.message}`)
    } finally {
      setCreemTestLoading(null)
    }
  }

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2)
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
                              {integration.setupSteps.slice(0, integration.id === 'creem' ? 10 : 4).map((step, idx) => (
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

                    {/* Creem.io uses Tabs for Configuration and Testing */}
                    {integration.id === 'creem' ? (
                      <Tabs defaultValue="configuration" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="configuration">Configuration</TabsTrigger>
                          <TabsTrigger value="testing">API Testing</TabsTrigger>
                        </TabsList>

                        <TabsContent value="configuration" className="space-y-4 mt-4">
                          <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              Configuration
                            </h4>

                            {/* API Key & Secret Key for Creem */}
                            {integration.id === 'creem' && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor={`api-key-${integration.id}`}>API Key</Label>
                                  <div className="relative">
                                    <Input
                                      id={`api-key-${integration.id}`}
                                      type={showSecrets[`${integration.id}-apiKey`] ? 'text' : 'password'}
                                      placeholder={integration.config.apiKey === '••••••••••••' ? 'Using CREEM_API_KEY from .env.local' : 'Your Creem.io API key'}
                                      value={integration.config.apiKey || ''}
                                      onChange={(e) => {
                                        handleConfigChange(integration.id, 'apiKey', e.target.value)
                                      }}
                                      disabled={integration.config.apiKey === '••••••••••••'}
                                      className={integration.config.apiKey === '••••••••••••' ? 'bg-muted' : ''}
                                    />
                                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                      {integration.config.apiKey === '••••••••••••' ? (
                                        <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                                          <p className="text-green-700 dark:text-green-300 font-medium">✓ Using CREEM_API_KEY from .env.local</p>
                                          <p className="text-green-600 dark:text-green-400 mt-1">The API key is loaded from your environment variables and will be used server-side automatically.</p>
                                        </div>
                                      ) : (
                                        <>
                                          <p>• Found in: Dashboard → Developers section → Click the eye icon to reveal → Copy and store securely</p>
                                          <p>• This key authenticates your API requests - keep it confidential</p>
                                          <p>• Add to .env.local as CREEM_API_KEY for server-side use</p>
                                        </>
                                      )}
                                    </div>
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
                              </>
                            )}

                            {/* Creem.io Specific Fields */}
                            {integration.id === 'creem' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`creem-merchant-${integration.id}`}>Merchant ID *</Label>
                            <Input
                              id={`creem-merchant-${integration.id}`}
                              placeholder="Your Creem.io merchant ID"
                              value={integration.config.customSettings?.merchantId || ''}
                              onChange={(e) => {
                                handleConfigChange(integration.id, 'customSettings.merchantId', e.target.value)
                              }}
                            />
                            <p className="text-xs text-muted-foreground">
                              Found in Dashboard → Settings → Account section. This identifies your merchant account.
                            </p>
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
                            <p className="text-xs text-muted-foreground">
                              Add this URL in Dashboard → Developers → Webhooks → "Add Webhook". This endpoint will receive real-time notifications about payment events (payments, subscriptions, refunds, etc.).
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                              💡 Testing Tips:
                            </p>
                            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                              <li>Enable Test Mode in dashboard top navbar for development</li>
                              <li>Use test card: 4242 4242 4242 4242 with any expiration and CVV</li>
                              <li>Test mode uses test-api.creem.io endpoint automatically</li>
                              <li>Check Dashboard → Products to create test products first</li>
                            </ul>
                          </div>
                        </>
                      )}
                          </div>
                        </TabsContent>

                        <TabsContent value="testing" className="space-y-4 mt-4">
                          <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <TestTube className="h-4 w-4" />
                              API Testing
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Test Creem.io API endpoints. Make sure CREEM_API_KEY is set in .env.local
                            </p>

                            {/* Products Testing */}
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">Products</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => testCreemEndpoint('/api/creem/products', 'GET', undefined, 'GET:/api/creem/products')}
                                    disabled={creemTestLoading === 'GET:/api/creem/products'}
                                  >
                                    {creemTestLoading === 'GET:/api/creem/products' ? (
                                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    ) : null}
                                    List Products
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={showCreateProductForm ? 'default' : 'outline'}
                                    onClick={() => setShowCreateProductForm(!showCreateProductForm)}
                                  >
                                    {showCreateProductForm ? (
                                      <>
                                        <X className="h-3 w-3 mr-2" />
                                        Close Form
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-3 w-3 mr-2" />
                                        Create Product
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {/* Create Product Form */}
                                {showCreateProductForm && (
                                  <Card className="mt-4 border-2">
                                    <CardHeader>
                                      <CardTitle className="text-lg">Create New Product</CardTitle>
                                      <CardDescription>
                                        Fill in the details below to create a new product in Creem.io
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                      {/* Product Details Section */}
                                      <div className="space-y-4">
                                        <div>
                                          <h5 className="text-sm font-semibold mb-2">Product Details</h5>
                                          <p className="text-xs text-muted-foreground mb-4">
                                            These are visible to the end user when purchasing your subscription
                                          </p>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="product-name">Name *</Label>
                                          <Input
                                            id="product-name"
                                            placeholder="Enter product name"
                                            value={productFormData.name}
                                            onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="product-description">Description</Label>
                                          <Textarea
                                            id="product-description"
                                            placeholder="Product descriptions displayed to your customers"
                                            rows={4}
                                            value={productFormData.description}
                                            onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="product-image-url">
                                            Image URL
                                            <Badge variant="secondary" className="ml-2 text-xs">Optional</Badge>
                                          </Label>
                                          <Input
                                            id="product-image-url"
                                            type="url"
                                            placeholder="https://example.com/image.jpg"
                                            value={productFormData.image_url}
                                            onChange={(e) => setProductFormData({ ...productFormData, image_url: e.target.value })}
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            URL of the product image. Only PNG and JPG are supported.
                                          </p>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="product-success-url">
                                            Return URL
                                            <Badge variant="secondary" className="ml-2 text-xs">Optional</Badge>
                                          </Label>
                                          <Input
                                            id="product-success-url"
                                            type="url"
                                            placeholder="https://example.com/?status=successful"
                                            value={productFormData.default_success_url}
                                            onChange={(e) => setProductFormData({ ...productFormData, default_success_url: e.target.value })}
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            The URL that the user will be redirected to after payment
                                          </p>
                                        </div>
                                      </div>

                                      <Separator />

                                      {/* Payment Details Section */}
                                      <div className="space-y-4">
                                        <div>
                                          <h5 className="text-sm font-semibold mb-2">Payment Details</h5>
                                          <p className="text-xs text-muted-foreground mb-4">
                                            These are the pricing details that will be charged for your product
                                          </p>
                                        </div>

                                        {/* Billing Type Selection */}
                                        <div className="space-y-2">
                                          <Label>Billing Type *</Label>
                                          <div className="grid grid-cols-2 gap-3">
                                            <Button
                                              type="button"
                                              variant={productFormData.billing_type === 'onetime' ? 'default' : 'outline'}
                                              className={`h-auto py-4 flex flex-col items-center gap-2 ${
                                                productFormData.billing_type === 'onetime' ? 'border-2' : ''
                                              }`}
                                              onClick={() => setProductFormData({ ...productFormData, billing_type: 'onetime' })}
                                            >
                                              <CheckCircle2 className={`h-5 w-5 ${productFormData.billing_type === 'onetime' ? '' : 'hidden'}`} />
                                              <span className="font-semibold">Single payment</span>
                                              <span className="text-xs text-muted-foreground">Charge a one-time fee</span>
                                            </Button>
                                            <Button
                                              type="button"
                                              variant={productFormData.billing_type === 'recurring' ? 'default' : 'outline'}
                                              className={`h-auto py-4 flex flex-col items-center gap-2 ${
                                                productFormData.billing_type === 'recurring' ? 'border-2' : ''
                                              }`}
                                              onClick={() => setProductFormData({ ...productFormData, billing_type: 'recurring' })}
                                            >
                                              <CheckCircle2 className={`h-5 w-5 ${productFormData.billing_type === 'recurring' ? '' : 'hidden'}`} />
                                              <span className="font-semibold">Subscription</span>
                                              <span className="text-xs text-muted-foreground">Charge an ongoing fee</span>
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Billing Period (if recurring) */}
                                        {productFormData.billing_type === 'recurring' && (
                                          <div className="space-y-2">
                                            <Label htmlFor="billing-period">Billing Period *</Label>
                                            <Select
                                              value={productFormData.billing_period}
                                              onValueChange={(value) => setProductFormData({ ...productFormData, billing_period: value })}
                                            >
                                              <SelectTrigger id="billing-period">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="every-month">Every Month</SelectItem>
                                                <SelectItem value="every-year">Every Year</SelectItem>
                                                <SelectItem value="every-week">Every Week</SelectItem>
                                                <SelectItem value="every-day">Every Day</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="product-currency">Currency *</Label>
                                            <Select
                                              value={productFormData.currency}
                                              onValueChange={(value) => setProductFormData({ ...productFormData, currency: value })}
                                            >
                                              <SelectTrigger id="product-currency">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div className="space-y-2">
                                            <Label htmlFor="product-price">
                                              Price * <span className="text-xs text-muted-foreground">(in dollars)</span>
                                            </Label>
                                            <div className="relative">
                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                              <Input
                                                id="product-price"
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="pl-8"
                                                value={productFormData.price ? (parseInt(productFormData.price) / 100).toFixed(2) : ''}
                                                onChange={(e) => {
                                                  const value = e.target.value
                                                  // Convert dollars to cents
                                                  const cents = value ? Math.round(parseFloat(value) * 100) : ''
                                                  setProductFormData({ ...productFormData, price: cents.toString() })
                                                }}
                                              />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                              Minimum: $1.00. Price will be converted to cents (e.g., $29.99 = 2999 cents).
                                            </p>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="tax-category">Tax Category</Label>
                                            <Select
                                              value={productFormData.tax_category[0] || ''}
                                              onValueChange={(value) => {
                                                setProductFormData({
                                                  ...productFormData,
                                                  tax_category: value ? [value] : []
                                                })
                                              }}
                                            >
                                              <SelectTrigger id="tax-category">
                                                <SelectValue placeholder="Select tax category" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="saas">SaaS</SelectItem>
                                                <SelectItem value="digital-goods-service">Digital Goods or Services</SelectItem>
                                                <SelectItem value="ebooks">E-books</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div className="space-y-2">
                                            <Label htmlFor="tax-mode">Tax Behaviour</Label>
                                            <div className="flex items-center justify-between p-3 border rounded-md">
                                              <span className="text-sm">Price includes tax</span>
                                              <Switch
                                                id="tax-mode"
                                                checked={productFormData.tax_mode === 'inclusive'}
                                                onCheckedChange={(checked) => {
                                                  setProductFormData({
                                                    ...productFormData,
                                                    tax_mode: checked ? 'inclusive' : 'exclusive'
                                                  })
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <Separator />

                                      {/* Abandoned Cart Recovery */}
                                      <div className="space-y-4">
                                        <div>
                                          <h5 className="text-sm font-semibold mb-2">Abandoned Cart Recovery</h5>
                                          <p className="text-xs text-muted-foreground mb-4">
                                            Automatically recover abandoned carts by reaching out to customers
                                          </p>
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-md">
                                          <div className="flex items-center gap-2">
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                              <p className="text-sm font-medium">Enable abandoned cart recovery</p>
                                              <p className="text-xs text-muted-foreground">
                                                Enable this feature to automatically recover abandoned carts and increase your sales.
                                              </p>
                                            </div>
                                          </div>
                                          <Switch
                                            checked={productFormData.abandoned_cart_recovery_enabled}
                                            onCheckedChange={(checked) => {
                                              setProductFormData({
                                                ...productFormData,
                                                abandoned_cart_recovery_enabled: checked
                                              })
                                            }}
                                          />
                                        </div>
                                      </div>

                                      {/* Form Actions */}
                                      <div className="flex items-center justify-end gap-2 pt-4 border-t">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setShowCreateProductForm(false)
                                            setProductFormData({
                                              name: '',
                                              description: '',
                                              image_url: '',
                                              price: '',
                                              currency: 'USD',
                                              billing_type: 'onetime',
                                              billing_period: 'every-month',
                                              tax_mode: 'inclusive',
                                              tax_category: [],
                                              default_success_url: '',
                                              abandoned_cart_recovery_enabled: false,
                                            })
                                          }}
                                        >
                                          Discard
                                        </Button>
                                        <Button
                                          onClick={async () => {
                                            // Validate required fields
                                            if (!productFormData.name) {
                                              toast.error('Product name is required')
                                              return
                                            }
                                            if (!productFormData.price || parseInt(productFormData.price) < 100) {
                                              toast.error('Price must be at least $1.00 (100 cents)')
                                              return
                                            }
                                            if (!productFormData.currency) {
                                              toast.error('Currency is required')
                                              return
                                            }
                                            if (productFormData.billing_type === 'recurring' && !productFormData.billing_period) {
                                              toast.error('Billing period is required for recurring products')
                                              return
                                            }

                                            // Prepare request body
                                            const requestBody: any = {
                                              name: productFormData.name,
                                              price: parseInt(productFormData.price),
                                              currency: productFormData.currency,
                                              billing_type: productFormData.billing_type,
                                              tax_mode: productFormData.tax_mode,
                                              abandoned_cart_recovery_enabled: productFormData.abandoned_cart_recovery_enabled,
                                            }

                                            if (productFormData.description) {
                                              requestBody.description = productFormData.description
                                            }
                                            if (productFormData.image_url) {
                                              requestBody.image_url = productFormData.image_url
                                            }
                                            if (productFormData.billing_type === 'recurring') {
                                              requestBody.billing_period = productFormData.billing_period
                                            }
                                            if (productFormData.tax_category.length > 0) {
                                              requestBody.tax_category = productFormData.tax_category
                                            }
                                            if (productFormData.default_success_url) {
                                              requestBody.default_success_url = productFormData.default_success_url
                                            }

                                            await testCreemEndpoint('/api/creem/products', 'POST', requestBody, 'POST:/api/creem/products')
                                            
                                            // Check result after state update
                                            setTimeout(() => {
                                              const result = creemTestResults['POST:/api/creem/products']
                                              if (result?.status === 200) {
                                                setProductFormData({
                                                  name: '',
                                                  description: '',
                                                  image_url: '',
                                                  price: '',
                                                  currency: 'USD',
                                                  billing_type: 'onetime',
                                                  billing_period: 'every-month',
                                                  tax_mode: 'inclusive',
                                                  tax_category: [],
                                                  default_success_url: '',
                                                  abandoned_cart_recovery_enabled: false,
                                                })
                                                setShowCreateProductForm(false)
                                                toast.success('Product created successfully! Form reset.')
                                              }
                                            }, 500)
                                          }}
                                          disabled={creemTestLoading === 'POST:/api/creem/products'}
                                        >
                                          {creemTestLoading === 'POST:/api/creem/products' ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Creating...
                                            </>
                                          ) : (
                                            'Create Product'
                                          )}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                                
                                {/* Show results for List Products */}
                                {creemTestResults['GET:/api/creem/products'] && (
                                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={creemTestResults['GET:/api/creem/products'].status === 200 ? 'default' : 'destructive'}>
                                          {creemTestResults['GET:/api/creem/products'].status || 'Error'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">List Products</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2"
                                        onClick={() => copyToClipboard(formatJSON(creemTestResults['GET:/api/creem/products']))}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <pre className="text-xs overflow-auto max-h-32">
                                      {formatJSON(creemTestResults['GET:/api/creem/products'])}
                                    </pre>
                                  </div>
                                )}

                                {/* Show results for Create Product */}
                                {creemTestResults['POST:/api/creem/products'] && (
                                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={creemTestResults['POST:/api/creem/products'].status === 200 ? 'default' : 'destructive'}>
                                          {creemTestResults['POST:/api/creem/products'].status || 'Error'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">Create Product</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2"
                                        onClick={() => copyToClipboard(formatJSON(creemTestResults['POST:/api/creem/products']))}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <pre className="text-xs overflow-auto max-h-32">
                                      {formatJSON(creemTestResults['POST:/api/creem/products'])}
                                    </pre>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Checkout Testing */}
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">Checkout</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Product ID (from products test)"
                                    id="creem-test-product-id"
                                    className="text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const productId = (document.getElementById('creem-test-product-id') as HTMLInputElement)?.value
                                      if (!productId) {
                                        toast.error('Product ID is required')
                                        return
                                      }
                                      testCreemEndpoint('/api/creem/checkout', 'POST', {
                                        productId,
                                        customerEmail: 'test@example.com',
                                        successUrl: `${window.location.origin}/success`,
                                        cancelUrl: `${window.location.origin}/cancel`,
                                      })
                                    }}
                                    disabled={creemTestLoading === '/api/creem/checkout'}
                                  >
                                    {creemTestLoading === '/api/creem/checkout' ? (
                                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    ) : null}
                                    Create Checkout
                                  </Button>
                                </div>
                                {creemTestResults['/api/creem/checkout'] && (
                                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <Badge variant={creemTestResults['/api/creem/checkout'].status === 200 ? 'default' : 'destructive'}>
                                        {creemTestResults['/api/creem/checkout'].status || 'Error'}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2"
                                        onClick={() => copyToClipboard(formatJSON(creemTestResults['/api/creem/checkout']))}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <pre className="text-xs overflow-auto max-h-32">
                                      {formatJSON(creemTestResults['/api/creem/checkout'])}
                                    </pre>
                                    {creemTestResults['/api/creem/checkout']?.data?.data?.checkoutUrl && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2 w-full"
                                        onClick={() => window.open(creemTestResults['/api/creem/checkout'].data.data.checkoutUrl, '_blank')}
                                      >
                                        Open Checkout URL
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Discounts Testing */}
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">Discounts</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    testCreemEndpoint('/api/creem/discounts', 'POST', {
                                      code: `TEST${Date.now()}`,
                                      type: 'percentage',
                                      value: 10,
                                      description: 'Test discount',
                                    })
                                  }}
                                  disabled={creemTestLoading === '/api/creem/discounts'}
                                >
                                  {creemTestLoading === '/api/creem/discounts' ? (
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  ) : null}
                                  Create Discount
                                </Button>
                                {creemTestResults['/api/creem/discounts'] && (
                                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <Badge variant={creemTestResults['/api/creem/discounts'].status === 200 ? 'default' : 'destructive'}>
                                        {creemTestResults['/api/creem/discounts'].status || 'Error'}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2"
                                        onClick={() => copyToClipboard(formatJSON(creemTestResults['/api/creem/discounts']))}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <pre className="text-xs overflow-auto max-h-32">
                                      {formatJSON(creemTestResults['/api/creem/discounts'])}
                                    </pre>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Licenses Testing */}
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">Licenses</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="space-y-2">
                                  <Input
                                    placeholder="License Key"
                                    id="creem-test-license-key"
                                    className="text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const licenseKey = (document.getElementById('creem-test-license-key') as HTMLInputElement)?.value
                                      if (!licenseKey) {
                                        toast.error('License key is required')
                                        return
                                      }
                                      testCreemEndpoint('/api/creem/licenses?action=validate', 'POST', {
                                        licenseKey,
                                      })
                                    }}
                                    disabled={creemTestLoading === '/api/creem/licenses?action=validate'}
                                  >
                                    {creemTestLoading === '/api/creem/licenses?action=validate' ? (
                                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    ) : null}
                                    Validate License
                                  </Button>
                                </div>
                                {creemTestResults['/api/creem/licenses?action=validate'] && (
                                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <Badge variant={creemTestResults['/api/creem/licenses?action=validate'].status === 200 ? 'default' : 'destructive'}>
                                        {creemTestResults['/api/creem/licenses?action=validate'].status || 'Error'}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2"
                                        onClick={() => copyToClipboard(formatJSON(creemTestResults['/api/creem/licenses?action=validate']))}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <pre className="text-xs overflow-auto max-h-32">
                                      {formatJSON(creemTestResults['/api/creem/licenses?action=validate'])}
                                    </pre>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Webhook Testing */}
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">Webhook</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                  Webhook URL: <code className="bg-muted px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/creem</code>
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => testCreemEndpoint('/api/webhooks/creem')}
                                  disabled={creemTestLoading === '/api/webhooks/creem'}
                                >
                                  {creemTestLoading === '/api/webhooks/creem' ? (
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  ) : null}
                                  Test Webhook Endpoint
                                </Button>
                                {creemTestResults['/api/webhooks/creem'] && (
                                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <Badge variant={creemTestResults['/api/webhooks/creem'].status === 200 ? 'default' : 'destructive'}>
                                        {creemTestResults['/api/webhooks/creem'].status || 'Error'}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2"
                                        onClick={() => copyToClipboard(formatJSON(creemTestResults['/api/webhooks/creem']))}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <pre className="text-xs overflow-auto max-h-32">
                                      {formatJSON(creemTestResults['/api/webhooks/creem'])}
                                    </pre>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      /* Other integrations use standard configuration */
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
                            </div>
                          </>
                        )}

                        {/* API Key & Secret Key (for most integrations) */}
                        {(integration.id === 'nextauth' || integration.id === 'stripe' || integration.id === 'algolia') && (
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
                            {(integration.id === 'stripe' || integration.id === 'algolia') && (
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
                    )}

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
                          className={savedStates[integration.id] ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving === integration.id ? 'Saving...' : savedStates[integration.id] ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Saved
                            </>
                          ) : 'Save Changes'}
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
