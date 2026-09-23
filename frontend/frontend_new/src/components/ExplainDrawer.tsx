import { useEffect, useRef, useState } from 'react';
import { api, isAbort } from '../api/client';
import type { Choice, ExplainResult } from '../api/types';

interface Props {
  selection: Choice[];
  onClose: () => void;
}

export function ExplainDrawer({ selection, onClose }: Props) {
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const ctrl = new AbortController();
    api
      .explain(selection, ctrl.signal)
      .then(setResult)
      .catch((e: unknown) => {
        if (!isAbort(e)) setError('Не удалось получить объяснение');
      });
    return () => ctrl.abort();
  }, [selection]);

  return (
    <div className="drawer-backdrop" onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="explain-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-head">
          <h2 id="explain-title">Разбор ИИ-агента</h2>
          {result && <span className="aside muted">{result.source === 'llm' ? 'LLM · числа из движка' : 'шаблон без LLM'}</span>}
          <button ref={closeRef} type="button" className="icon-btn" aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </div>
        {!result && !error && <p className="muted">Агент анализирует набор…</p>}
        {error && <div className="notice is-err">{error}</div>}
        {result && <div className="drawer-text">{result.text}</div>}
      </aside>
    </div>
  );
}
