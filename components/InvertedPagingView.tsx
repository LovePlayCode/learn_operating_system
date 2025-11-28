
import React, { useState, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Search, Fingerprint, ArrowRight, Table, Hash, Shuffle, CheckCircle, Ban } from 'lucide-react';

const FRAME_COUNT = 16;

interface InvertedEntry {
  frameIdx: number;
  pid: number;
  vpn: number;
  next: number | null; // For collision chaining
  isEmpty: boolean;
}

export const InvertedPagingView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [pidInput, setPidInput] = useState<number>(101);
  const [addrInput, setAddrInput] = useState<string>("3A05");

  // Generate a stable random table based on nothing (just random on mount)
  const invertedTable = useMemo(() => {
    const table: InvertedEntry[] = [];
    // Initialize empty
    for(let i=0; i<FRAME_COUNT; i++) {
      table.push({ frameIdx: i, pid: -1, vpn: -1, next: null, isEmpty: true });
    }
    
    // Fill some slots to simulate existing state
    const populate = (pid: number, vpn: number) => {
      const hash = (pid + vpn) % FRAME_COUNT;
      let curr = hash;
      // Simple collision handling: find next empty slot (simulating chaining by placing in array for viz purposes, 
      // but logically we just want to show the 'next' pointer concept)
      
      if (table[curr].isEmpty) {
        table[curr] = { frameIdx: curr, pid, vpn, next: null, isEmpty: false };
      } else {
        // Collision!
        // Find a free slot
        let free = -1;
        for(let i=0; i<FRAME_COUNT; i++) {
           const probe = (hash + i) % FRAME_COUNT;
           if(table[probe].isEmpty) { free = probe; break; }
        }
        
        if (free !== -1) {
          // Walk the chain from hash to find the end
          let walker = hash;
          let safeGuard = 0;
          while(table[walker].next !== null && safeGuard < 20) {
            walker = table[walker].next!;
            safeGuard++;
          }
          table[walker].next = free;
          table[free] = { frameIdx: free, pid, vpn, next: null, isEmpty: false };
        }
      }
    };

    // Pre-populate some specific entries for demo
    populate(101, 0x3); // The default example
    populate(102, 0x5);
    populate(101, 0xA); 
    populate(205, 0x3); // Collision with 101+3 if simple sum
    
    return table;
  }, []);

  // Logic
  const parsedAddr = parseInt(addrInput, 16);
  const isValidHex = !isNaN(parsedAddr);
  const vpn = isValidHex ? (parsedAddr >> 12) & 0xF : 0;
  const offset = isValidHex ? parsedAddr & 0xFFF : 0;
  
  // Simple Hash Function for demo
  const hashIdx = (pidInput + vpn) % FRAME_COUNT;

  // Search Logic (Chain Traversal)
  const searchPath: number[] = [];
  let foundFrame = -1;
  
  if (isValidHex) {
    let curr: number | null = hashIdx;
    let safeGuard = 0;
    while (curr !== null && safeGuard < FRAME_COUNT) {
      searchPath.push(curr);
      const entry = invertedTable[curr];
      
      if (!entry.isEmpty && entry.pid === pidInput && entry.vpn === vpn) {
        foundFrame = curr;
        break;
      }
      curr = entry.next;
      safeGuard++;
    }
  }

  const physicalAddr = foundFrame !== -1 ? (foundFrame << 12) | offset : null;

  return (
    <div className={`flex flex-col h-full p-6 gap-6 overflow-y-auto ${styles.bg}`}>
      
      {/* Top: Inputs & Hash */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inputs */}
        <div className={`${styles.card} p-6 flex flex-col gap-4`}>
           <h3 className={`font-bold flex items-center gap-2 ${styles.text.primary}`}>
             <div className={`p-1.5 rounded-lg ${mode === 'cute' ? 'bg-orange-100 text-orange-500' : 'bg-orange-100 text-orange-600'}`}><Fingerprint size={18}/></div>
             进程上下文 (Context)
           </h3>
           
           <div>
             <label className={`text-xs font-bold uppercase mb-1 block ${styles.text.secondary}`}>Process ID (PID)</label>
             <input 
                type="number" 
                value={pidInput} 
                onChange={(e) => setPidInput(parseInt(e.target.value) || 0)}
                className={`w-full p-2 ${styles.input} ${styles.text.primary} font-mono font-bold`} 
             />
           </div>
           
           <div>
             <label className={`text-xs font-bold uppercase mb-1 block ${styles.text.secondary}`}>Virtual Addr (Hex)</label>
             <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">0x</span>
               <input 
                  type="text" 
                  value={addrInput} 
                  onChange={(e) => {
                     if(e.target.value.length <= 4) setAddrInput(e.target.value.toUpperCase());
                  }}
                  className={`w-full pl-8 p-2 ${styles.input} ${styles.text.primary} font-mono font-bold uppercase`} 
               />
             </div>
           </div>

           <div className={`p-3 rounded-xl border flex items-center gap-4 ${mode === 'cute' ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-center">
                <div className="text-[10px] text-slate-400">PID</div>
                <div className={`font-mono font-bold text-lg ${styles.text.primary}`}>{pidInput}</div>
              </div>
              <div className="text-slate-300 font-light text-xl">+</div>
              <div className="text-center">
                <div className="text-[10px] text-slate-400">VPN</div>
                <div className={`font-mono font-bold text-lg ${styles.text.primary}`}>{vpn.toString(16).toUpperCase()}</div>
              </div>
           </div>
        </div>

        {/* Hash Function Visualization */}
        <div className={`${styles.card} p-6 flex flex-col items-center justify-center relative overflow-hidden`}>
           <div className={`absolute inset-0 opacity-5 pointer-events-none ${mode === 'cute' ? 'bg-[radial-gradient(circle,theme(colors.pink.400)_1px,transparent_1px)] bg-[size:20px_20px]' : 'bg-slate-100'}`}></div>
           
           <h3 className={`font-bold flex items-center gap-2 mb-6 ${styles.text.primary}`}>
             <Hash size={18}/> 哈希计算
           </h3>

           <div className="flex items-center gap-2">
              <div className={`px-4 py-2 border-2 border-dashed ${mode === 'cute' ? 'border-orange-300 bg-orange-50 text-orange-600' : 'border-slate-300 bg-slate-50 text-slate-600'} rounded-lg font-mono font-bold`}>
                Hash({pidInput}, 0x{vpn.toString(16).toUpperCase()})
              </div>
              <ArrowRight className="animate-pulse text-slate-400"/>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg transform transition-all hover:scale-110 ${mode === 'cute' ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-slate-800'}`}>
                {hashIdx}
              </div>
           </div>
           
           <p className={`mt-4 text-xs text-center max-w-[200px] ${styles.text.secondary}`}>
             Index = (PID + VPN) % {FRAME_COUNT}
             <br/>(模拟算法)
           </p>
        </div>

        {/* Result */}
        <div className={`${styles.card} p-6 flex flex-col justify-center items-center`}>
           <h3 className={`font-bold flex items-center gap-2 mb-4 ${styles.text.primary}`}>
              <CheckCircle size={18}/> 物理地址
           </h3>
           
           {foundFrame !== -1 ? (
             <div className="text-center animate-in zoom-in duration-300">
               <div className={`text-4xl font-mono font-black tracking-wider mb-2 ${mode === 'cute' ? 'text-teal-500' : 'text-emerald-600'}`}>
                 0x{physicalAddr?.toString(16).toUpperCase().padStart(5,'0')}
               </div>
               <div className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full ${mode === 'cute' ? 'bg-teal-100 text-teal-600' : 'bg-emerald-100 text-emerald-700'}`}>
                 Frame: {foundFrame} | Offset: {offset.toString(16).toUpperCase()}
               </div>
             </div>
           ) : (
             <div className="text-center opacity-50">
               <Ban size={32} className="mx-auto mb-2 text-red-400"/>
               <div className="text-sm font-bold text-red-400">Entry Not Found</div>
             </div>
           )}
        </div>

      </div>

      {/* Inverted Page Table */}
      <div className={`${styles.card} flex-1 flex flex-col overflow-hidden`}>
         <div className={`p-4 border-b flex items-center justify-between ${styles.cardHeader}`}>
            <h3 className={`font-bold flex items-center gap-2 ${styles.text.primary}`}>
              <Table size={18}/> 反转页表 (全局唯一的 Frame Table)
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded-full ${mode === 'cute' ? 'bg-orange-400' : 'bg-slate-800'}`}></span>
                <span>Hash Entry</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded-full ${mode === 'cute' ? 'bg-sky-400' : 'bg-blue-500'}`}></span>
                <span>Search Path</span>
              </div>
            </div>
         </div>

         <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {invertedTable.map((entry, idx) => {
                const isHashStart = idx === hashIdx;
                const isInPath = searchPath.includes(idx);
                const isMatch = idx === foundFrame;
                
                let borderColor = mode === 'cute' ? 'border-pink-100' : 'border-slate-200';
                let bgColor = mode === 'cute' ? 'bg-white' : 'bg-white';
                let textColor = styles.text.primary;
                let shadow = 'shadow-sm';

                if (isMatch) {
                   borderColor = mode === 'cute' ? 'border-teal-300' : 'border-emerald-500';
                   bgColor = mode === 'cute' ? 'bg-teal-50' : 'bg-emerald-50';
                   textColor = mode === 'cute' ? 'text-teal-700' : 'text-emerald-700';
                   shadow = 'shadow-lg ring-2 ring-teal-200';
                } else if (isInPath) {
                   borderColor = mode === 'cute' ? 'border-sky-300' : 'border-blue-400';
                   bgColor = mode === 'cute' ? 'bg-sky-50' : 'bg-blue-50';
                } else if (isHashStart) {
                   borderColor = mode === 'cute' ? 'border-orange-300' : 'border-orange-400';
                   shadow = 'ring-2 ring-orange-100';
                }

                return (
                  <div key={idx} className={`relative p-3 border-2 rounded-xl transition-all duration-300 flex flex-col gap-1 ${borderColor} ${bgColor} ${shadow} ${isInPath ? 'scale-105 z-10' : 'opacity-80 grayscale-[0.2]'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Frame</span>
                      <span className={`text-lg font-mono font-bold ${isMatch ? textColor : 'text-slate-600'}`}>{idx}</span>
                    </div>
                    
                    <div className={`h-[1px] w-full ${mode === 'cute' ? 'bg-slate-100' : 'bg-slate-200'}`}></div>
                    
                    {!entry.isEmpty ? (
                      <div className="text-xs space-y-1 mt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">PID</span>
                          <span className="font-mono font-bold">{entry.pid}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">VPN</span>
                          <span className="font-mono font-bold">{entry.vpn.toString(16).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-100/50 rounded px-1">
                          <span className="text-[9px] text-slate-400">Next</span>
                          {entry.next !== null ? (
                             <span className="font-mono font-bold flex items-center gap-0.5 text-[10px] text-blue-500">
                               {entry.next} <Shuffle size={8}/>
                             </span>
                          ) : <span className="text-[10px] text-slate-300">-</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-[10px] text-slate-300 italic py-2">
                        Empty
                      </div>
                    )}

                    {isHashStart && (
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm z-20">
                        HASH
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
         </div>
      </div>
    </div>
  );
};
