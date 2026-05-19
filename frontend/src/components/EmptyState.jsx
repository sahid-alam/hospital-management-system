import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, body, ctaLabel, onCta }) {
  return (
    <div className="empty">
      <div className="illu">
        <Icon size={26} />
      </div>
      <h4>{title}</h4>
      <p>{body}</p>
      {ctaLabel && (
        <div className="empty-cta">
          <button className="btn primary sm" onClick={onCta}>{ctaLabel}</button>
        </div>
      )}
    </div>
  )
}
