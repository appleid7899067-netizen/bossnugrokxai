export type ID = string
export type ISODate = string

export type Organization = { id: ID; name: string; slug: string; status: 'active' | 'suspended'; createdAt: ISODate }
export type User = { id: ID; displayName: string; email: string; status: 'active' | 'invited' | 'suspended' }
export type Role = 'owner' | 'admin' | 'manager' | 'member' | 'auditor'
export type Membership = { id: ID; organizationId: ID; userId: ID; role: Role; department?: string; status: 'active' | 'invited' | 'revoked' }
export type ExternalProvider = 'puter' | 'oidc' | 'saml'
export type ExternalIdentity = { id: ID; provider: ExternalProvider; subject: string; userId: ID; verifiedAt: ISODate }
export type Conversation = { id: ID; organizationId: ID; createdBy: ID; title: string; status: 'active' | 'archived'; createdAt: ISODate }
export type Message = { id: ID; conversationId: ID; organizationId: ID; author: 'user' | 'assistant' | 'system'; content: string; modelId?: string; createdAt: ISODate }
export type Model = { id: string; provider: 'puter' | 'mock'; label: string; capabilities: Array<'chat' | 'vision' | 'tools'>; enabled: boolean; fallbackPriority: number }
export type WorkflowStatus = 'draft' | 'queued' | 'running' | 'waiting_approval' | 'succeeded' | 'failed' | 'cancelled'
export type Workflow = { id: ID; organizationId: ID; name: string; version: number; enabled: boolean }
export type WorkflowRun = { id: ID; workflowId: ID; organizationId: ID; status: WorkflowStatus; idempotencyKey: string; startedAt?: ISODate; completedAt?: ISODate }
export type AuditEvent = { id: ID; organizationId: ID; actorId: ID; action: string; targetType: string; targetId: ID; requestId: string; createdAt: ISODate }
export type UsageRecord = { organizationId: ID; userId: ID; modelId: string; inputTokens: number; outputTokens: number; latencyMs: number; createdAt: ISODate }

export type RequestContext = { requestId: string; userId: ID; organizationId: ID; role: Role }
export type AIMessage = Pick<Message, 'author' | 'content'>
export type AIRequest = { context: RequestContext; modelId: string; messages: AIMessage[]; maxOutputTokens: number; signal?: AbortSignal }
export type AIChunk = { type: 'text' | 'usage' | 'done'; value: string | UsageRecord }

export interface IdentityRepository { findUserById(id: ID): Promise<User | null>; findExternalIdentity(provider: ExternalProvider, subject: string): Promise<ExternalIdentity | null>; linkExternalIdentity(identity: ExternalIdentity): Promise<void> }
export interface ConversationRepository { create(input: Omit<Conversation, 'id' | 'createdAt'>): Promise<Conversation>; appendMessage(input: Omit<Message, 'id' | 'createdAt'>): Promise<Message>; listMessages(conversationId: ID, organizationId: ID): Promise<Message[]> }
export interface ModelRegistry { listAvailable(context: RequestContext): Promise<Model[]>; get(id: string, context: RequestContext): Promise<Model | null> }
export interface AIGateway { stream(request: AIRequest): AsyncIterable<AIChunk> }
export interface WorkflowRunner { start(workflowId: ID, context: RequestContext, idempotencyKey: string): Promise<WorkflowRun>; cancel(runId: ID, context: RequestContext): Promise<WorkflowRun> }

export type ProjectStatus = 'draft' | 'generating' | 'ready' | 'preview' | 'deployed' | 'failed'
export type ProjectTemplate = 'blank' | 'nextjs' | 'api' | 'chatbot' | 'dashboard'

export type ProjectFile = {
  path: string
  content: string
  language?: string
}

export type Project = {
  id: ID
  organizationId: ID
  createdBy: ID
  name: string
  slug: string
  description?: string
  template: ProjectTemplate
  status: ProjectStatus
  files: ProjectFile[]
  sandboxId?: ID
  snapshotId?: ID
  previewUrl?: string
  createdAt: ISODate
  updatedAt: ISODate
}

export type CreateProjectInput = {
  name: string
  description?: string
  template?: ProjectTemplate
  context: RequestContext
}

export type GenerateFilesInput = {
  projectId: ID
  prompt?: string
  context: RequestContext
}

export type PreviewRuntimeInput = {
  projectId: ID
  context: RequestContext
}

export type DeploymentStatus = 'pending' | 'building' | 'ready' | 'failed' | 'rolled_back'
export type Deployment = {
  id: ID
  projectId: ID
  organizationId: ID
  status: DeploymentStatus
  version: number
  url?: string
  createdAt: ISODate
  completedAt?: ISODate
}
