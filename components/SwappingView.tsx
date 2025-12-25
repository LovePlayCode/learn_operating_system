
import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { FrameState } from '../types';
import { RefreshCcw, Play, ArrowRight, Clock, History, AlertOctagon, CheckCircle, Database } from 'lucide-react';

type Algo = 'FIFO' | 'LRU' | 'CLOCK';

const TOTAL_FRAMES = 3;
const REF_STRING_Length = 12;

export const SwappingView: React.FC = () => {
  const { styles, mode } = useTheme();
  
  // State
  const [algo, setAlgo] = useState<Algo>('FIFO');
  const [frames, setFrames] = useState<FrameState[]>([]);
  const [refString, setRefString] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pointer, setPointer] = useState(0); // For Clock Hand
  const [history, setHistory] = useState<{page: number, result: 'HIT'|'MISS'}[]>([]);
  const [highlightFrame, setHighlightFrame] = useState<number | null>(null);

  // Initialize
  useEffect(() => {
    reset();
  }, [algo]);

  const reset = () => {
    // Generate empty frames
    const f: FrameState[] = [];
    for(let i=0; i<TOTAL_FRAMES; i++) {
      f.push({ id: i, pageId: null, refBit: false, timestamp: 0, insertedAt: 0 });
    }
    setFrames(f);
    
    // Generate random reference string (0-5)
    const refs = Array.from({length: REF_STRING_Length}, () => Math.floor(Math.random() * 6));
    setRefString(refs);
    
    setCurrentIndex(0);
    setPointer(0);
    setHistory([]);
    setHighlightFrame(null);
  };

  const nextStep = () => {
    if (currentIndex >= refString.length) return;

    const page = refString[currentIndex];
    const now = Date.now();
    let newFrames = [...frames];
    let result: 'HIT' | 'MISS' = 'MISS';
    let victimIdx = -1;

    // 1. Check for HIT
    const existingIdx = newFrames.findIndex(f => f.pageId === page);
    
    if (existingIdx !== -1) {
       // HIT
       result = 'HIT';
       setHighlightFrame(existingIdx);
       
       // Update metadata based on Algo
       if (algo === 'LRU') {
         newFrames[existingIdx].timestamp = now;
       } else if (algo === 'CLOCK') {
         newFrames[existingIdx].refBit = true;
       }
    } else {
       // MISS (Page Fault)
       // Check if there is empty space
       const emptyIdx = newFrames.findIndex(f => f.pageId === null);
       
       if (emptyIdx !== -1) {
         // Has space, just insert
         newFrames[emptyIdx] = { 
           ...newFrames[emptyIdx], 
           pageId: page, 
           timestamp: now, 
           insertedAt: now,
           refBit: true 
         };
         setHighlightFrame(emptyIdx);
         // For clock, advance pointer if we filled the slot pointed to? (Usually simple fill logic doesn't move pointer, but strictly usually fill circular. Simplified here.)
         if (algo === 'CLOCK' && emptyIdx === pointer) {
            setPointer((pointer + 1) % TOTAL_FRAMES);
         }
       } else {
         // No space -> Replacement Needed
         if (algo === 'FIFO') {
            // Find oldest insertedAt
            let oldest = newFrames[0].insertedAt;
            victimIdx = 0;
            newFrames.forEach((f, i) => {
               if (f.insertedAt < oldest) { oldest = f.insertedAt; victimIdx = i; }
            });
         } else if (algo === 'LRU') {
            // Find oldest timestamp
            let oldest = newFrames[0].timestamp;
            victimIdx = 0;
            newFrames.forEach((f, i) => {
               if (f.timestamp < oldest) { oldest = f.timestamp; victimIdx = i; }
            });
         } else if (algo === 'CLOCK') {
            // Clock Algorithm Logic
            let p = pointer;
            while (true) {
               if (newFrames[p].refBit === false) {
                 // Found victim
                 victimIdx = p;
                 // Advance pointer for next time
                 setPointer((p + 1) % TOTAL_FRAMES);
                 break;
               } else {
                 // Give second chance
                 newFrames[p].refBit = false;
                 p = (p + 1) % TOTAL_FRAMES;
               }
            }
         }

         // Replace Victim
         if (victimIdx !== -1) {
            setHighlightFrame(victimIdx);
            newFrames[victimIdx] = {
               id: victimIdx,
               pageId: page,
               timestamp: now,
               insertedAt: now,
               refBit: true
            };
         }
       }
    }

    setFrames(newFrames);
    setHistory(prev => [...prev, { page, result }]);
    setCurrentIndex(prev => prev + 1);
  };

  const hitRate = history.length > 0 
    ? ((history.filter(h => h.result === 'HIT').length / history.length) * 100).toFixed(0) 
    : '0';

  return (
    <div className={`flex flex-col h-full p-6 gap-6 overflow-y-auto ${styles.bg}`}>
      
      {/* Controls */}
      <div className={`${styles.card} p-4 flex flex-wrap items-center justify-between gap-4 shrink-0`}>
         <div className="flex items-center gap-4">
            <div className={`flex p-1 rounded-xl border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200/50 border-slate-300'}`}>
              {(['FIFO', 'LRU', 'CLOCK'] as Algo[]).map(a => (
                <button
                  key={a}
                  onClick={() => setAlgo(a)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${algo === a ? (mode === 'cute' ? 'bg-pink-400 text-white' : 'bg-blue-600 text-white') : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 font-medium hidden md:block">
               {algo === 'FIFO' && '先进先出：最简单，但可能出现 Belady 异常（物理页增多缺页反而增多）。'}
               {algo === 'LRU' && '最近最少使用：性能接近最优，但需要硬件支持（时间戳/栈），开销大。'}
               {algo === 'CLOCK' && '时钟置换：LRU 的近似算法，利用引用位 (Ref Bit) 给予“第二次机会”。'}
            </div>
         </div>

         <div className="flex gap-2">
            <button onClick={reset} className={styles.button.icon + " p-2"}><RefreshCcw size={18}/></button>
            <button 
              onClick={nextStep} 
              disabled={currentIndex >= refString.length}
              className={`${styles.button.primary} px-6 py-2 flex items-center gap-2 disabled:opacity-50`}
            >
              <Play size={16}/> 下一步
            </button>
         </div>
      </div>

      {/* Main Visualization */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
         
         {/* Left: Memory & Request */}
         <div className={`${styles.card} p-8 flex-1 flex flex-col items-center justify-center relative`}>
            
            {/* Incoming Queue */}
            <div className="flex items-center gap-2 mb-12">
               <div className="text-xs font-bold uppercase text-slate-400 mr-2">请求队列:</div>
               {refString.slice(currentIndex, currentIndex + 6).map((page, i) => (
                  <div key={i} className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 font-bold text-lg animate-in fade-in slide-in-from-right-4 ${i === 0 ? (mode === 'cute' ? 'bg-pink-100 border-pink-400 text-pink-600 scale-110 shadow-lg' : 'bg-blue-100 border-blue-500 text-blue-700 scale-110 shadow-lg') : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                     {page}
                  </div>
               ))}
               <div className="text-slate-300">...</div>
            </div>

            {/* RAM Frames */}
            <div className="relative">
               <h4 className="absolute -top-8 left-0 text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                  <Database size={14}/> 物理内存 (3 页框)
               </h4>
               
               <div className="flex gap-6">
                  {frames.map((frame, idx) => {
                     const isHighlight = highlightFrame === idx;
                     const isClockHand = algo === 'CLOCK' && pointer === idx;
                     
                     return (
                       <div key={idx} className="relative group">
                          {/* Clock Hand Pointer */}
                          {algo === 'CLOCK' && (
                            <div className={`absolute -top-8 left-1/2 -translate-x-1/2 transition-all duration-300 ${isClockHand ? 'opacity-100 translate-y-2' : 'opacity-0'}`}>
                               <div className="text-orange-500 font-bold text-xs mb-1 whitespace-nowrap">时钟指针</div>
                               <div className="w-0.5 h-4 bg-orange-500 mx-auto"></div>
                               <div className="w-2 h-2 bg-orange-500 rotate-45 mx-auto -mt-1"></div>
                            </div>
                          )}

                          <div className={`w-24 h-32 rounded-2xl border-4 flex flex-col items-center justify-center transition-all duration-300 ${
                            isHighlight 
                              ? (mode === 'cute' ? 'border-pink-400 bg-pink-50 ring-4 ring-pink-100' : 'border-blue-500 bg-blue-50 ring-4 ring-blue-100')
                              : 'border-slate-200 bg-white'
                          }`}>
                             {frame.pageId !== null ? (
                               <>
                                 <span className="text-3xl font-black text-slate-700">{frame.pageId}</span>
                                 <span className="text-[10px] text-slate-400 mt-2">Page #{frame.pageId}</span>
                               </>
                             ) : (
                               <span className="text-slate-300 text-xs">空 (Empty)</span>
                             )}

                             {/* Metadata Badges */}
                             <div className="absolute bottom-2 flex gap-1">
                               {algo === 'CLOCK' && (
                                 <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${frame.refBit ? 'bg-green-100 text-green-600 border-green-200' : 'bg-red-50 text-red-400 border-red-100'}`}>
                                   R={frame.refBit ? 1 : 0}
                                 </span>
                               )}
                               {algo === 'LRU' && frame.pageId !== null && (
                                 <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded">
                                   t={frame.timestamp % 10000}
                                 </span>
                               )}
                             </div>
                          </div>
                          
                          <div className="text-center mt-2 text-xs font-mono text-slate-400">页框 {idx}</div>
                       </div>
                     );
                  })}
               </div>
            </div>
         </div>

         {/* Right: Statistics */}
         <div className={`w-full lg:w-72 shrink-0 flex flex-col gap-6`}>
            <div className={`${styles.card} p-5 flex flex-col`}>
               <h4 className={`font-bold text-sm mb-4 flex items-center gap-2 ${styles.text.primary}`}>
                 <History size={16}/> 置换历史
               </h4>
               <div className="flex-1 overflow-y-auto h-64 space-y-2 pr-1 custom-scrollbar">
                  {[...history].reverse().map((h, i) => (
                    <div key={i} className={`flex justify-between items-center p-2 rounded-lg text-xs border ${h.result === 'HIT' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                       <span className="font-bold">访问页面 {h.page}</span>
                       <span className="flex items-center gap-1 font-bold">
                         {h.result === 'HIT' ? <CheckCircle size={12}/> : <AlertOctagon size={12}/>}
                         {h.result}
                       </span>
                    </div>
                  ))}
                  {history.length === 0 && <div className="text-slate-300 text-center text-xs py-4">等待执行...</div>}
               </div>
            </div>

            <div className={`${styles.card} p-5 text-center`}>
               <div className="text-xs font-bold uppercase text-slate-400 mb-1">命中率 (Hit Rate)</div>
               <div className={`text-3xl font-black ${parseInt(hitRate) > 50 ? 'text-green-500' : 'text-orange-500'}`}>
                 {hitRate}%
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${parseInt(hitRate) > 50 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${hitRate}%` }}></div>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};
