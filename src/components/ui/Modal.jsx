import { Button } from './Button'

export function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-3 text-sm text-slate-600">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          {footer || (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
