import React from 'react';
import { X } from 'lucide-react';

interface SuperAdminModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidth?: string; // e.g. 'max-w-md', 'max-w-2xl'
  children: React.ReactNode;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({ title, subtitle, onClose, maxWidth = 'max-w-md', children }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className={`bg-slate-900 border border-slate-700 rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-slideUp`}>
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);
