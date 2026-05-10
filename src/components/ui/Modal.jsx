import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * FIX #7 — WCAG AA: Modal now implements a proper focus trap.
 * - Focus moves to modal when opened.
 * - Tab/Shift+Tab cycles only within the modal.
 * - Focus returns to the trigger element when closed.
 * - role="dialog", aria-modal, aria-labelledby set for screen readers.
 */
const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'textarea', 'input', 'select',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Modal({ open, onClose, title, children, width = 480 }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;

  // Save the element that was focused before the modal opened
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      // Move focus into modal on next tick
      requestAnimationFrame(() => {
        const first = modalRef.current?.querySelector(FOCUSABLE);
        first?.focus();
      });
    } else if (previousFocusRef.current) {
      // Restore focus when modal closes
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;

      const focusable = [...(modalRef.current?.querySelectorAll(FOCUSABLE) || [])];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const modalContent = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <div
            className="modal-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            ref={modalRef}
          >
            <motion.div
              className="modal"
              style={{ maxWidth: width }}
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{   opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <div className="modal-header">
                <h3 className="modal-title" id={titleId}>{title}</h3>
                <button
                  className="modal-close"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="modal-body">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
