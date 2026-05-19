import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Key, Link } from 'lucide-react';

const TYPE_COLOR = {
  int: '#5a8def', bigint: '#5a8def', serial: '#5a8def',
  varchar: '#00C49F', char: '#00C49F', text: '#00C49F',
  date: '#f0a637', time: '#f0a637', timestamp: '#f0a637',
  numeric: '#e07ab5', bool: '#9b8ef0',
};

function typeColor(t) { return TYPE_COLOR[t] ?? 'var(--muted)'; }

function chip(color) {
  return {
    display: 'inline-flex', alignItems: 'center',
    fontSize: 9, fontFamily: 'var(--f-mono)', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    padding: '2px 5px', borderRadius: 4,
    background: color + '22',
    color: color,
    flexShrink: 0,
  };
}

export default function TableNode({ data, selected }) {
  const { tableName, columns, pkSet, fkMap, uqSet } = data;

  return (
    <>
      <style>{`
        .table-node-row {
          transition: background-color 0.15s ease;
        }
        .table-node-row:hover {
          background-color: rgba(255,255,255,0.04) !important;
        }
        .table-node-handle {
          width: 8px;
          height: 8px;
          background: #1a1d24;
          border: 1px solid #3a3f4e;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        .table-node-handle:hover {
          background: #5a8def;
          border-color: #5a8def;
          box-shadow: 0 0 8px rgba(90,141,239,0.6);
        }
      `}</style>
      <div style={{
        background: 'rgba(15, 18, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        border: selected ? '1px solid rgba(90, 141, 239, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        minWidth: 280,
        boxShadow: selected 
          ? '0 0 0 1px rgba(90, 141, 239, 0.3), 0 12px 24px -4px rgba(0, 0, 0, 0.5)'
          : '0 8px 24px -4px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Glow effect on top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #5a8def, #00C49F)', opacity: 0.8, borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />

        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(90,141,239,0.15)', color: '#5a8def', display: 'grid', placeItems: 'center' }}>
            <Database size={13} />
          </div>
          <strong style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: '#fff', letterSpacing: '0.02em' }}>
            {tableName}
          </strong>
        </div>

        {/* Columns */}
        <div style={{ padding: '6px 0', display: 'flex', flexDirection: 'column' }}>
          {columns.map((col, index) => {
            const key = `${tableName}.${col.column_name}`;
            const isPk = pkSet.has(key);
            const fk = fkMap[key];
            const isUq = uqSet.has(key) && !isPk;
            const notNull = col.is_nullable === 'NO' && !isPk;
            
            return (
              <div key={col.column_name} className="table-node-row" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 18px', fontSize: 11,
                background: isPk ? 'rgba(240,166,55,0.04)' : fk ? 'rgba(90,141,239,0.03)' : 'transparent',
                position: 'relative',
              }}>
                {/* Target Handle (Left) - for incoming relations */}
                <Handle 
                  type="target" 
                  position={Position.Left} 
                  id={col.column_name} 
                  className="table-node-handle"
                  style={{ left: -5 }}
                  isConnectable={false}
                />

                {/* Icon */}
                {isPk && <Key size={12} color="#f0a637" style={{ flexShrink: 0 }} />}
                {!isPk && fk && <Link size={12} color="#5a8def" style={{ flexShrink: 0 }} />}
                {!isPk && !fk && <span style={{ width: 12, flexShrink: 0 }} />}

                {/* Name */}
                <span style={{ 
                  fontFamily: 'var(--f-mono)', 
                  fontWeight: isPk ? 600 : 400,
                  color: isPk ? '#f0a637' : fk ? '#5a8def' : '#c4c8d4',
                }}>
                  {col.column_name}
                </span>

                {/* Type */}
                <span style={{ 
                  marginLeft: 'auto', 
                  fontFamily: 'var(--f-mono)', fontSize: 10,
                  color: typeColor(col.display_type.split('(')[0]),
                }}>
                  {col.display_type}
                </span>

                {/* Constraint Chips */}
                {isPk && <span style={chip('#f0a637')}>PK</span>}
                {fk && <span style={chip('#5a8def')}>FK</span>}
                {isUq && <span style={chip('#9b8ef0')}>UQ</span>}
                {notNull && !fk && !isPk && <span style={chip('#6b7280')}>NN</span>}

                {/* Source Handle (Right) - for outgoing relations */}
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id={col.column_name} 
                  className="table-node-handle"
                  style={{ right: -5 }}
                  isConnectable={false}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
