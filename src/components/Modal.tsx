import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div ref={modalRef} className={`modal-content ${maxWidth}`}>
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-earth-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-earth-200 transition-colors"
          >
            <X className="w-5 h-5 text-earth-600" />
          </button>
        </div>
        <div className="card-body overflow-y-auto max-h-[calc(90vh-120px)] scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}
