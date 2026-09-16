import { getRuntimeConfig } from '@/lib/core/config'
import { featureEnabled, listFeatures } from '@/lib/features/feature-flags'

export type SystemHealth = {
  app: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  time: string
  environment: string
  features: Record<string, boolean>
  checks: {
    config: boolean
    featureFlags: boolean
    createMode: boolean
  }
}

export function systemCheck(): SystemHealth {
  const config = getRuntimeConfig()
  const features = listFeatures()

  const checks = {
    config: !!config.appName,
    featureFlags: typeof featureEnabled === 'function',
    createMode: featureEnabled('createMode'),
  }

  const allOk = Object.values(checks).every(Boolean)

  return {
    app: config.appName,
    status: allOk ? 'healthy' : 'degraded',
    time: new Date().toISOString(),
    environment: config.environment,
    features,
    checks,
  }
}
