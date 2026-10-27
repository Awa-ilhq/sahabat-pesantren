import { cn } from '../lib/cn'

export default function Mascot({
  className,
  tone = 'dark',
  label = 'Maskot Sahabat Pesantren',
}) {
  const light = tone === 'light'
  const body = light ? '#ffffff' : 'var(--color-primary)'
  const eye = light ? 'var(--color-primary)' : '#ffffff'
  const pupil = light ? '#ffffff' : 'var(--color-primary)'

  return (
    <svg
      role={label ? 'img' : 'presentation'}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
      viewBox="0 0 200 200"
      className={cn('mascot overflow-visible', className ?? 'size-40')}
    >
      <g className="mascot-float">
        <path
          d="M100 160 C154 160 182 130 182 92 C182 52 150 26 100 26 C50 26 18 52 18 92 C18 130 46 160 100 160 Z"
          fill={body}
        />
        <path d="M56 150 L40 190 L96 160 Z" fill={body} />

        <g className="mascot-eye">
          <ellipse cx="74" cy="86" rx="11" ry="14" fill={eye} />
          <circle className="mascot-pupil" cx="76" cy="89" r="5.5" fill={pupil} />
        </g>
        <g className="mascot-eye">
          <ellipse cx="126" cy="86" rx="11" ry="14" fill={eye} />
          <circle className="mascot-pupil" cx="128" cy="89" r="5.5" fill={pupil} />
        </g>

        <circle className="mascot-cheek" cx="54" cy="112" r="10" fill="var(--color-salmon)" />
        <circle className="mascot-cheek" cx="146" cy="112" r="10" fill="var(--color-salmon)" />
        <path
          className="mascot-smile"
          d="M84 112 Q100 132 116 112"
          fill="none"
          stroke="var(--color-amber)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          className="mascot-heart"
          d="M162 38 C146 28 148 12 158 12 C161 12 162 14 162 17 C162 14 164 12 167 12 C177 12 178 28 162 38 Z"
          fill="var(--color-salmon)"
        />
      </g>
    </svg>
  )
}