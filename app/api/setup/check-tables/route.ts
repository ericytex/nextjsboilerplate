import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'

/**
 * Comprehensive table detection with detailed logging
 * POST /api/setup/check-tables
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectUrl, anonKey, serviceRoleKey } = body

    if (!projectUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Project URL and Anon Key are required' },
        { status: 400 }
      )
    }

    const diagnostics: any[] = []
    let tablesFound = false
    let permissionIssue = false
    let errorDetails: any = null

    // Test 1: Try with anon key
    diagnostics.push({ step: 'Testing with Anon Key', key: 'anon' })
    const anonSupabase = createSupabaseClient(projectUrl, anonKey)
    
    const { data: anonData, error: anonError } = await anonSupabase
      .from('integration_configs')
      .select('id')
      .limit(1)

    if (!anonError) {
      diagnostics.push({ step: 'Anon Key: integration_configs table accessible', success: true })
      
      // Check users table
      const { error: usersError } = await anonSupabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (!usersError) {
        diagnostics.push({ step: 'Anon Key: users table accessible', success: true })
        tablesFound = true
      } else {
        diagnostics.push({ 
          step: 'Anon Key: users table check failed', 
          error: usersError.message,
          code: usersError.code 
        })
        errorDetails = usersError
      }
    } else {
      diagnostics.push({ 
        step: 'Anon Key: integration_configs table check failed', 
        error: anonError.message,
        code: anonError.code,
        hint: anonError.code === '42501' || anonError.message?.includes('permission') 
          ? 'RLS blocking access' 
          : anonError.code === 'PGRST116' || anonError.code === '42P01'
          ? 'Table does not exist'
          : 'Unknown error'
      })
      errorDetails = anonError
      
      // Check if it's a permission issue
      if (anonError.code === '42501' || anonError.message?.includes('permission') || anonError.message?.includes('RLS')) {
        permissionIssue = true
      }
    }

    // Test 2: Try with service role key if available
    if (serviceRoleKey && (!tablesFound || permissionIssue)) {
      diagnostics.push({ step: 'Testing with Service Role Key', key: 'service_role' })
      const serviceSupabase = createSupabaseClient(projectUrl, serviceRoleKey)
      
      const { data: serviceData, error: serviceError } = await serviceSupabase
        .from('integration_configs')
        .select('id')
        .limit(1)

      if (!serviceError) {
        diagnostics.push({ step: 'Service Role Key: integration_configs table accessible', success: true })
        
        // Check users table
        const { error: serviceUsersError } = await serviceSupabase
          .from('users')
          .select('id')
          .limit(1)
        
        if (!serviceUsersError) {
          diagnostics.push({ step: 'Service Role Key: users table accessible', success: true })
          tablesFound = true
          permissionIssue = false
        } else {
          diagnostics.push({ 
            step: 'Service Role Key: users table check failed', 
            error: serviceUsersError.message,
            code: serviceUsersError.code 
          })
        }
      } else {
        diagnostics.push({ 
          step: 'Service Role Key: integration_configs table check failed', 
          error: serviceError.message,
          code: serviceError.code 
        })
      }
    }

    // Return comprehensive diagnostics
    return NextResponse.json({
      tablesFound,
      permissionIssue,
      diagnostics,
      errorDetails: errorDetails ? {
        message: errorDetails.message,
        code: errorDetails.code,
        hint: errorDetails.code === '42501' 
          ? 'Permission denied - RLS is blocking access. Use Service Role Key.'
          : errorDetails.code === 'PGRST116' || errorDetails.code === '42P01'
          ? 'Table does not exist - Run the SQL schema in Supabase SQL Editor'
          : 'Unknown error - Check Supabase dashboard'
      } : null,
      recommendation: tablesFound 
        ? 'Tables are accessible! You can proceed.'
        : errorDetails?.code === '42P17' || errorDetails?.message?.includes('infinite recursion')
        ? 'Tables exist but RLS policy has infinite recursion. Add Service Role Key to bypass, or fix the policy in Supabase SQL Editor.'
        : permissionIssue && serviceRoleKey
        ? 'Tables exist but RLS is blocking. Service Role Key works - proceed with setup.'
        : permissionIssue && !serviceRoleKey
        ? 'Tables exist but RLS is blocking. Add Service Role Key to proceed.'
        : 'Tables may not exist. Run the SQL schema in Supabase SQL Editor.'
    })
  } catch (error: any) {
    console.error('Table check error:', error)
    return NextResponse.json(
      { 
        tablesFound: false,
        error: 'Failed to check tables',
        details: error.message,
        diagnostics: [{ step: 'Exception occurred', error: error.message }]
      },
      { status: 500 }
    )
  }
}

