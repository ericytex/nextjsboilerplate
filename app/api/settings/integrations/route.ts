import { NextResponse } from 'next/server'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'
import { createSupabaseClient } from '@/lib/supabase-client'

// Fallback in-memory store if Supabase is not configured
// This is only used temporarily until Supabase is set up
let integrationsStore: Record<string, any> = {}

export async function GET() {
  try {
    // Try to use Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = createServerClient()
        const { data, error } = await supabase
          .from('integration_configs')
          .select('*')
          .order('updated_at', { ascending: false })

        if (!error && data) {
          return NextResponse.json({
            integrations: data.map(item => ({
              id: item.id,
              config: item.config
            }))
          })
        }
      } catch (supabaseError) {
        console.log('Supabase not available, using fallback:', supabaseError)
      }
    }

    // Fallback to in-memory store
    return NextResponse.json({
      integrations: Object.values(integrationsStore).length > 0 
        ? Object.values(integrationsStore)
        : []
    })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { integrationId, config } = body

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      )
    }

    // Special handling for Supabase configuration (chicken-and-egg problem)
    // If user is configuring Supabase itself, use the credentials from the form
    if (integrationId === 'supabase' && config.enabled && config.customSettings?.projectUrl && config.customSettings?.anonKey) {
      try {
        // Use form credentials directly to save Supabase config to Supabase
        const supabase = createSupabaseClient(
          config.customSettings.projectUrl,
          config.customSettings.anonKey
        )

        // First, ensure the table exists by trying to create it
        // If it doesn't exist, we'll get an error but that's okay - user needs to run SQL
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('integration_configs')
          .upsert({
            id: integrationId,
            config: config,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select()
          .single()

        if (!supabaseError && supabaseData) {
          // Successfully saved to Supabase! Now all future configs will use Supabase
          return NextResponse.json({
            success: true,
            message: '✅ Supabase configured and saved to database! All future configurations will be persisted.',
            integration: {
              id: supabaseData.id,
              config: supabaseData.config,
              updatedAt: supabaseData.updated_at
            },
            persisted: true
          })
        } else if (supabaseError?.code === '42P01' || supabaseError?.code === 'PGRST116') {
          // Table doesn't exist - user needs to create it
          return NextResponse.json({
            success: false,
            error: 'Database table not found',
            message: 'Please create the integration_configs table in Supabase. See setup instructions.',
            needsTable: true,
            sql: `CREATE TABLE IF NOT EXISTS integration_configs (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
          }, { status: 400 })
        } else {
          throw supabaseError
        }
      } catch (error: any) {
        console.error('Error saving Supabase config:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to save to Supabase',
          message: error.message || 'Please check your credentials and try again',
          details: error
        }, { status: 500 })
      }
    }

    // For all other integrations, try to use Supabase if configured
    if (isSupabaseConfigured() && config.enabled) {
      try {
        const supabase = createServerClient()
        
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('integration_configs')
          .upsert({
            id: integrationId,
            config: config,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select()
          .single()

        if (!supabaseError && supabaseData) {
          return NextResponse.json({
            success: true,
            message: 'Integration configuration saved to Supabase database',
            integration: {
              id: supabaseData.id,
              config: supabaseData.config,
              updatedAt: supabaseData.updated_at
            },
            persisted: true
          })
        }
      } catch (supabaseError) {
        console.log('Supabase save failed, using fallback:', supabaseError)
      }
    }

    // Fallback to in-memory store (temporary, until Supabase is configured)
    integrationsStore[integrationId] = {
      id: integrationId,
      config,
      updatedAt: new Date().toISOString()
    }

    if (config.enabled) {
      console.log(`Integration ${integrationId} enabled with config:`, {
        hasApiKey: !!config.apiKey,
        hasSecretKey: !!config.secretKey,
        hasDatabaseUrl: !!config.databaseUrl
      })
    }

    return NextResponse.json({
      success: true,
      message: integrationId === 'supabase' 
        ? '⚠️ Configuration saved temporarily. Configure Supabase first to enable database persistence.'
        : '⚠️ Configuration saved temporarily. Set up Supabase database to persist configurations.',
      integration: integrationsStore[integrationId],
      persisted: false,
      warning: 'This configuration is stored in memory and will be lost on server restart. Configure Supabase database for persistence.'
    })
  } catch (error) {
    console.error('Error saving integration:', error)
    return NextResponse.json(
      { error: 'Failed to save integration configuration' },
      { status: 500 }
    )
  }
}

