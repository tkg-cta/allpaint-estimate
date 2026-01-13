import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title: string;
 children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
 useEffect(() => {
  if (isOpen) {
   document.body.style.overflow = 'hidden';
  } else {
   document.body.style.overflow = 'unset';
  }
  return () => {
   document.body.style.overflow = 'unset';
  };
 }, [isOpen]);

 if (!isOpen) return null;

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
   {/* Backdrop */}
   <div
    className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
    onClick={onClose}
   />

   {/* Modal Content */}
   <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col animate-scale-in">
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
     <h3 className="text-lg font-bold text-gray-900">{title}</h3>
     <button
      onClick={onClose}
      className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
     >
      <X size={20} />
     </button>
    </div>

    {/* Body */}
    <div className="p-6">
     {children}
    </div>
   </div>
  </div>
 );
};
