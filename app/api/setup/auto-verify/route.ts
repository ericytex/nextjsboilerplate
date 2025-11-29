import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Auto-verify database connection and tables using env vars
 * This endpoint uses Service Role Key from env vars (if available) server-side
 * POST /api/setup/auto-verify
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectUrl, anonKey } = body

    if (!projectUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Project URL and Anon Key are required' },
        { status: 400 }
      )
    }

    // Use Service Role Key from env vars if available (server-side only, not exposed to client)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const databaseUrl = process.env.DATABASE_URL

    // Try with Service Role Key first (if available) to get accurate status
    const key = serviceRoleKey || anonKey
    const supabase = createClient(projectUrl, key)

    // Check if tables exist
    const { error: configCheckError, data: configCheckData } = await supabase
      .from('integration_configs')
      .select('id')
      .limit(1)

    if (!configCheckError) {
      // Tables exist and are accessible!
      return NextResponse.json({
        success: true,
        tablesExist: true,
        accessible: true,
        usedServiceRoleKey: !!serviceRoleKey,
        message: serviceRoleKey 
          ? 'Tables exist and are accessible with Service Role Key.'
          : 'Tables exist and are accessible with Anon Key.'
      })
    }

    // Check error type
    const isTableMissingError = configCheckError.code === 'PGRST205' || 
                                configCheckError.code === 'PGRST116' ||
                                configCheckError.code === '42P01' ||
                                configCheckError.message?.includes('Could not find the table') ||
                                configCheckError.message?.includes('relation') ||
                                configCheckError.message?.includes('does not exist')

    const isPermissionError = configCheckError.code === '42501' || 
                             configCheckError.message?.includes('permission denied') ||
                             configCheckError.message?.includes('RLS') ||
                             configCheckError.message?.includes('policy')

    if (isTableMissingError && serviceRoleKey) {
      // Tables truly don't exist (verified with Service Role Key)
      return NextResponse.json({
        success: false,
        tablesExist: false,
        accessible: false,
        usedServiceRoleKey: true,
        needsTable: true,
        message: 'Tables do not exist. Please create them using the SQL schema.',
        error: configCheckError.message
      })
    } else if (isTableMissingError && !serviceRoleKey) {
      // Can't determine if tables exist or RLS is blocking
      return NextResponse.json({
        success: false,
        tablesExist: null, // Unknown
        accessible: false,
        usedServiceRoleKey: false,
        needsServiceRoleKey: true,
        message: 'Cannot verify if tables exist. Add Service Role Key to verify.',
        error: configCheckError.message,
        hint: 'PGRST205 can mean tables don\'t exist OR RLS is blocking. Service Role Key is needed to verify.'
      })
    } else if (isPermissionError) {
      // Permission issue - tables likely exist but RLS is blocking
      return NextResponse.json({
        success: false,
        tablesExist: true, // Likely exist but blocked
        accessible: false,
        usedServiceRoleKey: !!serviceRoleKey,
        permissionIssue: true,
        message: serviceRoleKey 
          ? 'Permission error even with Service Role Key. Check RLS policies.'
          : 'Tables likely exist but RLS is blocking access. Add Service Role Key to bypass RLS.',
        error: configCheckError.message
      })
    }

    // Unknown error
    return NextResponse.json({
      success: false,
      tablesExist: null,
      accessible: false,
      usedServiceRoleKey: !!serviceRoleKey,
      message: 'Unknown error while checking tables.',
      error: configCheckError.message
    })

  } catch (error: any) {
    console.error('Auto-verify error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to auto-verify database',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

