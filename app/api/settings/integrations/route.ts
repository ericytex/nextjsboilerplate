import { NextResponse } from 'next/server'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'

// Fallback in-memory store if Supabase is not configured
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

    // Try to save to Supabase if configured
    if (isSupabaseConfigured() && config.enabled) {
      try {
        const supabase = createServerClient()
        
        // Save to Supabase
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
          // Also update environment variables if this is Supabase itself
          if (integrationId === 'supabase' && config.customSettings?.projectUrl) {
            console.log('Supabase integration configured. Update your environment variables:')
            console.log('NEXT_PUBLIC_SUPABASE_URL:', config.customSettings.projectUrl)
            console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', config.customSettings.anonKey)
          }

          return NextResponse.json({
            success: true,
            message: 'Integration configuration saved to Supabase',
            integration: {
              id: supabaseData.id,
              config: supabaseData.config,
              updatedAt: supabaseData.updated_at
            }
          })
        }
      } catch (supabaseError) {
        console.log('Supabase save failed, using fallback:', supabaseError)
      }
    }

    // Fallback to in-memory store
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
      message: 'Integration configuration saved successfully',
      integration: integrationsStore[integrationId]
    })
  } catch (error) {
    console.error('Error saving integration:', error)
    return NextResponse.json(
      { error: 'Failed to save integration configuration' },
      { status: 500 }
    )
  }
}

