'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, User, Shield, CheckCircle2, XCircle, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react"
import { toast } from "sonner"

type SetupStep = 'database' | 'admin' | 'complete'

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<SetupStep>('database')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showServiceKey, setShowServiceKey] = useState(false)

  const [databaseConfig, setDatabaseConfig] = useState({
    projectUrl: '',
    anonKey: '',
    serviceRoleKey: '',
    databaseUrl: ''
  })

  const [adminUser, setAdminUser] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  })

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Check if setup is already complete
  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup/status', { cache: 'no-store' })
      const data = await response.json()
      
      if (data.setupComplete) {
        // Setup already done, redirect to dashboard
        toast.info('Setup already complete. Redirecting...')
        router.push('/dashboard')
      } else if (data.needsAdmin) {
        // Database configured but no admin - go to admin step
        setStep('admin')
      }
    } catch (error) {
      // Setup not complete, continue with setup flow
      console.log('Setup check:', error)
    }
  }

  const testDatabaseConnection = async () => {
    if (!databaseConfig.projectUrl || !databaseConfig.anonKey) {
      setErrorMessage('Please enter Project URL and Anon Key')
      return
    }

    setTesting(true)
    setConnectionStatus('testing')
    setErrorMessage('')

    try {
      const response = await fetch('/api/setup/test-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: databaseConfig.projectUrl,
          key: databaseConfig.anonKey
        })
      })

      const data = await response.json()

      if (data.connected) {
        setConnectionStatus('success')
        toast.success('Database connection successful!')
      } else {
        setConnectionStatus('error')
        setErrorMessage(data.error || 'Connection failed')
        toast.error(data.error || 'Connection failed')
      }
    } catch (error: any) {
      setConnectionStatus('error')
      setErrorMessage(error.message || 'Failed to test connection')
      toast.error('Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const saveDatabaseConfig = async () => {
    if (connectionStatus !== 'success') {
      toast.error('Please test connection first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/setup/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(databaseConfig)
      })

      const data = await response.json()

      if (response.ok) {
        if (data.needsTable) {
          toast.error('Database tables not found', {
            description: 'Please create the tables first. Check the SQL below.',
            duration: 15000
          })
          setErrorMessage(
            `Database tables need to be created.\n\n` +
            `1. Go to: ${data.sqlEditorUrl || 'Supabase Dashboard → SQL Editor'}\n` +
            `2. Click "New Query"\n` +
            `3. Copy and paste the SQL below:\n\n` +
            `${data.sql}\n\n` +
            `4. Click "Run" (or press Cmd/Ctrl + Enter)\n` +
            `5. Come back here and click "Continue" again`
          )
        } else {
          toast.success('Database configured successfully!')
          setStep('admin')
        }
      } else {
        throw new Error(data.error || 'Failed to save database config')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save database configuration')
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const createAdminUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (adminUser.password !== adminUser.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (adminUser.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/setup/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminUser.email,
          password: adminUser.password,
          fullName: adminUser.fullName
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Admin user created successfully!')
        setStep('complete')
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        throw new Error(data.error || 'Failed to create admin user')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create admin user')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">Setup Complete!</h2>
              <p className="text-muted-foreground">
                Your application is ready to use. Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === 'database' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step === 'database' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900' : 'border-green-600 bg-green-50 dark:bg-green-900'
            }`}>
              {step === 'database' ? <Database className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <span className="font-semibold">Database</span>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className={`flex items-center gap-2 ${step === 'admin' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step === 'admin' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900' : 'border-gray-300 bg-gray-50 dark:bg-gray-800'
            }`}>
              <User className="h-5 w-5" />
            </div>
            <span className="font-semibold">Admin User</span>
          </div>
        </div>

        {step === 'database' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Setup
              </CardTitle>
              <CardDescription>
                Configure your Supabase database connection. This will be used to store all application data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-url">Project URL *</Label>
                <Input
                  id="project-url"
                  type="url"
                  placeholder="https://[project-ref].supabase.co"
                  value={databaseConfig.projectUrl}
                  onChange={(e) => setDatabaseConfig({ ...databaseConfig, projectUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Found in Supabase Dashboard → Settings → API → Project URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anon-key">Anon/Public Key *</Label>
                <div className="relative">
                  <Input
                    id="anon-key"
                    type={showServiceKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={databaseConfig.anonKey}
                    onChange={(e) => setDatabaseConfig({ ...databaseConfig, anonKey: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowServiceKey(!showServiceKey)}
                  >
                    {showServiceKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Found in Supabase Dashboard → Settings → API → anon/public key
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-key">Service Role Key (Optional)</Label>
                <div className="relative">
                  <Input
                    id="service-key"
                    type={showServiceKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={databaseConfig.serviceRoleKey}
                    onChange={(e) => setDatabaseConfig({ ...databaseConfig, serviceRoleKey: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowServiceKey(!showServiceKey)}
                  >
                    {showServiceKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Keep this secret! Only for server-side operations.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="database-url">Database URL (Optional)</Label>
                <Input
                  id="database-url"
                  type="password"
                  placeholder="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
                  value={databaseConfig.databaseUrl}
                  onChange={(e) => setDatabaseConfig({ ...databaseConfig, databaseUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Found in Supabase Dashboard → Settings → Database → Connection string
                </p>
              </div>

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription className="whitespace-pre-wrap">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {connectionStatus === 'success' && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Connection successful! Click "Continue" to proceed.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={testDatabaseConnection}
                  disabled={testing || !databaseConfig.projectUrl || !databaseConfig.anonKey}
                  variant="outline"
                  className="flex-1"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  onClick={saveDatabaseConfig}
                  disabled={loading || connectionStatus !== 'success'}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Create Admin User
              </CardTitle>
              <CardDescription>
                Create the first admin user account. This user will have full access to manage the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createAdminUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name *</Label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="John Doe"
                    value={adminUser.fullName}
                    onChange={(e) => setAdminUser({ ...adminUser, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={adminUser.email}
                    onChange={(e) => setAdminUser({ ...adminUser, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={adminUser.password}
                      onChange={(e) => setAdminUser({ ...adminUser, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password *</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={adminUser.confirmPassword}
                    onChange={(e) => setAdminUser({ ...adminUser, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Admin...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Create Admin Account
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

