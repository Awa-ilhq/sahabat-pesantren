import { cn } from '../lib/cn'
import Mascot from './Mascot'

function Brand({ className, tone = 'dark', showText = true }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Mascot className="size-12 shrink-0" tone={tone} label="" />
      {showText ? (
        <span
          className={cn(
            'text-base font-extrabold leading-tight tracking-tight sm:text-lg',
            tone === 'light' ? 'text-white' : 'text-navy',
          )}
        >
          Sahabat Pesantren
        </span>
      ) : null}
    </span>
  )
}

export default Brand