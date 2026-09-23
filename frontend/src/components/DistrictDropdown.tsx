import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import type { District } from '../types'
import { ArrowIcon } from './Icons'

interface Props {
  measureId: string
  districtId: string | null
  districts: District[]
  allowedIds: Set<string>
  onChange: (districtId: string) => void
}

export function DistrictDropdown({ measureId, districtId, districts, allowedIds, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [openAbove, setOpenAbove] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedName = districts.find((district) => district.id === districtId)?.name

  useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return
    const trigger = triggerRef.current.getBoundingClientRect()
    const roomBelow = window.innerHeight - trigger.bottom
    const shouldOpenAbove = roomBelow < menuRef.current.offsetHeight + 8 && trigger.top > roomBelow
    if (shouldOpenAbove !== openAbove) {
      setOpenAbove(shouldOpenAbove)
      return
    }
    const selected = menuRef.current.querySelector<HTMLButtonElement>('.district-menu-option[aria-selected="true"]:not(:disabled)')
    const first = menuRef.current.querySelector<HTMLButtonElement>('.district-menu-option:not(:disabled)')
    ;(selected ?? first)?.focus({ preventScroll: true })
  }, [open, openAbove])

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      close(true)
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    if (!open) {
      setOpen(true)
      return
    }
    const options = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('.district-menu-option:not(:disabled)') ?? [])
    if (!options.length) return
    const index = options.indexOf(document.activeElement as HTMLButtonElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
      : event.key === 'ArrowDown' ? (index + 1) % options.length : (index - 1 + options.length) % options.length
    options[next].focus()
  }

  const onBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false)
  }

  return <span ref={rootRef} className={`district-select${open ? ' is-open' : ''}${selectedName ? '' : ' is-empty'}`}
    onKeyDown={onKeyDown} onBlur={onBlur}>
    <button ref={triggerRef} type="button" className="district-select-trigger"
      aria-label={`Район для ${measureId}: ${selectedName ?? 'не выбран'}`}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={`district-menu-${measureId}`}
      onClick={() => setOpen((value) => !value)}>
      <span>{selectedName ?? 'Выберите район'}</span><ArrowIcon up={open} />
    </button>
    <div ref={menuRef} id={`district-menu-${measureId}`} className={`district-menu${openAbove ? ' is-up' : ''}`}
      role="listbox" aria-label={`Район для ${measureId}`} aria-hidden={!open} inert={!open}>
      {districts.map((district) => {
        const available = allowedIds.has(district.id)
        const selected = district.id === districtId
        return <button key={district.id} type="button" role="option" className={`district-menu-option${selected ? ' is-selected' : ''}`}
          aria-selected={selected} disabled={!available} onClick={() => { onChange(district.id); close(true) }}>
          <span>{district.name}</span>
          <small>{available ? selected ? 'Текущий' : '' : 'Конфликт мер'}</small>
        </button>
      })}
    </div>
  </span>
}
