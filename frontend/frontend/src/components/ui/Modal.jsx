import React from 'react';
import { XCircle } from 'lucide-react';
import { Button } from './Button';
import Transition from './Transition';
import { cn } from '../../utils/cn';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = 'max-w-lg',
}) {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Transition
      open={open}
      enterClassName="opacity-100"
      exitClassName="opacity-0"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Close modal"
      />

      <Transition
        open={open}
        enterClassName="opacity-100 translate-y-0 scale-100"
        exitClassName="opacity-0 translate-y-4 scale-95"
        className={cn(
          'relative w-full rounded-2xl border border-gray-200 bg-white shadow-xl',
          maxWidth,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              {title && <div className="text-lg font-semibold text-gray-900">{title}</div>}
              {description && <div className="text-sm text-gray-600">{description}</div>}
            </div>
            <Button variant="ghost" onClick={onClose} aria-label="Close modal">
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        )}
        {!title && !description && (
             <div className="absolute top-4 right-4 z-10">
                <Button variant="ghost" onClick={onClose} aria-label="Close modal">
                  <XCircle className="h-5 w-5" />
                </Button>
             </div>
        )}

        {children}
      </Transition>
    </Transition>
  );
}
