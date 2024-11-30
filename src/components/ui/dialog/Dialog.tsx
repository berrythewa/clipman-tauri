import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Dialog({ open, onClose, children }: DialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      return () => {
        window.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      }
    }
  }, [open, onClose])

  const dialogContent = (
    <AnimatePresence>
      {open && (
        <div 
          className="fixed inset-0"
          onClick={() => onClose()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            isolation: 'isolate',
          }}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.15,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="w-full max-w-2xl relative bg-white rounded-lg shadow-xl"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  const dialogRoot = document.getElementById('dialog-root')
  if (!dialogRoot) return null

  return createPortal(dialogContent, dialogRoot)
}

export function DialogHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between p-6 border-b ${className}`}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-lg font-semibold pr-8 ${className}`}>
      {children}
    </h2>
  )
}

export function DialogContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

export function DialogFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-end gap-3 p-6 bg-gray-50 border-t ${className}`}>
      {children}
    </div>
  )
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button 
      onClick={onClose} 
      className="absolute right-5 top-5 p-2 rounded-full hover:bg-gray-100 transition-colors"
      aria-label="Close dialog"
    >
      <X size={20} />
    </button>
  )
}