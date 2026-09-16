import { NextResponse } from 'next/server'
import { createRequestId } from '@/lib/core/config'
import { getDemoIdentity } from '@/lib/adapters/auth/mock'

export async function GET() {
  const identity = getDemoIdentity()
  return NextResponse.json({ ...identity, capabilities: ['chat:use', 'models:read', 'workflows:use', 'audit:read'], requestId: createRequestId() })
}
