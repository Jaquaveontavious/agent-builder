import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MODEL = 'claude-sonnet-4-6'

export const AGENT_FACTORY_META_PROMPT = `You are an AI agent configuration generator. Given a user's description of what they want an agent to do, output a JSON agent configuration.

RULES:
- Return ONLY a valid JSON object — no markdown, no explanation, no code fences
- Choose only tools the agent genuinely needs (fewer is better)
- The system_prompt should be detailed and role-specific (200-400 words)
- suggested_use_cases: 3 concrete examples

AVAILABLE TOOLS (use only from this list):
- web_search: Search the web for current information
- code_execution: Run JavaScript code and return output
- file_read: Read files from the user's storage
- file_write: Write files to the user's storage
- http_request: Make HTTP requests to external APIs

JSON SCHEMA:
{
  "name": "Short agent name (3-6 words)",
  "system_prompt": "Full system prompt telling the agent its role and how to behave",
  "tools": ["tool_name"],
  "suggested_use_cases": ["example 1", "example 2", "example 3"]
}
`
