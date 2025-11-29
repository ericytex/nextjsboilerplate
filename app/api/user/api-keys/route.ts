/**
 * User API Keys Management
 * GET /api/user/api-keys - Get user's API keys
 * POST /api/user/api-keys - Create a new API key
 * DELETE /api/user/api-keys - Delete an API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Generate a secure API key
function generateApiKey(): string {
  return `sk_${crypto.randomBytes(32).toString('hex')}`
}

// Hash API key for storage
async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10)
}

// Get user's API keys
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 503 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, permissions, last_used_at, expires_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch API keys',
        details: error.message
      }, { status: 500 })
    }

    // Format response (never return the actual key, only metadata)
    const formattedKeys = (apiKeys || []).map(key => ({
      id: key.id,
      name: key.name,
      permissions: key.permissions || [],
      lastUsed: key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never',
      createdAt: new Date(key.created_at).toLocaleDateString(),
      expiresAt: key.expires_at ? new Date(key.expires_at).toLocaleDateString() : null,
      isExpired: key.expires_at ? new Date(key.expires_at) < new Date() : false
    }))

    return NextResponse.json({
      success: true,
      apiKeys: formattedKeys
    })
  } catch (error: any) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch API keys',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Create a new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, permissions = [], expiresInDays } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'API key name is required'
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 503 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    const requestInfo = extractRequestInfo(request)

    // Generate API key
    const apiKey = generateApiKey()
    const keyHash = await hashApiKey(apiKey)

    // Calculate expiration date if provided
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Store in database
    const { data: newKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: name.trim(),
        key_hash: keyHash,
        permissions: permissions.length > 0 ? permissions : ['read'],
        expires_at: expiresAt
      })
      .select('id, name, created_at')
      .single()

    if (insertError) {
      console.error('Error creating API key:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create API key',
        details: insertError.message
      }, { status: 500 })
    }

    // Log activity
    await logActivity(supabaseUrl, serviceRoleKey, {
      action: 'user.api_key.created',
      resource_type: 'api_key',
      resource_id: newKey.id,
      user_id: userId,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      metadata: {
        key_name: name,
        has_expiration: !!expiresAt
      }
    })

    // Return the key only once (this is the only time the user will see it)
    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save this key now - you won\'t be able to see it again!',
      apiKey: apiKey, // Only returned on creation
      keyInfo: {
        id: newKey.id,
        name: newKey.name,
        createdAt: newKey.created_at
      }
    })
  } catch (error: any) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create API key',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const keyId = searchParams.get('keyId')

    if (!userId || !keyId) {
      return NextResponse.json({
        success: false,
        error: 'User ID and Key ID are required'
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 503 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    const requestInfo = extractRequestInfo(request)

    // Verify the key belongs to the user
    const { data: key, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, name')
      .eq('id', keyId)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError || !key) {
      return NextResponse.json({
        success: false,
        error: 'API key not found or access denied'
      }, { status: 404 })
    }

    // Delete the key
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting API key:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete API key',
        details: deleteError.message
      }, { status: 500 })
    }

    // Log activity
    await logActivity(supabaseUrl, serviceRoleKey, {
      action: 'user.api_key.deleted',
      resource_type: 'api_key',
      resource_id: keyId,
      user_id: userId,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      metadata: {
        key_name: key.name
      }
    })

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete API key',
        details: error.message
      },
      { status: 500 }
    )
  }
}

