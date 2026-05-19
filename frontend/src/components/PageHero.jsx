import { KineticHeading, FadeUp } from './Animate'

export default function PageHero({ eyebrow, title, accent, sub, meta = [] }) {
  const titleWords = title.split(' ')
  // accent starts after all title words
  const accentDelay = 120 + 70 * titleWords.length

  return (
    <section className="page-hero">
      <div className="blob" />
      <div className="blob b2" />

      {eyebrow && (
        <FadeUp delay={50}>
          <div className="eyebrow">{eyebrow}</div>
        </FadeUp>
      )}

      <h1>
        <KineticHeading as="span" text={title} delay={120} stagger={70} />
        {accent && (
          <>
            {' '}
            <KineticHeading
              as="span"
              text={accent}
              className="accent"
              delay={accentDelay}
              stagger={70}
            />
          </>
        )}
      </h1>

      {sub && (
        <FadeUp delay={accentDelay + 200}>
          <div className="sub">{sub}</div>
        </FadeUp>
      )}

      {meta.length > 0 && (
        <FadeUp delay={accentDelay + 320}>
          <div className="meta-row">
            {meta.map((m, i) => (
              <div className="meta" key={i}>
                <div className="k">{m.k}</div>
                <div className="v">{m.v ?? '—'}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      )}
    </section>
  )
}
