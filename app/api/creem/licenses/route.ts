/**
 * Creem.io License API Routes
 * POST /api/creem/licenses/activate - Activate a license key
 * POST /api/creem/licenses/deactivate - Deactivate a license key
 * POST /api/creem/licenses/validate - Validate a license key
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCreemClientFromEnv } from '@/lib/creem-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import type {
  ActivateLicenseRequest,
  DeactivateLicenseRequest,
  ValidateLicenseRequest,
} from '@/types/creem'

export async function POST(request: NextRequest) {
  try {
    const client = getCreemClientFromEnv()
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') // 'activate', 'deactivate', or 'validate'
    const body = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'action parameter is required (activate, deactivate, or validate)' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'activate': {
        const activateRequest: ActivateLicenseRequest = body
        if (!activateRequest.licenseKey) {
          return NextResponse.json(
            { error: 'licenseKey is required' },
            { status: 400 }
          )
        }
        const license = await client.activateLicense(activateRequest)
        
        // Log license activation
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (supabaseUrl && serviceRoleKey) {
            const requestInfo = extractRequestInfo(request)
            await logActivity(supabaseUrl, serviceRoleKey, {
              action: 'creem.license.activated',
              resource_type: 'license',
              resource_id: license.id || activateRequest.licenseKey,
              ip_address: requestInfo.ip_address,
              user_agent: requestInfo.user_agent,
              metadata: {
                license_key: activateRequest.licenseKey.substring(0, 8) + '...' // Only log partial key
              }
            })
          }
        } catch (logError) {
          console.warn('⚠️ Failed to log license activation (non-critical):', logError)
        }

        return NextResponse.json({
          success: true,
          data: license,
        })
      }

      case 'deactivate': {
        const deactivateRequest: DeactivateLicenseRequest = body
        if (!deactivateRequest.licenseKey) {
          return NextResponse.json(
            { error: 'licenseKey is required' },
            { status: 400 }
          )
        }
        const license = await client.deactivateLicense(deactivateRequest)
        
        // Log license deactivation
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (supabaseUrl && serviceRoleKey) {
            const requestInfo = extractRequestInfo(request)
            await logActivity(supabaseUrl, serviceRoleKey, {
              action: 'creem.license.deactivated',
              resource_type: 'license',
              resource_id: license.id || deactivateRequest.licenseKey,
              ip_address: requestInfo.ip_address,
              user_agent: requestInfo.user_agent,
              metadata: {
                license_key: deactivateRequest.licenseKey.substring(0, 8) + '...' // Only log partial key
              }
            })
          }
        } catch (logError) {
          console.warn('⚠️ Failed to log license deactivation (non-critical):', logError)
        }

        return NextResponse.json({
          success: true,
          data: license,
        })
      }

      case 'validate': {
        const validateRequest: ValidateLicenseRequest = body
        if (!validateRequest.licenseKey) {
          return NextResponse.json(
            { error: 'licenseKey is required' },
            { status: 400 }
          )
        }
        const result = await client.validateLicense(validateRequest)
        return NextResponse.json({
          success: true,
          data: result,
        })
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Must be 'activate', 'deactivate', or 'validate'` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Creem license operation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'LICENSE_ERROR',
          message: error.message || 'Failed to process license operation',
          details: error.details,
        },
      },
      { status: error.statusCode || 500 }
    )
  }
}

