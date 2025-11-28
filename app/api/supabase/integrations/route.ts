import { NextResponse } from 'next/server'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'

/**
 * Save integration configuration to Supabase
 * POST /api/supabase/integrations
 */
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { integrationId, config } = body

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Upsert integration configuration
    // Note: You'll need to create this table in Supabase
    const { data, error } = await supabase
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

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save integration configuration', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Integration configuration saved to Supabase',
      integration: data
    })
  } catch (error: any) {
    console.error('Error saving integration:', error)
    return NextResponse.json(
      { error: 'Failed to save integration configuration', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Get all integration configurations from Supabase
 * GET /api/supabase/integrations
 */
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { integrations: [] },
        { status: 200 }
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('integration_configs')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { integrations: [], error: error.message },
        { status: 200 } // Return empty array instead of error
      )
    }

    return NextResponse.json({
      integrations: data || []
    })
  } catch (error: any) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { integrations: [] },
      { status: 200 }
    )
  }
}

