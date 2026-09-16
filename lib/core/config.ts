export const config = {
  env: process.env.NODE_ENV ?? 'development',
  appName: 'BossnuGrokXAI',
  logLevel: process.env.LOG_LEVEL ?? 'info',
}

export type RuntimeConfig = {
  appName: string
  environment: string
  puterEnabled: boolean
  createModeEnabled: boolean
  sandboxEnabled: boolean
  logLevel: string
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    appName: config.appName,
    environment: config.env,
    puterEnabled: process.env.PUTER_ENABLED === 'true' || process.env.NEXT_PUBLIC_PUTER_ENABLED === 'true',
    createModeEnabled: process.env.CREATE_MODE_ENABLED !== 'false',
    sandboxEnabled: process.env.SANDBOX_ENABLED === 'true',
    logLevel: config.logLevel,
  }
}

export function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
