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
  const [verifyingTables, setVerifyingTables] = useState(false)
  const [tablesVerified, setTablesVerified] = useState(false)

  // Check if setup is already complete and load env vars
  useEffect(() => {
    loadEnvVars()
    checkSetupStatus()
  }, [])

  const loadEnvVars = async () => {
    try {
      const response = await fetch('/api/setup/env-vars', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Check if we have the required env vars (using the actual API response structure)
        const hasUrl = data.supabaseUrl
        const hasKey = data.anonKey
        
        if (hasUrl && hasKey) {
          console.log('📋 Found environment variables in .env.local')
          // Pre-fill form with env vars
          const newConfig = {
            projectUrl: data.supabaseUrl || '',
            anonKey: data.anonKey || '',
            serviceRoleKey: '', // Don't pre-fill service role key for security
            databaseUrl: '' // Don't pre-fill database URL for security
          }
          
          setDatabaseConfig(newConfig)
          
          toast.info('Environment variables loaded', {
            description: 'Found Supabase credentials in .env.local. Testing connection automatically...'
          })
          
          // Auto-test connection if we have both URL and key
          // Use a ref or state check to avoid multiple calls
          setTimeout(() => {
            console.log('🔄 Auto-testing connection with loaded credentials...')
            // Call testDatabaseConnection with the new config values
            testDatabaseConnectionWithConfig(newConfig)
            // Also auto-verify using server-side Service Role Key (if available in env)
            setTimeout(() => {
              autoVerifyWithEnvVars(newConfig)
            }, 1500)
          }, 500)
        } else if (data.hasEnvVars) {
          // Fallback - just show info without auto-testing
          setDatabaseConfig(prev => ({
            ...prev,
            projectUrl: data.supabaseUrl || prev.projectUrl,
            anonKey: data.anonKey || prev.anonKey,
          }))
          
          toast.info('Environment variables loaded', {
            description: 'Found Supabase credentials in .env.local. You can test the connection or edit if needed.'
          })
        }
      }
    } catch (error) {
      console.error('Error loading env vars:', error)
    }
  }

  // Helper function to test connection with specific config
  const testDatabaseConnectionWithConfig = async (config: typeof databaseConfig) => {
    const projectUrl = config.projectUrl?.trim()
    const anonKey = config.anonKey?.trim()
    
    if (!projectUrl || !anonKey) {
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
          url: projectUrl,
          key: anonKey
        })
      })

      const data = await response.json()

      if (data.connected) {
        setConnectionStatus('success')
        toast.success('Database connection successful!')
        
        // Auto-verify tables after successful connection (using server-side Service Role Key if available)
        setTimeout(() => {
          console.log('🔄 Auto-verifying tables...')
          autoVerifyWithEnvVars(config)
        }, 1000)
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

  // Auto-verify using Service Role Key from env vars (server-side)
  const autoVerifyWithEnvVars = async (config: typeof databaseConfig) => {
    const projectUrl = config.projectUrl?.trim()
    const anonKey = config.anonKey?.trim()
    
    if (!projectUrl || !anonKey) {
      return
    }

    try {
      const response = await fetch('/api/setup/auto-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectUrl: projectUrl,
          anonKey: anonKey
        })
      })

      const data = await response.json()

      if (data.success && data.tablesExist && data.accessible) {
        // Tables exist and are accessible!
        setTablesVerified(true)
        setConnectionStatus('success')
        setErrorMessage('')
        toast.success('✅ Tables verified!', {
          description: data.message
        })
      } else if (data.needsServiceRoleKey) {
        // Can't verify without Service Role Key
        setTablesVerified(false)
        toast.info('Service Role Key needed', {
          description: 'Add Service Role Key to verify if tables exist or if RLS is blocking.',
          duration: 10000
        })
        setErrorMessage(
          `🔍 Verification Status\n\n` +
          `⚠️ Cannot determine table status with Anon Key only.\n\n` +
          `The error "${data.error}" can mean:\n` +
          `• Tables don't exist, OR\n` +
          `• Tables exist but RLS is blocking access\n\n` +
          `💡 Solution: Add your Service Role Key in the "Service Role Key (Optional)" field above and click "Verify Tables Created" to get accurate status.\n\n` +
          `Note: If Service Role Key is in .env.local, it will be used automatically server-side.`
        )
      } else if (data.needsTable) {
        // Tables don't exist
        setTablesVerified(false)
        toast.error('Tables not found', {
          description: 'Tables do not exist. Please create them using the SQL schema.',
          duration: 15000
        })
        setErrorMessage(
          `❌ Tables Not Found\n\n` +
          `Verified with Service Role Key: Tables do not exist in your database.\n\n` +
          `Please create the tables using the SQL schema provided.`
        )
      } else if (data.permissionIssue) {
        // Permission issue
        setTablesVerified(false)
        toast.warning('Permission Issue Detected', {
          description: data.message,
          duration: 15000
        })
        setErrorMessage(
          `🔒 Permission Issue Detected\n\n` +
          `✅ Good news: Your tables exist in Supabase!\n` +
          `❌ Problem: ${data.message}\n\n` +
          `💡 Solution:\n` +
          `1. Add your Service Role Key in the "Service Role Key (Optional)" field above\n` +
          `2. Click "Verify Tables Created" again\n\n` +
          `The Service Role Key bypasses RLS and allows setup to complete.`
        )
      } else {
        // Unknown status
        setTablesVerified(false)
        console.log('Auto-verify result:', data)
      }
    } catch (error: any) {
      console.error('Auto-verify error:', error)
      // Don't show error toast for auto-verify failures - it's just a convenience feature
    }
  }

  // Helper function to verify tables with specific config
  const verifyTablesWithConfig = async (config: typeof databaseConfig) => {
    const projectUrl = config.projectUrl?.trim()
    const anonKey = config.anonKey?.trim()
    
    if (!projectUrl || !anonKey) {
      return
    }

    setVerifyingTables(true)
    setTablesVerified(false)
    setErrorMessage('')

    try {
      // First, run comprehensive diagnostics
      let diagnosticData: any = null
      try {
        const diagnosticResponse = await fetch('/api/setup/check-tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectUrl: projectUrl,
            anonKey: anonKey,
            serviceRoleKey: config.serviceRoleKey?.trim() || ''
          })
        })
        diagnosticData = await diagnosticResponse.json()
        console.log('📊 Table Diagnostics:', diagnosticData)
      } catch (diagError) {
        console.warn('Diagnostics failed, continuing with regular check:', diagError)
      }

      // Now try to save config
      const response = await fetch('/api/setup/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectUrl: projectUrl,
          anonKey: anonKey,
          serviceRoleKey: config.serviceRoleKey?.trim() || '',
          databaseUrl: config.databaseUrl?.trim() || ''
        })
      })

      const data = await response.json()

      if (response.ok && !data.needsTable && !data.permissionIssue) {
        // Tables exist and are accessible!
        setTablesVerified(true)
        toast.success('✅ Tables verified! All database tables are accessible.')
        setConnectionStatus('success')
        setErrorMessage('')
      } else if (data.policyIssue || (data.permissionIssue || data.needsServiceRoleKey)) {
        // Permission error or policy issue - need service role key
        setTablesVerified(false)
        const isPolicyIssue = data.policyIssue || data.error?.includes('infinite recursion')
        toast.warning(isPolicyIssue ? 'RLS Policy Issue Detected' : 'Permission Issue Detected', {
          description: isPolicyIssue 
            ? 'Tables exist but RLS policy has infinite recursion. Add Service Role Key or fix the policy.'
            : 'Tables exist but RLS is blocking access. Add Service Role Key to proceed.',
          duration: 15000
        })
        setErrorMessage(
          (isPolicyIssue ? `🔄 RLS Policy Issue Detected\n\n` : `🔒 Permission Issue Detected\n\n`) +
          `✅ Good news: Your tables exist in Supabase!\n` +
          (isPolicyIssue 
            ? `❌ Problem: Infinite recursion detected in RLS policy for "users" table.\n` +
              `This happens when a policy references the same table it protects.\n\n`
            : `❌ Problem: Row Level Security (RLS) is blocking access with the Anon/Publishable key.\n\n`) +
          `💡 Solution:\n` +
          `1. Add your Service Role Key in the "Service Role Key (Optional)" field above\n` +
          `2. Click "Verify Tables Created" again\n\n` +
          `The Service Role Key bypasses RLS and allows setup to complete.\n\n` +
          (data.fixPolicySql ? `🔧 Alternative: Fix the policy in Supabase SQL Editor:\n\n\`\`\`sql\n${data.fixPolicySql}\n\`\`\`\n\n` : '') +
          `Diagnostic: ${diagnosticData?.recommendation || data.details || data.error}\n\n` +
          (diagnosticData?.diagnostics ? `Details:\n${diagnosticData.diagnostics.map((d: any) => `- ${d.step}: ${d.error || 'OK'}`).join('\n')}` : '')
        )
      } else if (data.needsTable) {
        // Tables still don't exist
        setTablesVerified(false)
        toast.error('Tables not found', {
          description: diagnosticData?.recommendation || 'Please make sure you ran the SQL in Supabase SQL Editor and it completed successfully.',
          duration: 15000
        })
        setErrorMessage(
          `❌ Tables Not Accessible\n\n` +
          `Diagnostic Results:\n` +
          (diagnosticData?.diagnostics ? diagnosticData.diagnostics.map((d: any) => 
            `${d.success ? '✅' : '❌'} ${d.step}${d.error ? `: ${d.error}` : ''}`
          ).join('\n') : 'No diagnostics available') +
          `\n\n` +
          `Recommendation: ${diagnosticData?.recommendation || data.error}\n\n` +
          `Please verify:\n` +
          `1. You copied the entire SQL (from CREATE TABLE to the end)\n` +
          `2. You clicked "Run" in Supabase SQL Editor\n` +
          `3. You saw a "Success" message\n` +
          `4. Check Supabase Table Editor to confirm tables exist\n\n` +
          `If tables exist but you see permission errors, add Service Role Key and try again.`
        )
      }
    } catch (error: any) {
      setTablesVerified(false)
      toast.error('Failed to verify tables')
      setErrorMessage(error.message || 'Failed to verify tables')
    } finally {
      setVerifyingTables(false)
    }
  }

  const checkSetupStatus = async () => {
    try {
      console.log('🔍 Checking setup status...')
      console.log('📋 Environment check:')
      console.log('  - NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set')
      console.log('  - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set')
      console.log('  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ? '✅ Set' : '❌ Not set')
      
      const response = await fetch('/api/setup/status', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        // API error - continue with setup
        console.log('⚠️ Setup status check failed:', response.status)
        return
      }
      
      const data = await response.json()
      console.log('📊 Setup status:', data)
      
      if (data.setupComplete) {
        // Setup already done (either via .env.local or database config), redirect to dashboard
        console.log('✅ Setup complete - database ready, redirecting to dashboard')
        router.push('/dashboard')
        return
      } else if (data.needsAdmin) {
        // Database configured but no admin - go to admin step
        console.log('👤 Admin user needed')
        setStep('admin')
      } else if (data.needsTables) {
        // Database configured but tables don't exist
        console.log('📊 Tables needed')
        setStep('database')
      } else if (data.needsServiceRoleKey) {
        // RLS blocking - need service role key
        console.log('🔑 Service Role Key needed to verify setup')
        setStep('database')
        toast.warning('Service Role Key needed to verify setup status', {
          description: 'Add Service Role Key in database setup to check if admin exists.'
        })
      } else if (data.needsSetup) {
        // No Supabase configured - stay on database step
        console.log('⚙️ Setup needed')
        setStep('database')
      } else {
        // Unknown state - stay on database step
        console.log('❓ Unknown setup state')
        setStep('database')
      }
    } catch (error) {
      // Setup not complete, continue with setup flow
      console.error('❌ Setup check error:', error)
      // Stay on database step
      setStep('database')
    }
  }

  const testDatabaseConnection = async () => {
    const projectUrl = databaseConfig.projectUrl?.trim()
    const anonKey = databaseConfig.anonKey?.trim()
    
    if (!projectUrl || !anonKey) {
      toast.error('Please enter Project URL and Publishable Key')
      setErrorMessage('Please enter Project URL and Publishable Key (Anon/Public Key)')
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
          url: databaseConfig.projectUrl.trim(),
          key: databaseConfig.anonKey.trim()
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

  const verifyTables = async () => {
    const projectUrl = databaseConfig.projectUrl?.trim()
    const anonKey = databaseConfig.anonKey?.trim()
    
    if (!projectUrl || !anonKey) {
      toast.error('Please enter Project URL and Publishable Key first')
      setErrorMessage('Please enter Project URL and Publishable Key (Anon/Public Key)')
      return
    }

    setVerifyingTables(true)
    setTablesVerified(false)
    setErrorMessage('')

    try {
      // First, run comprehensive diagnostics
      let diagnosticData: any = null
      try {
        const diagnosticResponse = await fetch('/api/setup/check-tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectUrl: projectUrl,
            anonKey: anonKey,
            serviceRoleKey: databaseConfig.serviceRoleKey?.trim() || ''
          })
        })
        diagnosticData = await diagnosticResponse.json()
        console.log('📊 Table Diagnostics:', diagnosticData)
      } catch (diagError) {
        console.warn('Diagnostics failed, continuing with regular check:', diagError)
      }

      // Now try to save config
      const response = await fetch('/api/setup/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectUrl: projectUrl,
          anonKey: anonKey,
          serviceRoleKey: databaseConfig.serviceRoleKey?.trim() || '',
          databaseUrl: databaseConfig.databaseUrl?.trim() || ''
        })
      })

      const data = await response.json()

      if (response.ok && !data.needsTable && !data.permissionIssue) {
        // Tables exist and are accessible!
        setTablesVerified(true)
        toast.success('✅ Tables verified! All database tables are accessible.')
        setConnectionStatus('success')
        setErrorMessage('') // Clear any error messages
        // Automatically proceed to save config
        setTimeout(() => {
          saveDatabaseConfig()
        }, 1000)
      } else if (data.policyIssue || (data.permissionIssue || data.needsServiceRoleKey)) {
        // Permission error or policy issue - need service role key
        setTablesVerified(false)
        const isPolicyIssue = data.policyIssue || data.error?.includes('infinite recursion')
        toast.warning(isPolicyIssue ? 'RLS Policy Issue Detected' : 'Permission Issue Detected', {
          description: isPolicyIssue 
            ? 'Tables exist but RLS policy has infinite recursion. Add Service Role Key or fix the policy.'
            : 'Tables exist but RLS is blocking access. Add Service Role Key to proceed.',
          duration: 15000
        })
        setErrorMessage(
          (isPolicyIssue ? `🔄 RLS Policy Issue Detected\n\n` : `🔒 Permission Issue Detected\n\n`) +
          `✅ Good news: Your tables exist in Supabase!\n` +
          (isPolicyIssue 
            ? `❌ Problem: Infinite recursion detected in RLS policy for "users" table.\n` +
              `This happens when a policy references the same table it protects.\n\n`
            : `❌ Problem: Row Level Security (RLS) is blocking access with the Anon/Publishable key.\n\n`) +
          `💡 Solution:\n` +
          `1. Add your Service Role Key in the "Service Role Key (Optional)" field above\n` +
          `2. Click "Verify Tables Created" again\n\n` +
          `The Service Role Key bypasses RLS and allows setup to complete.\n\n` +
          (data.fixPolicySql ? `🔧 Alternative: Fix the policy in Supabase SQL Editor:\n\n\`\`\`sql\n${data.fixPolicySql}\n\`\`\`\n\n` : '') +
          `Diagnostic: ${diagnosticData?.recommendation || data.details || data.error}\n\n` +
          (diagnosticData?.diagnostics ? `Details:\n${diagnosticData.diagnostics.map((d: any) => `- ${d.step}: ${d.error || 'OK'}`).join('\n')}` : '')
        )
      } else if (data.needsTable) {
        // Tables still don't exist
        setTablesVerified(false)
        toast.error('Tables not found', {
          description: diagnosticData?.recommendation || 'Please make sure you ran the SQL in Supabase SQL Editor and it completed successfully.',
          duration: 15000
        })
        setErrorMessage(
          `❌ Tables Not Accessible\n\n` +
          `Diagnostic Results:\n` +
          (diagnosticData?.diagnostics ? diagnosticData.diagnostics.map((d: any) => 
            `${d.success ? '✅' : '❌'} ${d.step}${d.error ? `: ${d.error}` : ''}`
          ).join('\n') : 'No diagnostics available') +
          `\n\n` +
          `Recommendation: ${diagnosticData?.recommendation || data.error}\n\n` +
          `Please verify:\n` +
          `1. You copied the entire SQL (from CREATE TABLE to the end)\n` +
          `2. You clicked "Run" in Supabase SQL Editor\n` +
          `3. You saw a "Success" message\n` +
          `4. Check Supabase Table Editor to confirm tables exist\n\n` +
          `If tables exist but you see permission errors, add Service Role Key and try again.`
        )
      } else {
        throw new Error(data.error || 'Failed to verify tables')
      }
    } catch (error: any) {
      setTablesVerified(false)
      toast.error('Failed to verify tables')
      setErrorMessage(error.message || 'Failed to verify tables')
    } finally {
      setVerifyingTables(false)
    }
  }

  const saveDatabaseConfig = async () => {
    const projectUrl = databaseConfig.projectUrl?.trim()
    const anonKey = databaseConfig.anonKey?.trim()
    
    if (!projectUrl || !anonKey) {
      toast.error('Please enter Project URL and Publishable Key')
      setErrorMessage('Please enter Project URL and Publishable Key (Anon/Public Key)')
      return
    }
    
    if (connectionStatus !== 'success' && !tablesVerified) {
      toast.error('Please test connection first or verify tables')
      return
    }

    setLoading(true)
    setErrorMessage('') // Clear previous errors
    try {
      const response = await fetch('/api/setup/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectUrl: projectUrl,
          anonKey: anonKey,
          serviceRoleKey: databaseConfig.serviceRoleKey?.trim() || '',
          databaseUrl: databaseConfig.databaseUrl?.trim() || ''
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.needsTable) {
          toast.error(data.error || 'Database tables not found', {
            description: 'Please create the tables using the SQL below. Click the error message to see full instructions.',
            duration: 20000
          })
          
          // Format the SQL nicely for display
          const sqlText = data.sql || 'SQL not provided'
          setErrorMessage(
            `📋 ${data.error || 'Database tables need to be created.'}\n\n` +
            (data.suggestion ? `💡 ${data.suggestion}\n\n` : '') +
            `📝 Follow these steps:\n\n` +
            `1️⃣ Open Supabase SQL Editor:\n   ${data.sqlEditorUrl || 'Go to Supabase Dashboard → SQL Editor → New Query'}\n\n` +
            `2️⃣ Copy the SQL below (click to select all):\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            sqlText +
            `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `3️⃣ Paste it into the SQL Editor\n\n` +
            `4️⃣ Click "Run" (or press Cmd/Ctrl + Enter)\n\n` +
            `5️⃣ Wait for "Success" message\n\n` +
            `6️⃣ Come back here and click "Continue" again\n\n` +
            (data.details ? `ℹ️ Technical details: ${data.details}\n` : '')
          )
        } else {
          toast.success('Database configured successfully!')
          setStep('admin')
        }
      } else {
        // Handle non-200 responses that might also need tables
        if (data.needsTable && data.sql) {
          const sqlText = data.sql
          toast.error(data.error || 'Database tables not found', {
            description: 'Please create the tables using the SQL below.',
            duration: 20000
          })
          setErrorMessage(
            `📋 ${data.error || 'Database tables need to be created.'}\n\n` +
            (data.suggestion ? `💡 ${data.suggestion}\n\n` : '') +
            `📝 Follow these steps:\n\n` +
            `1️⃣ Open Supabase SQL Editor:\n   ${data.sqlEditorUrl || 'Go to Supabase Dashboard → SQL Editor → New Query'}\n\n` +
            `2️⃣ Copy the SQL below:\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            sqlText +
            `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `3️⃣ Paste and run it in SQL Editor\n\n` +
            `4️⃣ Return here and click "Continue" again\n\n` +
            (data.details ? `ℹ️ ${data.details}\n` : '')
          )
        } else {
          // Show detailed error message
          const errorMsg = data.error || 'Failed to save database config'
          const details = data.details ? `\n\nDetails: ${data.details}` : ''
          throw new Error(errorMsg + details)
        }
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

    // Check if Service Role Key is provided (required for admin creation)
    if (!databaseConfig.serviceRoleKey?.trim()) {
      toast.error('Service Role Key Required', {
        description: 'Admin user creation requires Service Role Key to bypass RLS. Please add it in the database setup step.',
        duration: 10000
      })
      setErrorMessage(
        `🔑 Service Role Key Required\n\n` +
        `Admin user creation requires Service Role Key to bypass Row Level Security (RLS) policies.\n\n` +
        `Please:\n` +
        `1. Go back to the Database Setup step\n` +
        `2. Add your Service Role Key in the "Service Role Key (Optional)" field\n` +
        `3. Click "Continue" to save the configuration\n` +
        `4. Then try creating the admin user again\n\n` +
        `The Service Role Key bypasses RLS and allows admin user creation.`
      )
      return
    }

    setLoading(true)
    setErrorMessage('')
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
        if (data.needsServiceRoleKey) {
          toast.error('Service Role Key Required', {
            description: data.details || 'Please add Service Role Key in database setup step.',
            duration: 10000
          })
          setErrorMessage(
            `🔑 Service Role Key Required\n\n` +
            `${data.details || 'Admin user creation requires Service Role Key to bypass RLS policies.'}\n\n` +
            `Please:\n` +
            `1. Go back to the Database Setup step\n` +
            `2. Add your Service Role Key in the "Service Role Key (Optional)" field\n` +
            `3. Click "Continue" to save the configuration\n` +
            `4. Then try creating the admin user again`
          )
        } else {
          throw new Error(data.error || 'Failed to create admin user')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create admin user')
      setErrorMessage(error.message || 'Failed to create admin user')
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
                  <strong>New UI:</strong> Click "Connect" button at top → App Frameworks → Next.js → Copy SUPABASE_URL
                  <br />
                  <strong>Old UI:</strong> Settings → API → Project URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anon-key">Publishable Key (Anon/Public Key) *</Label>
                <div className="relative">
                  <Input
                    id="anon-key"
                    type={showServiceKey ? 'text' : 'password'}
                    placeholder="sb_publishable_... or eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
                  <strong>New UI:</strong> Click "Connect" → App Frameworks → Next.js → Copy the value of <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code>
                  <br />
                  <strong>Old UI:</strong> Settings → API → anon/public key (this becomes <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>)
                  <br />
                  <span className="text-blue-600 dark:text-blue-400">✓ Both work the same - just different names in Supabase UI</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-key">Service Role Key (Optional)</Label>
                <div className="relative">
                  <Input
                    id="service-key"
                    type={showServiceKey ? 'text' : 'password'}
                    placeholder="sb_service_... or eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
                  <strong>New UI:</strong> Click "Connect" → App Frameworks → Next.js → Look for service_role key
                  <br />
                  <strong>Old UI:</strong> Settings → API → service_role key
                  <br />
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
                <Alert variant="destructive" className="max-h-96 overflow-y-auto">
                  <AlertDescription className="whitespace-pre-wrap font-mono text-sm">{errorMessage}</AlertDescription>
                  {errorMessage.includes('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━') && (
                    <div className="mt-4 space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const sqlMatch = errorMessage.match(/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n([\s\S]*?)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━/)
                          if (sqlMatch && sqlMatch[1]) {
                            navigator.clipboard.writeText(sqlMatch[1].trim())
                            toast.success('SQL copied to clipboard!')
                          }
                        }}
                        className="w-full"
                      >
                        📋 Copy SQL to Clipboard
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={verifyTables}
                        disabled={verifyingTables || !databaseConfig.projectUrl?.trim() || !databaseConfig.anonKey?.trim()}
                        className="w-full"
                      >
                        {verifyingTables ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verifying Tables...
                          </>
                        ) : tablesVerified ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Tables Verified ✓
                          </>
                        ) : (
                          <>
                            <Database className="h-4 w-4 mr-2" />
                            Verify Tables Created
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Alert>
              )}

              {tablesVerified && !errorMessage && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    ✅ All tables verified! Proceeding to save configuration...
                  </AlertDescription>
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
                  disabled={testing || !databaseConfig.projectUrl?.trim() || !databaseConfig.anonKey?.trim()}
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
                  disabled={loading || (connectionStatus !== 'success' && !tablesVerified)}
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

