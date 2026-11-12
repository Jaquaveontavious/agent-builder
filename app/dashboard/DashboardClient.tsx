'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Building2, ImageIcon, BarChart3, MessageSquare,
  Cpu, ChevronLeft, ChevronRight, Zap, Plus, Send,
  Loader2, CheckCircle, Activity, Circle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SuiteConfig {
  id: string
  name: string
  description: string
  icon: 'building2' | 'image' | 'chart' | 'message'
  href: string
}

interface ComingSoonConfig {
  name: string
  icon: 'chart' | 'message'
  description: string
}

interface CustomOperative {
  id: string
  name: string
  suite_id: string
  config: { description?: string }
}

interface DeployedOperative {
  id?: string
  suite_id: string
  name: string
  config?: Record<string, unknown>
}

// ─── Node graph types ─────────────────────────────────────────────────────────

type NodeStatus = 'idle' | 'active' | 'running' | 'done' | 'error'

interface GraphNode {
  id: string
  label: string
  sublabel?: string
  status: NodeStatus
  x: number
  y: number
  type: 'suite' | 'agent' | 'source'
  href?: string
  color: string
}

interface GraphEdge {
  from: string
  to: string
  active: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_MAP = {
  building2: Building2,
  image: ImageIcon,
  chart: BarChart3,
  message: MessageSquare,
}

const SUITE_COLORS: Record<string, string> = {
  propiq: '#3b82f6',
  content: '#8b5cf6',
  custom: '#10b981',
}

const SUITE_AGENTS: Record<string, { label: string; sublabel: string }[]> = {
  propiq: [
    { label: 'Deal Finder', sublabel: 'Rentcast API' },
    { label: 'Comp Puller', sublabel: 'AVM + sold data' },
    { label: 'Skip Tracer', sublabel: 'Public records' },
    { label: 'Offer Writer', sublabel: 'Claude AI' },
    { label: 'Lead Nurture', sublabel: 'Sequence builder' },
  ],
  content: [
    { label: 'Caption Generator', sublabel: 'Claude Vision' },
    { label: 'Platform Optimizer', sublabel: 'Multi-platform' },
    { label: 'Media Library', sublabel: 'Supabase storage' },
  ],
}

// ─── Build graph from suites ──────────────────────────────────────────────────

function buildGraph(
  suites: SuiteConfig[],
  customOps: CustomOperative[],
  activeNode: string | null
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  const centerX = 500
  const centerY = 300

  // Central hub node
  nodes.push({
    id: 'hub',
    label: 'Iron Operative',
    sublabel: 'Command Hub',
    status: 'active',
    x: centerX,
    y: centerY,
    type: 'suite',
    color: '#3b82f6',
  })

  // Suite nodes arranged in a circle around hub
  const allSuites = [
    ...suites.map((s) => ({ id: s.id, label: s.name, href: s.href, color: SUITE_COLORS[s.id] ?? '#3b82f6' })),
    ...customOps.map((op) => ({ id: op.id, label: op.name, href: `/dashboard/operative/${op.id}`, color: SUITE_COLORS.custom })),
  ]

  const suiteRadius = 180
  allSuites.forEach((suite, i) => {
    const angle = (i / allSuites.length) * 2 * Math.PI - Math.PI / 2
    const x = centerX + suiteRadius * Math.cos(angle)
    const y = centerY + suiteRadius * Math.sin(angle)

    nodes.push({
      id: suite.id,
      label: suite.label,
      status: 'idle',
      x,
      y,
      type: 'suite',
      href: suite.href,
      color: suite.color,
    })

    edges.push({ from: 'hub', to: suite.id, active: activeNode === suite.id })

    // Agent sub-nodes for active suite
    if (activeNode === suite.id) {
      const agents = SUITE_AGENTS[suite.id] ?? []
      const agentRadius = 130
      agents.forEach((agent, j) => {
        const agentAngle = angle + (j - (agents.length - 1) / 2) * 0.45
        const ax = x + agentRadius * Math.cos(agentAngle)
        const ay = y + agentRadius * Math.sin(agentAngle)
        const agentId = `${suite.id}-agent-${j}`

        nodes.push({
          id: agentId,
          label: agent.label,
          sublabel: agent.sublabel,
          status: 'idle',
          x: ax,
          y: ay,
          type: 'agent',
          color: suite.color,
        })

        edges.push({ from: suite.id, to: agentId, active: true })
      })
    }
  })

  return { nodes, edges }
}

// ─── Node component ───────────────────────────────────────────────────────────

function NodeBadge({
  node,
  onClick,
  isSelected,
}: {
  node: GraphNode
  onClick: () => void
  isSelected: boolean
}) {
  const size = node.type === 'suite' && node.id === 'hub' ? 52 : node.type === 'agent' ? 36 : 44

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={onClick}
      style={{ cursor: node.id === 'hub' ? 'default' : 'pointer' }}
    >
      {/* Outer ring pulse for active/hub */}
      {(node.status === 'active' || node.id === 'hub') && (
        <circle
          r={size + 8}
          fill="none"
          stroke={node.color}
          strokeOpacity={0.2}
          strokeWidth={1}
          className="animate-ping"
          style={{ animationDuration: '3s' }}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <circle
          r={size + 5}
          fill="none"
          stroke={node.color}
          strokeWidth={1.5}
          strokeOpacity={0.7}
        />
      )}

      {/* Main circle */}
      <circle
        r={size}
        fill="#0e0e16"
        stroke={node.color}
        strokeWidth={isSelected ? 2 : 1}
        strokeOpacity={isSelected ? 1 : 0.5}
      />

      {/* Inner fill */}
      <circle r={size - 4} fill={node.color} fillOpacity={isSelected ? 0.2 : 0.08} />

      {/* Status dot */}
      {node.id !== 'hub' && (
        <circle
          cx={size - 4}
          cy={-(size - 4)}
          r={5}
          fill={
            node.status === 'running' ? '#f59e0b' :
            node.status === 'done' ? '#10b981' :
            node.status === 'error' ? '#ef4444' :
            node.status === 'active' ? '#10b981' :
            '#334155'
          }
        />
      )}

      {/* Label */}
      <text
        textAnchor="middle"
        dy={node.type === 'agent' ? 4 : 5}
        fontSize={node.id === 'hub' ? 10 : node.type === 'agent' ? 8 : 9}
        fontWeight={600}
        fill="white"
        fontFamily="Inter, system-ui, sans-serif"
        style={{ userSelect: 'none' }}
      >
        {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
      </text>

      {/* Sublabel */}
      {node.sublabel && node.type === 'agent' && (
        <text
          textAnchor="middle"
          dy={16}
          fontSize={7}
          fill={node.color}
          fillOpacity={0.7}
          fontFamily="Inter, system-ui, sans-serif"
          style={{ userSelect: 'none' }}
        >
          {node.sublabel}
        </text>
      )}
    </g>
  )
}

// ─── Deploy input ─────────────────────────────────────────────────────────────

function DeployInput({ onDeployed }: { onDeployed: (op: DeployedOperative & { id: string }) => void }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  async function deploy() {
    const text = input.trim()
    if (!text || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/agents/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
        }),
      })
      const data = await res.json() as {
        success: boolean
        data?: { deployed?: DeployedOperative[] }
      }
      if (data.success && data.data?.deployed?.length) {
        const op = data.data.deployed[0]
        if (op.id) {
          onDeployed(op as DeployedOperative & { id: string })
          setDone(op.name)
          setInput('')
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>{done} is live</span>
        <button onClick={() => setDone(null)} className="text-slate-600 hover:text-slate-400 text-xs ml-2">+ another</button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 w-full">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void deploy()}
        placeholder="Describe what you need — I'll build and deploy an operative for it…"
        disabled={loading}
        className="flex-1 bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-600/60 transition-colors"
      />
      <button
        onClick={() => void deploy()}
        disabled={!input.trim() || loading}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function DashboardClient({
  upgraded,
  isPro,
  suiteCatalog,
  comingSoon,
  initialCustomOperatives,
}: {
  upgraded?: string
  isPro: boolean
  suiteCatalog: SuiteConfig[]
  comingSoon: ComingSoonConfig[]
  initialCustomOperatives: CustomOperative[]
}) {
  const [panelOpen, setPanelOpen] = useState(true)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [customOperatives, setCustomOperatives] = useState<CustomOperative[]>(initialCustomOperatives)
  const [tick, setTick] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const [svgSize, setSvgSize] = useState({ w: 1000, h: 600 })

  // Animate the graph — subtle tick for pulse effects
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000)
    return () => clearInterval(id)
  }, [])

  // Measure SVG container
  useEffect(() => {
    function measure() {
      if (svgRef.current) {
        const rect = svgRef.current.parentElement?.getBoundingClientRect()
        if (rect) setSvgSize({ w: rect.width, h: rect.height })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [panelOpen])

  function handleDeployed(op: DeployedOperative & { id: string }) {
    const newOp: CustomOperative = {
      id: op.id,
      name: op.name,
      suite_id: op.suite_id,
      config: { description: op.config?.description as string | undefined },
    }
    setCustomOperatives((prev) => prev.some((o) => o.id === op.id) ? prev : [newOp, ...prev])
  }

  // Scale graph to fill SVG
  const scaleX = svgSize.w / 1000
  const scaleY = svgSize.h / 600

  const { nodes, edges } = buildGraph(suiteCatalog, customOperatives, activeNode)

  const selectedNode = nodes.find((n) => n.id === activeNode)
  const selectedSuite = suiteCatalog.find((s) => s.id === activeNode)

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">

      {/* ── Side panel ───────────────────────────────────────────────────── */}
      <aside
        className={`flex-shrink-0 bg-[#0c0c14] border-r border-slate-800/60 flex flex-col transition-all duration-300 overflow-hidden ${
          panelOpen ? 'w-64' : 'w-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 min-w-64">
          {/* Suites */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">Active Suites</p>
            <div className="space-y-1">
              {suiteCatalog.map((suite) => {
                const Icon = ICON_MAP[suite.icon]
                const color = SUITE_COLORS[suite.id] ?? '#3b82f6'
                const isActive = activeNode === suite.id
                return (
                  <button
                    key={suite.id}
                    onClick={() => setActiveNode(isActive ? null : suite.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: color + '22', border: `1px solid ${color}44` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{suite.name}</p>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom operatives */}
          {customOperatives.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">Custom Operatives</p>
              <div className="space-y-1">
                {customOperatives.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setActiveNode(activeNode === op.id ? null : op.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      activeNode === op.id
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center flex-shrink-0">
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-xs font-semibold truncate">{op.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coming soon */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">Coming Soon</p>
            <div className="space-y-1">
              {comingSoon.map((s) => {
                const Icon = ICON_MAP[s.icon]
                return (
                  <div key={s.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-40">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600 truncate">{s.name}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Deploy new at bottom of panel */}
        <div className="px-4 py-4 border-t border-slate-800/60">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Deploy New</p>
          <DeployInput onDeployed={handleDeployed} />
        </div>
      </aside>

      {/* ── Toggle panel button ──────────────────────────────────────────── */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-r-lg px-1 py-3 transition-all"
        style={{ left: panelOpen ? 256 : 0 }}
      >
        {panelOpen
          ? <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        }
      </button>

      {/* ── Main canvas ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Upgraded banner */}
        {upgraded && (
          <div className="bg-blue-950/60 border-b border-blue-700/50 px-6 py-3 flex items-center gap-3 flex-shrink-0">
            <Zap className="w-4 h-4 text-blue-400" />
            <p className="text-blue-200 text-sm font-medium">You're now on Pro — all operatives fully unlocked.</p>
          </div>
        )}

        {/* Status bar */}
        <div className="flex-shrink-0 border-b border-slate-800/40 px-6 py-2 flex items-center gap-6 bg-[#0a0a0f]/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-slate-500">Neural Grid</span>
          </div>
          <div className="flex items-center gap-4">
            {suiteCatalog.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-500">{s.name}</span>
                <span className="text-[10px] text-emerald-600 font-medium">ACTIVE</span>
              </div>
            ))}
            {customOperatives.map((op) => (
              <div key={op.id} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-500">{op.name}</span>
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-slate-700 text-xs">
            <Circle className="w-2 h-2 fill-current" />
            <span>LIVE</span>
          </div>
        </div>

        {/* SVG node graph canvas */}
        <div className="flex-1 relative overflow-hidden">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, #0d1117 0%, #0a0a0f 100%)' }}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" opacity="0.4" />

            {/* Edges */}
            <g transform={`scale(${scaleX}, ${scaleY})`}>
              {edges.map((edge) => {
                const from = nodes.find((n) => n.id === edge.from)
                const to = nodes.find((n) => n.id === edge.to)
                if (!from || !to) return null
                return (
                  <line
                    key={`${edge.from}-${edge.to}`}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke={edge.active ? to.color : '#1e293b'}
                    strokeWidth={edge.active ? 1.5 : 1}
                    strokeOpacity={edge.active ? 0.6 : 0.3}
                    strokeDasharray={edge.active ? 'none' : '4 4'}
                  />
                )
              })}
            </g>

            {/* Nodes */}
            <g transform={`scale(${scaleX}, ${scaleY})`}>
              {nodes.map((node) => (
                <NodeBadge
                  key={node.id}
                  node={node}
                  isSelected={activeNode === node.id}
                  onClick={() => {
                    if (node.id === 'hub') return
                    setActiveNode(activeNode === node.id ? null : node.id)
                  }}
                />
              ))}
            </g>
          </svg>

          {/* Instruction overlay when nothing selected */}
          {!activeNode && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <p className="text-slate-700 text-xs">Click a node to expand its agents · Click again to collapse</p>
            </div>
          )}

          {/* Selected suite action panel */}
          {activeNode && selectedSuite && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0e0e16]/95 backdrop-blur border border-slate-700/60 rounded-2xl px-6 py-4 flex items-center gap-5 shadow-xl">
              <div>
                <p className="text-sm font-bold text-white mb-0.5">{selectedSuite.name}</p>
                <p className="text-xs text-slate-500">{(SUITE_AGENTS[selectedSuite.id] ?? []).length} agents active</p>
              </div>
              <Link
                href={selectedSuite.href}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Open Suite
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Selected custom operative panel */}
          {activeNode && !selectedSuite && customOperatives.find((o) => o.id === activeNode) && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0e0e16]/95 backdrop-blur border border-slate-700/60 rounded-2xl px-6 py-4 flex items-center gap-5 shadow-xl">
              <div>
                <p className="text-sm font-bold text-white mb-0.5">{customOperatives.find((o) => o.id === activeNode)?.name}</p>
                <p className="text-xs text-slate-500">Custom operative</p>
              </div>
              <Link
                href={`/dashboard/operative/${activeNode}`}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Open
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Bottom deploy bar */}
        <div className="flex-shrink-0 border-t border-slate-800/40 bg-[#0a0a0f]/90 backdrop-blur px-6 py-3">
          <div className="max-w-2xl mx-auto">
            <DeployInput onDeployed={handleDeployed} />
          </div>
        </div>
      </div>
    </div>
  )
}
