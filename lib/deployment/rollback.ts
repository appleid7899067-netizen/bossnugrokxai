import { createRequestId } from '@/lib/core/config'
import type { ID } from '@/lib/domain/types'

export type RollbackResult = {
  success: boolean
  deploymentId: ID
  rollbackId: string
  message: string
  timestamp: string
}

const rollbackLog: RollbackResult[] = []

export function rollback(deploymentId: string, reason?: string): RollbackResult {
  const result: RollbackResult = {
    success: true,
    deploymentId,
    rollbackId: `rb_${createRequestId().replace('req_', '')}`,
    message: reason ? `Rollback initiated: ${reason}` : 'Rollback initiated successfully',
    timestamp: new Date().toISOString(),
  }
  rollbackLog.push(result)
  return result
}

export function listRollbacks(): RollbackResult[] {
  return [...rollbackLog]
}
