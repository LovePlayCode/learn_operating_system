
import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { FrameState } from '../types';
import { RefreshCcw, Play, ArrowRight, Clock, History, AlertOctagon, CheckCircle, Database, Lightbulb, ChevronRight } from 'lucide-react';

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

  // --- Predictive Analysis Logic ---
  const getNextStepAnalysis = () => {
    if (currentIndex >= refString.length) return "模拟已完成。点击重置重新开始。";

    const page = refString[currentIndex];
    const existingIdx = frames.findIndex(f => f.pageId === page);

    if (existingIdx !== -1) {
       return (
         <span>
           请求页面 <strong className="font-black px-1">{page}</strong> 已在内存中 (页框 {existingIdx})。
           <br/>
           <span className="text-green-600 font-bold flex items-center gap-1 mt-1"><CheckCircle size={14}/> 判定：命中 (HIT)</span>
           {algo === 'LRU' && <span className="text-xs text-slate-500 block mt-1">更新其时间戳为最新。</span>}
           {algo === 'CLOCK' && <span className="text-xs text-slate-500 block mt-1">将其引用位 (R) 刷新为 <strong className="text-green-600">1</strong>。</span>}
         </span>
       );
    }

    // MISS
    const emptyIdx = frames.findIndex(f => f.pageId === null);
    if (emptyIdx !== -1) {
       return (
         <span>
           请求页面 <strong className="font-black px-1">{page}</strong> 不在内存中。
           <br/>
           <span className="text-orange-500 font-bold flex items-center gap-1 mt-1"><AlertOctagon size={14}/> 判定：缺页 (MISS)</span>
           <span className="text-xs text-slate-500 block mt-1">存在空闲页框 {emptyIdx}，直接装入。</span>
         </span>
       );
    }

    // REPLACEMENT
    let victimId = -1;
    let explanation = "";

    if (algo === 'FIFO') {
        const sorted = [...frames].sort((a,b) => a.insertedAt - b.insertedAt);
        victimId = sorted[0].id;
        explanation = `FIFO: 页框 ${victimId} 最早进入，将被置换。`;
    } else if (algo === 'LRU') {
        const sorted = [...frames].sort((a,b) => a.timestamp - b.timestamp);
        victimId = sorted[0].id;
        explanation = `LRU: 页框 ${victimId} 最久未被使用，将被置换。`;
    } else if (algo === 'CLOCK') {
        // Simulate Clock
        let ptr = pointer;
        let scanned = [];
        let found = false;
        // Safety break
        for(let i=0; i<frames.length * 2 + 1; i++) {
            const f = frames[ptr];
            if (f.refBit === false) {
                victimId = ptr;
                found = true;
                break;
            }
            scanned.push(ptr);
            ptr = (ptr + 1) % frames.length;
        }
        if (found) {
            if (scanned.length === 0) {
                 explanation = `Clock: 指针指向页框 ${victimId} 且 R=0。直接置换。`;
            } else {
                 explanation = `Clock: 指针扫描过页框 ${scanned.join(', ')} (将其 R 设为 0)，最终在页框 ${victimId} 发现 R=0 并置换。`;
            }
        }
    }

    return (
        <span>
           请求页面 <strong className="font-black px-1">{page}</strong> 不在内存且已满。
           <br/>
           <span className="text-red-500 font-bold flex items-center gap-1 mt-1"><RefreshCcw size={14}/> 判定：置换 (REPLACE)</span>
           <span className="text-xs text-slate-500 block mt-1">{explanation}</span>
        </span>
    );
  };

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
            <div className="text-xs text-slate-500 font-medium hidden md:block border-l pl-4 border-slate-200">
               {algo === 'FIFO' && '先进先出：最简单，但可能出现 Belady 异常。'}
               {algo === 'LRU' && '最近最少使用：性能好，但开销大 (需硬件支持)。'}
               {algo === 'CLOCK' && '时钟置换：LRU 的近似实现，基于引用位 (Ref Bit)。'}
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
            
            {/* Request Queue */}
            <div className="flex items-center gap-2 mb-8">
               <div className="text-xs font-bold uppercase text-slate-400 mr-2 flex items-center gap-1"><ArrowRight size={14}/> 接下来:</div>
               <div className="flex items-center">
                 {refString.slice(currentIndex, currentIndex + 6).map((page, i) => (
                    <div key={i} className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 font-bold text-lg transition-all mr-2 ${i === 0 ? (mode === 'cute' ? 'bg-pink-100 border-pink-400 text-pink-600 scale-110 shadow-lg z-10' : 'bg-blue-100 border-blue-500 text-blue-700 scale-110 shadow-lg z-10') : 'bg-slate-50 border-slate-100 text-slate-300 scale-90'}`}>
                       {page}
                    </div>
                 ))}
                 <div className="text-slate-300 text-xs">...</div>
               </div>
            </div>

            {/* Analysis Box */}
            <div className={`mb-10 p-4 rounded-xl border-l-4 shadow-sm flex items-start gap-3 w-full max-w-lg transition-all ${
               currentIndex >= refString.length 
                 ? 'bg-slate-50 border-slate-300 text-slate-500 opacity-50'
                 : (mode === 'cute' ? 'bg-indigo-50 border-indigo-300 text-indigo-800' : 'bg-blue-50 border-blue-400 text-slate-700')
            }`}>
               <Lightbulb size={20} className="shrink-0 mt-0.5 text-yellow-500" fill="currentColor" />
               <div className="text-sm leading-relaxed flex-1">
                  <div className="font-bold text-[10px] uppercase opacity-60 mb-1">下一步行为预判 (Next Step Analysis)</div>
                  {getNextStepAnalysis()}
               </div>
            </div>

            {/* RAM Frames */}
            <div className="relative mt-4">
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
                            <div className={`absolute -top-10 left-1/2 -translate-x-1/2 transition-all duration-300 z-20 flex flex-col items-center ${isClockHand ? 'opacity-100 translate-y-2' : 'opacity-0'}`}>
                               <div className="text-orange-500 font-bold text-[10px] whitespace-nowrap bg-orange-50 px-1 rounded border border-orange-200 shadow-sm mb-1">Clock Hand</div>
                               <div className="w-0.5 h-3 bg-orange-500"></div>
                               <div className="w-2 h-2 bg-orange-500 rotate-45 -mt-1"></div>
                            </div>
                          )}

                          <div className={`w-24 h-32 rounded-2xl border-4 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${
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
                               <span className="text-slate-300 text-xs">Empty</span>
                             )}

                             {/* Metadata Badges */}
                             <div className="absolute bottom-0 w-full flex justify-center pb-2">
                               {algo === 'CLOCK' && (
                                 <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shadow-sm ${frame.refBit ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                   R={frame.refBit ? 1 : 0}
                                 </span>
                               )}
                               {algo === 'LRU' && frame.pageId !== null && (
                                 <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-200">
                                   t={frame.timestamp % 10000}
                                 </span>
                               )}
                               {algo === 'FIFO' && frame.pageId !== null && (
                                 <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-200">
                                   in={frame.insertedAt % 10000}
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
                    <div key={i} className={`flex justify-between items-center p-2 rounded-lg text-xs border animate-in slide-in-from-left-2 ${h.result === 'HIT' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
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
