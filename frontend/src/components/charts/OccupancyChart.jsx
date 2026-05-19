import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const TYPE_COLORS = {
  ICU: '#e0526b',
  General: '#5a8def',
  Private: '#0F4C81',
  'Semi-Private': '#f0a637',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--ink)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>{d.ward_name}</div>
      <div style={{ color: 'var(--accent)' }}>{d.occupancy_pct}% occupied</div>
      <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
        {d.occupied_beds} / {d.total_beds} beds
      </div>
    </div>
  )
}

export default function OccupancyChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="ward_name"
          tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--f-mono)' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={v => `${v}%`}
          tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'var(--f-mono)' }}
          axisLine={false} tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="occupancy_pct" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={TYPE_COLORS[entry.ward_type] ?? 'var(--primary)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
