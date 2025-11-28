import React from 'react';

interface MemoryBlockProps {
  address: number;
  data?: string;
  isActive?: boolean;
  isFault?: boolean;
  label?: string;
  height?: string;
  colorClass?: string;
}

export const MemoryBlock: React.FC<MemoryBlockProps> = ({ 
  address, 
  data, 
  isActive, 
  isFault,
  label,
  height = 'h-8',
  colorClass = 'bg-slate-200'
}) => {
  return (
    <div className={`flex items-center text-xs font-mono mb-1 transition-all duration-300 ${isActive ? 'scale-105' : ''}`}>
      <div className="w-16 text-slate-500 text-right pr-2">
        0x{address.toString(16).toUpperCase().padStart(4, '0')}
      </div>
      <div 
        className={`flex-1 border border-slate-300 rounded px-2 flex items-center justify-between ${height} 
        ${isFault ? 'bg-red-100 border-red-500' : isActive ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-200' : colorClass}`}
      >
        <span className="font-semibold text-slate-700 truncate">{data || '-'}</span>
        {label && <span className="text-[10px] text-slate-500 bg-white/50 px-1 rounded">{label}</span>}
      </div>
    </div>
  );
};