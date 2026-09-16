import { getRuntimeConfig } from '@/lib/core/config'
import { systemCheck } from '@/lib/health/system-check'
import { featureEnabled } from '@/lib/features/feature-flags'

export type GuardResult = {
  ok: boolean
  build: boolean
  health: boolean
  ready: boolean
  checks: Record<string, boolean | string>
  message?: string
}

export async function deploymentGuard(options?: {
  requireCreateMode?: boolean
  requireSandbox?: boolean
}): Promise<GuardResult> {
  const config = getRuntimeConfig()
  const health = systemCheck()

  const checks: Record<string, boolean | string> = {
    environment: config.environment,
    appName: config.appName,
    healthStatus: health.status,
    featureDeployGuard: featureEnabled('deployGuard'),
    createMode: featureEnabled('createMode'),
    sandbox: featureEnabled('sandbox'),
  }

  const build = true
  const healthOk = health.status === 'healthy'
  const ready = build && healthOk && featureEnabled('deployGuard')

  if (options?.requireCreateMode && !featureEnabled('createMode')) {
    return {
      ok: false,
      build,
      health: healthOk,
      ready: false,
      checks,
      message: 'Create Mode feature flag is required but disabled',
    }
  }

  if (options?.requireSandbox && !featureEnabled('sandbox')) {
    return {
      ok: false,
      build,
      health: healthOk,
      ready: false,
      checks,
      message: 'Sandbox feature flag is required but disabled',
    }
  }

  return {
    ok: ready,
    build,
    health: healthOk,
    ready,
    checks,
    message: ready ? 'All deploy guards passed' : 'Deploy blocked by guard checks',
  }
}
