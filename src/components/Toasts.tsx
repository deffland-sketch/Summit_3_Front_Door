import { useUi } from '@/store/ui'

export function Toasts() {
  const toasts = useUi((s) => s.toasts)
  const dismiss = useUi((s) => s.dismissToast)
  return (
    <div aria-live="polite" className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <button key={t.id} type="button" onClick={() => dismiss(t.id)} className="rounded-lg bg-brown px-4 py-2 text-sm text-white shadow">
          {t.text}
        </button>
      ))}
    </div>
  )
}
