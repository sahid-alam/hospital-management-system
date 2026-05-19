import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--ink)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#fff', fontWeight: 600 }}>₹{Number(d.total_collected ?? 0).toLocaleString()}</div>
      <div style={{ color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
        Billed: ₹{Number(d.total_billed ?? 0).toLocaleString()}
      </div>
    </div>
  )
}

export default function RevenueChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00C49F" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--f-mono)' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
          tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'var(--f-mono)' }}
          axisLine={false} tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--line)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="total_collected"
          stroke="#00C49F"
          strokeWidth={2}
          fill="url(#revGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#00C49F', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
