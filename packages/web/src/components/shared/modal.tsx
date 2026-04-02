import type { ReactNode, RefObject } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  modalRef: RefObject<HTMLDivElement | null>
}

export function Modal({ isOpen, onClose, title, children, modalRef }: ModalProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300',
          isOpen
            ? 'opacity-100'
            : 'pointer-events-none opacity-0 scale-95',
        )}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border bg-card shadow-xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
            <h2 className="text-base font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              閉じる
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-4">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
