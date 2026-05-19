import { useState, useEffect, useMemo } from 'react'
import { Database, Key, Link, Eye, Zap, RefreshCw, ChevronRight, Network } from 'lucide-react'
import { ReactFlow, Background, Controls, MiniMap, MarkerType } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import TableNode from '../components/TableNode'
import api from '../api/axios'
import PageHero from '../components/PageHero'
import { FadeUp } from '../components/Animate'

function getLayoutedElements(nodes, edges, direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 120 })

  nodes.forEach((node) => {
    const nodeHeight = 50 + (node.data.columns.length * 36)
    dagreGraph.setNode(node.id, { width: 320, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const nodeHeight = 50 + (node.data.columns.length * 36)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 320 / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: newNodes, edges }
}

// Abbreviate PostgreSQL type names for display
function fmtType(col) {
  const t = col.data_type
  if (t === 'character varying') return col.character_maximum_length ? `varchar(${col.character_maximum_length})` : 'varchar'
  if (t === 'character')         return col.character_maximum_length ? `char(${col.character_maximum_length})` : 'char'
  if (t === 'numeric')           return (col.numeric_precision && col.numeric_scale != null) ? `numeric(${col.numeric_precision},${col.numeric_scale})` : 'numeric'
  if (t === 'integer')           return 'int'
  if (t === 'bigint')            return 'bigint'
  if (t === 'boolean')           return 'bool'
  if (t === 'text')              return 'text'
  if (t === 'date')              return 'date'
  if (t === 'time without time zone')      return 'time'
  if (t === 'timestamp without time zone') return 'timestamp'
  if (t === 'ARRAY')             return 'array'
  return t
}

const TYPE_COLOR = {
  int: '#5a8def', bigint: '#5a8def', serial: '#5a8def',
  varchar: '#00C49F', char: '#00C49F', text: '#00C49F',
  date: '#f0a637', time: '#f0a637', timestamp: '#f0a637',
  numeric: '#e07ab5', bool: '#9b8ef0',
}
function typeColor(t) { return TYPE_COLOR[t] ?? 'var(--muted)' }

const TABS = ['Canvas', 'Tables', 'Relations', 'Views', 'Triggers']

const TAB_ICONS = {
  Canvas:    <Network size={13} />,
  Tables:    <Database size={13} />,
  Relations: <Link size={13} />,
  Views:     <Eye size={13} />,
  Triggers:  <Zap size={13} />,
}

export default function Schema() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('Canvas')
  const [active,  setActive]  = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/schema').then(r => {
      setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  // Build lookup maps and group tables
  const { pkSet = new Set(), fkMap = {}, uqSet = new Set(), rcMap = {}, tables = {}, tableNames = [], totalRows = 0 } = useMemo(() => {
    if (!data) return {}
    const p = new Set(data.primaryKeys.map(r => `${r.table_name}.${r.column_name}`))
    const f = {}
    data.foreignKeys.forEach(r => { f[`${r.from_table}.${r.from_column}`] = r })
    const u = new Set(data.uniqueKeys.map(r => `${r.table_name}.${r.column_name}`))
    const rc = {}
    data.rowCounts.forEach(r => { rc[r.table_name] = Number(r.row_count) })
    
    const t = {}
    data.columns.forEach(col => {
      if (!t[col.table_name]) t[col.table_name] = []
      t[col.table_name].push(col)
    })
    const tn = Object.keys(t).sort()
    const total = data.rowCounts.reduce((s, r) => s + Number(r.row_count), 0)
    
    return { pkSet: p, fkMap: f, uqSet: u, rcMap: rc, tables: t, tableNames: tn, totalRows: total }
  }, [data])

  const nodeTypes = useMemo(() => ({ table: TableNode }), [])
  
  const layoutedData = useMemo(() => {
    if (!data) return { nodes: [], edges: [] }
    let tempNodes = []
    let tempEdges = []
    
    tableNames.forEach((tbl) => {
      tempNodes.push({
        id: tbl,
        type: 'table',
        position: { x: 0, y: 0 },
        data: {
          tableName: tbl,
          columns: tables[tbl].map(c => ({...c, display_type: fmtType(c)})),
          pkSet,
          fkMap,
          uqSet,
        }
      })
    })

    data.foreignKeys.forEach((fk) => {
      tempEdges.push({
        id: `e-${fk.from_table}-${fk.from_column}-${fk.to_table}-${fk.to_column}`,
        source: fk.from_table,
        sourceHandle: fk.from_column,
        target: fk.to_table,
        targetHandle: fk.to_column,
        type: 'smoothstep',
      })
    })

    return getLayoutedElements(tempNodes, tempEdges)
  }, [data, tableNames, tables, pkSet, fkMap, uqSet])

  const nodes = layoutedData.nodes
  
  const edges = useMemo(() => {
    return layoutedData.edges.map(edge => {
      const isHovered = hoveredNode === edge.source || hoveredNode === edge.target
      const isDimmed = hoveredNode && !isHovered
      
      return {
        ...edge,
        animated: isHovered,
        style: {
          stroke: isHovered ? '#00C49F' : '#5a8def',
          strokeWidth: isHovered ? 3 : 2,
          opacity: isDimmed ? 0.15 : 0.8,
          transition: 'all 0.3s ease',
        },
        zIndex: isHovered ? 1000 : 0,
        interactionWidth: 20,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: isHovered ? '#00C49F' : '#5a8def',
        },
      }
    })
  }, [layoutedData, hoveredNode])

  const selectedTable = active || (tableNames.length > 0 ? tableNames[0] : null)

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  )
  if (!data) return null

  return (
    <div className="page">
      <PageHero
        eyebrow="System · DBMS Explorer"
        title="Database"
        accent="schema."
        sub={`${tableNames.length} tables · ${data.views.length} views · ${data.triggers.length} triggers · ${totalRows.toLocaleString()} total rows across all entities.`}
        meta={[
          { k: 'Tables',   v: tableNames.length },
          { k: 'Views',    v: data.views.length },
          { k: 'Triggers', v: data.triggers.length },
          { k: 'Total rows', v: totalRows.toLocaleString() },
        ]}
      />

      {/* Tabs */}
      <FadeUp delay={400}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div className="seg" style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 12, boxShadow: 'var(--sh-1)' }}>
            {TABS.map(t => (
              <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8,
                  background: tab === t ? 'var(--ink)' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--muted)',
                  fontWeight: tab === t ? 600 : 500,
                  transition: 'all 200ms ease'
                }}>
                {TAB_ICONS[t]}{t}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn ghost icon-only" onClick={load}><RefreshCw size={14} /></button>
          </div>
        </div>
      </FadeUp>

      {/* ─── CANVAS ────────────────────────────────────────────── */}
      {tab === 'Canvas' && (
        <FadeUp delay={500}>
          <div className="panel" style={{ height: '75vh', overflow: 'hidden', padding: 4, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeMouseEnter={(_, node) => setHoveredNode(node.id)}
                onNodeMouseLeave={() => setHoveredNode(null)}
                fitView
                minZoom={0.1}
                colorMode="dark"
              >
                <Background color="#5a8def" gap={20} size={1} />
                <Controls />
                <MiniMap 
                  nodeColor={(n) => '#2e2e38'} 
                  maskColor="rgba(0, 0, 0, 0.4)" 
                  style={{ backgroundColor: '#1a1a24' }} 
                />
              </ReactFlow>
            </div>
          </div>
        </FadeUp>
      )}

      {/* ─── TABLES ────────────────────────────────────────────── */}
      {tab === 'Tables' && (
        <FadeUp delay={500}>
          <div className="panel" style={{ display: 'flex', height: '75vh', overflow: 'hidden', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)' }}>
            {/* Sidebar */}
            <div style={{ width: 280, borderRight: '1px solid var(--line)', background: 'var(--surface-2)', overflowY: 'auto' }}>
              <div style={{ padding: '16px 20px', fontSize: 11, fontFamily: 'var(--f-mono)', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>
                Base Tables
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: 8, gap: 4 }}>
                {tableNames.map(tbl => {
                  const rows = rcMap[tbl] ?? 0
                  const isSelected = selectedTable === tbl
                  return (
                    <button key={tbl} onClick={() => setActive(tbl)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: 'none',
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--ink)',
                        cursor: 'pointer', transition: 'all 150ms ease', textAlign: 'left'
                      }}>
                      <Database size={15} color={isSelected ? 'rgba(255,255,255,0.8)' : 'var(--primary)'} />
                      <span style={{ fontWeight: isSelected ? 600 : 500, fontSize: 13, fontFamily: 'var(--f-mono)', flex: 1 }}>{tbl}</span>
                      <span style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--muted)', background: isSelected ? 'rgba(0,0,0,0.1)' : 'var(--line)', padding: '2px 6px', borderRadius: 6 }}>
                        {rows}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Main Content */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)' }}>
              {selectedTable && (() => {
                const tbl = selectedTable
                const cols = tables[tbl]
                const rows = rcMap[tbl] ?? 0
                return (
                  <div style={{ padding: '32px 40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-100)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
                        <Database size={22} />
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{tbl}</h2>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{rows.toLocaleString()} records • {cols.length} columns</div>
                      </div>
                    </div>
                    
                    <table className="tbl" style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', width: '100%' }}>
                      <thead style={{ background: 'var(--surface-2)' }}>
                        <tr>
                          <th style={{ width: 40 }}></th>
                          <th>Column Name</th>
                          <th>Data Type</th>
                          <th>Constraints</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cols.map(col => {
                          const key    = `${tbl}.${col.column_name}`
                          const isPk   = pkSet.has(key)
                          const fk     = fkMap[key]
                          const isUq   = uqSet.has(key) && !isPk
                          const notNull = col.is_nullable === 'NO' && !isPk
                          const type   = fmtType(col)
                          return (
                            <tr key={col.column_name} style={{ background: isPk ? 'rgba(240,166,55,0.03)' : fk ? 'rgba(90,141,239,0.03)' : 'transparent' }}>
                              <td style={{ textAlign: 'center' }}>
                                {isPk && <Key size={14} color="#f0a637" />}
                                {!isPk && fk && <Link size={14} color="#5a8def" />}
                              </td>
                              <td style={{ fontFamily: 'var(--f-mono)', fontWeight: isPk ? 600 : 500, color: isPk ? '#f0a637' : fk ? '#5a8def' : 'var(--ink)' }}>
                                {col.column_name}
                              </td>
                              <td style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: typeColor(type.split('(')[0]) }}>
                                {type}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {isPk  && <span style={chip('#f0a637')}>PRIMARY KEY</span>}
                                  {fk    && <span style={chip('#5a8def')} title={`→ ${fk.to_table}.${fk.to_column}`}>FK → {fk.to_table}.{fk.to_column}</span>}
                                  {isUq  && <span style={chip('#9b8ef0')}>UNIQUE</span>}
                                  {notNull && !fk && !isPk && <span style={chip('var(--muted)')}>NOT NULL</span>}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          </div>
        </FadeUp>
      )}

      {/* ─── RELATIONS ─────────────────────────────────────────── */}
      {tab === 'Relations' && (
        <FadeUp delay={500}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
            {data.foreignKeys.map((fk, i) => (
              <div key={i} className="panel" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
                
                {/* Source Table */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{fk.from_table}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', color: '#5a8def', marginTop: 4 }}>{fk.from_column}</div>
                </div>
                
                {/* Visual Connector */}
                <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--f-mono)', color: 'var(--muted)', marginBottom: 4 }}>REFERENCES</div>
                  <svg width="60" height="24" viewBox="0 0 60 24" style={{ overflow: 'visible' }}>
                    <path d="M0,12 L56,12" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                    <polygon points="60,12 52,8 52,16" fill="var(--muted)" />
                    <circle cx="0" cy="12" r="3" fill="#5a8def" />
                  </svg>
                  <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                    <span style={ruleBadge(fk.delete_rule)}>{fk.delete_rule}</span>
                  </div>
                </div>

                {/* Target Table */}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{fk.to_table}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', color: '#f0a637', marginTop: 4 }}>{fk.to_column}</div>
                </div>

              </div>
            ))}
          </div>
        </FadeUp>
      )}

      {/* ─── VIEWS ─────────────────────────────────────────────── */}
      {tab === 'Views' && (
        <FadeUp delay={500}>
          <div style={{ display: 'grid', gap: 20 }}>
            {data.views.map(v => (
              <div key={v.table_name} className="panel" style={{ overflow: 'hidden', background: '#0a0e14', border: '1px solid #1a2230', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #1a2230', background: '#11161e' }}>
                  <Eye size={15} color="#00C49F" />
                  <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 600, fontSize: 13, color: '#eef1f6' }}>{v.table_name}</span>
                  <span style={{ marginLeft: 'auto', ...chip('#00C49F') }}>VIEW</span>
                </div>
                <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: 12, fontFamily: 'var(--f-mono)', color: '#98a1b3', lineHeight: 1.6 }}>
                    {v.view_definition?.trim().split('\n').map((line, i) => (
                      <div key={i} style={{ display: 'flex', gap: 16 }}>
                        <span style={{ color: '#2a3441', userSelect: 'none', width: 24, textAlign: 'right' }}>{i + 1}</span>
                        <span style={{ color: '#eef1f6' }}>
                          {line}
                        </span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      )}

      {/* ─── TRIGGERS ──────────────────────────────────────────── */}
      {tab === 'Triggers' && (
        <FadeUp delay={500}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {data.triggers.map(t => (
              <div key={t.trigger_name} className="panel" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                {/* Glowing edge effect */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(90deg, var(--warn), var(--danger))' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', border: '1px solid var(--line)' }}>
                      <Zap size={16} color="var(--warn)" />
                    </div>
                    <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 600, fontSize: 14 }}>{t.trigger_name}</span>
                  </div>
                  <span style={chip('var(--warn)')}>{t.level}</span>
                </div>
                
                <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 16, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={chip(t.timing === 'BEFORE' ? 'var(--warn)' : 'var(--accent)')}>{t.timing}</span>
                    <span style={chip('var(--danger)')}>{t.event}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--f-mono)' }}>ON</span>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--f-mono)' }}>{t.table_name}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontFamily: 'var(--f-mono)', color: 'var(--ink)', padding: '10px 12px', background: 'var(--surface)', borderRadius: 6, border: '1px dashed var(--line)' }}>
                    <span style={{ color: 'var(--muted)' }}>EXECUTE</span>
                    <span style={{ color: '#00C49F' }}>{t.function_name}()</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      )}
    </div>
  )
}

function chip(color) {
  return {
    display: 'inline-flex', alignItems: 'center',
    fontSize: 9, fontFamily: 'var(--f-mono)', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    padding: '2px 5px', borderRadius: 4,
    background: color + '22',
    color: color,
    flexShrink: 0,
  }
}

function ruleBadge(rule) {
  const colors = {
    'CASCADE':   '#e0526b',
    'SET NULL':  '#f0a637',
    'RESTRICT':  '#5a8def',
    'NO ACTION': 'var(--muted)',
  }
  return { ...chip(colors[rule] ?? 'var(--muted)'), fontSize: 10 }
}
