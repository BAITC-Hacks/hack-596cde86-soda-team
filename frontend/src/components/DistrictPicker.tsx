import { useEffect, useRef, useState } from 'react'
import type { Choice, CityData, Measure } from '../types'
import { dirVars } from '../lib/directions'
import { allowedDistricts } from '../lib/rules'
import { CloseIcon } from './Icons'

interface Props {
  measure: Measure
  data: CityData
  selection: Choice[]
  onChoose: (districtId: string) => void
  onClose: () => void
}

export function DistrictPicker({ measure, data, selection, onChoose, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closing = useRef(false)
  const [visible, setVisible] = useState(false)
  const allowed = new Set(allowedDistricts(measure, selection, data))

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('.district-option:not(:disabled)')?.focus({ preventScroll: true })
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => {
      cancelAnimationFrame(frame)
      if (closeTimer.current) clearTimeout(closeTimer.current)
      if (dialog.open) dialog.close()
    }
  }, [])

  const dismiss = (action: () => void) => {
    if (closing.current) return
    closing.current = true
    setVisible(false)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) action()
    else closeTimer.current = setTimeout(action, 180)
  }

  return <dialog ref={dialogRef} className={`district-dialog${visible ? ' is-visible' : ''}${closing.current ? ' is-closing' : ''}`}
    aria-labelledby="district-dialog-title" aria-describedby="district-dialog-description"
    onCancel={(event) => { event.preventDefault(); dismiss(onClose) }}>
    <div className="district-dialog-content" style={dirVars(measure.direction)}>
      <div className="district-dialog-head">
        <h2 id="district-dialog-title">Выберите район</h2>
        <button type="button" className="icon-btn district-dialog-close" aria-label="Закрыть выбор района" onClick={() => dismiss(onClose)}><CloseIcon size={16} /></button>
      </div>
      <p id="district-dialog-description">{measure.name} · {measure.cost} ед. Район можно изменить позже в наборе.</p>
      <div className="district-options" role="group" aria-label="Доступные районы">
        {data.districts.map((district) => {
          const available = allowed.has(district.id)
          return <button key={district.id} type="button" className="district-option" disabled={!available}
            onClick={() => dismiss(() => onChoose(district.id))}>
            <span>{district.name}</span><small>{available ? 'Выбрать' : 'Конфликт мер'}</small>
          </button>
        })}
      </div>
      <button type="button" className="text-button district-dialog-cancel" onClick={() => dismiss(onClose)}>Отмена</button>
    </div>
  </dialog>
}
