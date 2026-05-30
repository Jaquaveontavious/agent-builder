import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import type { ToolName } from './types'

export const TOOL_DEFINITIONS: Record<ToolName, Tool> = {
  web_search: {
    name: 'web_search',
    description: 'Search the web for current information on any topic.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
  },
  code_execution: {
    name: 'code_execution',
    description: 'Execute JavaScript code and return the result or console output.',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript code to execute' },
      },
      required: ['code'],
    },
  },
  file_read: {
    name: 'file_read',
    description: 'Read a text file from storage by path.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path (e.g. "data/report.txt")' },
      },
      required: ['path'],
    },
  },
  file_write: {
    name: 'file_write',
    description: 'Write text content to a file in storage.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path (e.g. "output/result.txt")' },
        content: { type: 'string', description: 'Text content to write' },
      },
      required: ['path', 'content'],
    },
  },
  http_request: {
    name: 'http_request',
    description: 'Make an HTTP request to an external API and return the response.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full URL to request' },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          description: 'HTTP method',
        },
        headers: {
          type: 'object',
          description: 'Optional request headers as key-value pairs',
        },
        body: { type: 'string', description: 'Optional request body (for POST/PUT/PATCH)' },
      },
      required: ['url', 'method'],
    },
  },
}

export function getToolDefinitions(toolNames: ToolName[]): Tool[] {
  return toolNames.map((name) => TOOL_DEFINITIONS[name]).filter(Boolean)
}

interface ToolInput {
  query?: string
  code?: string
  path?: string
  content?: string
  url?: string
  method?: string
  headers?: Record<string, string>
  body?: string
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  const i = input as ToolInput

  switch (name) {
    case 'web_search':
      return runWebSearch(i.query ?? '')

    case 'code_execution':
      return runCodeExecution(i.code ?? '')

    case 'file_read':
      return `[file_read] File storage not configured in this environment. Path: ${i.path}`

    case 'file_write':
      return `[file_write] File storage not configured in this environment. Would write ${(i.content ?? '').length} chars to: ${i.path}`

    case 'http_request':
      return runHttpRequest(
        i.url ?? '',
        i.method ?? 'GET',
        i.headers,
        i.body
      )

    default:
      return `Unknown tool: ${name}`
  }
}

async function runWebSearch(query: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(query)
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`,
      { headers: { 'User-Agent': 'AgentForge/1.0' } }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as {
      AbstractText?: string
      AbstractURL?: string
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>
    }

    const parts: string[] = []
    if (data.AbstractText) parts.push(`Summary: ${data.AbstractText}`)
    if (data.AbstractURL) parts.push(`Source: ${data.AbstractURL}`)

    const topics = (data.RelatedTopics ?? []).slice(0, 5)
    if (topics.length > 0) {
      parts.push('\nRelated:')
      topics.forEach((t) => {
        if (t.Text) parts.push(`- ${t.Text}`)
      })
    }

    return parts.length > 0
      ? parts.join('\n')
      : `No results found for: ${query}`
  } catch (err) {
    return `Search failed: ${err instanceof Error ? err.message : String(err)}`
  }
}

async function runCodeExecution(code: string): Promise<string> {
  const logs: string[] = []
  const results: unknown[] = []

  try {
    const fn = new Function(
      'console',
      `
      "use strict";
      ${code}
      `
    )

    const mockConsole = {
      log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
      error: (...args: unknown[]) => logs.push('[error] ' + args.map(String).join(' ')),
      warn: (...args: unknown[]) => logs.push('[warn] ' + args.map(String).join(' ')),
    }

    const result = fn(mockConsole)
    if (result !== undefined) results.push(result)

    const output: string[] = []
    if (logs.length > 0) output.push(logs.join('\n'))
    if (results.length > 0) output.push(`Return value: ${JSON.stringify(results[0])}`)
    return output.join('\n') || 'Code executed successfully (no output)'
  } catch (err) {
    return `Execution error: ${err instanceof Error ? err.message : String(err)}`
  }
}

async function runHttpRequest(
  url: string,
  method: string,
  headers?: Record<string, string>,
  body?: string
): Promise<string> {
  try {
    const parsed = new URL(url)
    const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254']
    if (blocked.includes(parsed.hostname)) {
      return 'Error: Requests to local/internal addresses are not allowed.'
    }

    // Auto-inject API keys — agent never needs to handle auth
    const isRapidApi = parsed.hostname.endsWith('rapidapi.com')
    const isRentcast = parsed.hostname === 'api.rentcast.io'

    const injectedHeaders: Record<string, string> = isRapidApi
      ? { 'x-rapidapi-key': process.env.RAPIDAPI_KEY ?? '', 'x-rapidapi-host': parsed.hostname }
      : isRentcast
      ? { 'X-Api-Key': process.env.RENTCAST_API_KEY ?? '' }
      : {}

    // Strip any auth headers the agent may have hallucinated
    const safeHeaders = { ...(headers ?? {}) }
    if (isRapidApi || isRentcast) {
      delete safeHeaders['Authorization']
      delete safeHeaders['authorization']
      delete safeHeaders['X-Api-Key']
      delete safeHeaders['x-api-key']
      delete safeHeaders['x-rapidapi-key']
    }

    const res = await fetch(url, {
      method,
      headers: { 'User-Agent': 'PropIQ/1.0', 'Accept': 'application/json', ...safeHeaders, ...injectedHeaders },
      body: body ?? undefined,
    })

    const text = await res.text()
    const truncated = text.length > 8000 ? text.slice(0, 8000) + '\n[truncated]' : text
    return `HTTP ${res.status} ${res.statusText}\n\n${truncated}`
  } catch (err) {
    return `Request failed: ${err instanceof Error ? err.message : String(err)}`
  }
}
