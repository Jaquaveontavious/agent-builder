export type ToolName =
  | 'web_search'
  | 'code_execution'
  | 'file_read'
  | 'file_write'
  | 'http_request'

export interface Agent {
  id: string
  user_id: string
  name: string
  description: string
  system_prompt: string
  tools: ToolName[]
  status: 'active' | 'paused'
  suggested_use_cases: string[]
  created_at: string
}

export interface Run {
  id: string
  agent_id: string
  user_id: string
  input: string
  output: string | null
  status: 'pending' | 'running' | 'complete' | 'failed'
  tokens_used: number
  created_at: string
}

export interface UserSubscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: 'free' | 'pro'
  runs_this_month: number
  month_reset_at: string
  created_at: string
  updated_at: string
}

export interface AgentConfig {
  name: string
  system_prompt: string
  tools: ToolName[]
  suggested_use_cases: string[]
}

export type SSEEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; name: string; content: string }
  | { type: 'done'; tokens_used: number; run_id: string }
  | { type: 'error'; message: string }
