import { NextResponse } from 'next/server'
import { MockModelRegistry } from '@/lib/adapters/ai/mock'
import { createRequestId } from '@/lib/core/config'
import type { RequestContext } from '@/lib/domain/types'

export async function GET() {
  const context: RequestContext = { requestId: createRequestId(), userId: 'usr_demo_01', organizationId: 'org_demo_01', role: 'admin' }
  const models = await new MockModelRegistry().listAvailable(context)
  return NextResponse.json({ models, source: 'mock-safe-mode', requestId: context.requestId })
}
