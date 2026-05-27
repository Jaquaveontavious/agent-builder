import type { PanelOutput, PanelSize, PanelType } from './types'

// ─── Format instructions injected into the agent prompt ─────────────────────

export const FORMAT_INSTRUCTIONS: Record<PanelType, string> = {
  stat: `

IMPORTANT: Your entire response must be ONLY a valid JSON object — no explanation, no markdown, no code fences.
Format: {"value":"the key metric or answer","label":"what it measures","trend":"optional ↑ or ↓ percentage like ↑ 23%","context":"one supporting sentence"}`,

  list: `

IMPORTANT: Your entire response must be ONLY a valid JSON object — no explanation, no markdown, no code fences.
Format: {"items":["item one","item two","item three"],"title":"optional section title"}`,

  table: `

IMPORTANT: Your entire response must be ONLY a valid JSON object — no explanation, no markdown, no code fences.
Format: {"headers":["Column 1","Column 2","Column 3"],"rows":[["row1col1","row1col2","row1col3"],["row2col1","row2col2","row2col3"]]}`,

  text: '',
  query: '',
}

// ─── Parse raw agent output into typed PanelOutput ──────────────────────────

export function parseOutput(raw: string, type: PanelType): PanelOutput {
  if (type === 'text' || type === 'query') {
    return { type, content: raw.trim() }
  }

  const cleaned = raw.trim()

  // Strip code fences if present
  const stripped =
    cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  // Find first { ... } block
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  const jsonStr = start !== -1 && end !== -1 ? stripped.slice(start, end + 1) : stripped

  try {
    const data = JSON.parse(jsonStr) as Record<string, unknown>
    return { type, ...data } as PanelOutput
  } catch {
    return {
      type: 'error',
      message: `Could not parse ${type} output. Raw: ${raw.slice(0, 200)}`,
    }
  }
}

// ─── UI helpers ─────────────────────────────────────────────────────────────

export const SIZE_SPAN: Record<PanelSize, string> = {
  small:  'col-span-1',
  medium: 'col-span-2',
  large:  'col-span-4',
}

export const PANEL_LABELS: Record<PanelType, string> = {
  stat:  'Stat',
  list:  'List',
  table: 'Table',
  text:  'Text',
  query: 'Query',
}

export const PANEL_ICONS: Record<PanelType, string> = {
  stat:  '📊',
  list:  '📋',
  table: '📑',
  text:  '📝',
  query: '💬',
}

export const SIZE_LABELS: Record<PanelSize, string> = {
  small:  'Small (¼)',
  medium: 'Medium (½)',
  large:  'Large (full)',
}
