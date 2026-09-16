import { NextResponse } from 'next/server'
import { getRuntimeConfig } from '@/lib/core/config'

export async function GET() {
  const config = getRuntimeConfig()
  return NextResponse.json({ status: 'ok', service: config.appName, environment: config.environment, persistence: 'adapter-required', ai: config.puterEnabled ? 'puter-enabled' : 'mock-safe-mode', timestamp: new Date().toISOString() })
}
