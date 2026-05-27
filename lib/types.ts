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

// ─── The Grid ───────────────────────────────────────────────────────────────

export interface GridMember {
  id: string
  name: string
  role: string
}

export interface Grid {
  id: string
  user_id: string
  name: string
  description: string | null
  member_agents: GridMember[]
  created_at: string
}

export interface AgentLog {
  agent_id: string
  agent_name: string
  task: string
  output: string
  tokens: number
  started_at: string
  completed_at: string
}

export interface GridRun {
  id: string
  grid_id: string
  user_id: string
  input: string
  output: string | null
  status: 'running' | 'complete' | 'failed'
  agent_logs: AgentLog[]
  tokens_used: number
  created_at: string
}

// ─── Workspaces ─────────────────────────────────────────────────────────────

export type PanelType = 'stat' | 'list' | 'table' | 'text' | 'query'
export type PanelSize = 'small' | 'medium' | 'large'

export interface Workspace {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Panel {
  id: string
  workspace_id: string
  user_id: string
  agent_id: string | null
  title: string
  panel_type: PanelType
  size: PanelSize
  position: number
  auto_prompt: string | null
  last_output: PanelOutput | null
  last_run_at: string | null
  created_at: string
}

export interface StatData   { value: string; label: string; trend?: string; context?: string }
export interface ListData   { items: string[]; title?: string }
export interface TableData  { headers: string[]; rows: string[][] }
export interface TextData   { content: string }

export type PanelOutput =
  | ({ type: 'stat'            } & StatData)
  | ({ type: 'list'            } & ListData)
  | ({ type: 'table'           } & TableData)
  | ({ type: 'text' | 'query'  } & TextData)
  | { type: 'error'; message: string }

export interface PanelConfig {
  title: string
  agent_id: string
  panel_type: PanelType
  size: PanelSize
  position: number
  auto_prompt?: string
}

export type GridSSEEvent =
  | { type: 'coordinator_text'; content: string }
  | { type: 'agent_start'; agent_id: string; agent_name: string; task: string }
  | { type: 'agent_text'; agent_id: string; content: string }
  | { type: 'agent_tool_call'; agent_id: string; tool: string }
  | { type: 'agent_complete'; agent_id: string; output: string; tokens: number }
  | { type: 'done'; tokens_used: number; run_id: string }
  | { type: 'error'; message: string }
