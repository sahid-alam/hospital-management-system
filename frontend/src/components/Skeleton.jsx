export function Skel({ w = '60%', h = 12, style = {}, circle = false }) {
  return (
    <span
      className="skel"
      style={{
        width: w,
        height: h,
        borderRadius: circle ? '999px' : undefined,
        display: 'inline-block',
        ...style,
      }}
    />
  )
}

export function SkeletonRow({ cols = 5 }) {
  const widths = ['140px', '80px', '60px', '100px', '70px', '90px', '50px', '60px']
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '13px 14px' }}>
          <Skel w={widths[i % widths.length]} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div className="panel" style={{ padding: 22 }}>
      <Skel w="70px" h={10} style={{ marginBottom: 14, display: 'block' }} />
      <Skel w="50%" h={28} style={{ marginBottom: 12, display: 'block' }} />
      <Skel w="80%" h={10} style={{ display: 'block' }} />
    </div>
  )
}
