
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Network, Server, Database, Globe, Share2, RefreshCcw, 
  CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, 
  LayoutGrid, GitCommit, DatabaseZap, Clock, Wifi, Lock, Play,
  FileCode, HardDrive, FileJson, Unplug, RotateCw
} from 'lucide-react';

// --- Sub-component: Consistency / Replication ---
const ConsistencyDemo = () => {
  const { styles, mode } = useTheme();
  const [model, setModel] = useState<'strong' | 'eventual'>('strong');
  const [masterVal, setMasterVal] = useState(0);
  const [replica1, setReplica1] = useState(0);
  const [replica2, setReplica2] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("系统空闲");

  // Animations
  const [packet1, setPacket1] = useState<'none' | 'sending' | 'ack'>('none');
  const [packet2, setPacket2] = useState<'none' | 'sending' | 'ack'>('none');

  const writeData = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const newVal = masterVal + 1;
    
    if (model === 'strong') {
        setStatusMsg("Client: 等待写入确认 (Strong)...");
        // Update Master but block client
        setMasterVal(newVal);
        setPacket1('sending');
        setPacket2('sending');

        setTimeout(() => {
            setReplica1(newVal);
            setReplica2(newVal);
            setPacket1('ack');
            setPacket2('ack');
            
            setTimeout(() => {
                setPacket1('none');
                setPacket2('none');
                setIsProcessing(false);
                setStatusMsg("Success: 所有副本已更新，返回 Client");
            }, 1000);
        }, 1500);
    } else {
        // Eventual
        setMasterVal(newVal);
        setStatusMsg("Success: Master 已写入，立即返回 Client");
        // Async replication start
        setPacket1('sending');
        setPacket2('sending');
        
        // Client is free immediately (simulated by allowing new clicks, though we disable btn for clarity)
        setTimeout(() => setIsProcessing(false), 500);

        // Async updates happen later with random delays
        setTimeout(() => {
            setReplica1(newVal);
            setPacket1('none');
        }, 1000 + Math.random() * 1000);

        setTimeout(() => {
            setReplica2(newVal);
            setPacket2('none');
        }, 1500 + Math.random() * 1000);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className={`${styles.card} p-4 flex justify-between items-center shrink-0`}>
          <div>
             <h3 className={`font-bold ${styles.text.primary} flex items-center gap-2`}>
                <DatabaseZap size={20} className="text-blue-500"/> 主从复制 (Replication)
             </h3>
             <p className="text-xs text-slate-500">CAP 定理: 一致性 (C) vs 可用性 (A)</p>
          </div>
          <div className={`flex p-1 rounded-xl border ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
             <button onClick={() => setModel('strong')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${model === 'strong' ? (mode === 'cute' ? 'bg-pink-400 text-white' : 'bg-slate-800 text-white') : 'text-slate-500'}`}>
               强一致性 (Strong)
             </button>
             <button onClick={() => setModel('eventual')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${model === 'eventual' ? (mode === 'cute' ? 'bg-pink-400 text-white' : 'bg-slate-800 text-white') : 'text-slate-500'}`}>
               最终一致性 (Eventual)
             </button>
          </div>
       </div>

       <div className="flex-1 relative flex flex-col items-center justify-center min-h-[400px]">
          
          {/* Client */}
          <div className="flex flex-col items-center z-10">
             <button 
               onClick={writeData} 
               disabled={isProcessing && model === 'strong'}
               className={`mb-8 px-6 py-3 rounded-full font-bold shadow-lg transition-all flex items-center gap-2 ${
                 isProcessing && model === 'strong' ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : (mode === 'cute' ? 'bg-blue-400 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white')
               }`}
             >
               <Share2 size={18}/> 写入数据 (+1)
             </button>
             
             <div className={`text-xs font-bold px-3 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 mb-8`}>
               {statusMsg}
             </div>
          </div>

          <div className="flex gap-24 items-start relative">
             
             {/* Master */}
             <div className="flex flex-col items-center relative z-10">
                <div className={`w-24 h-28 rounded-xl border-4 flex flex-col items-center justify-center shadow-xl transition-all ${mode === 'cute' ? 'bg-orange-100 border-orange-300' : 'bg-slate-800 border-slate-600'}`}>
                   <Database size={32} className={mode === 'cute' ? 'text-orange-500' : 'text-white'}/>
                   <div className={`text-3xl font-black mt-2 ${mode === 'cute' ? 'text-orange-600' : 'text-white'}`}>{masterVal}</div>
                </div>
                <span className="font-bold mt-2 text-sm text-orange-600">Master</span>
             </div>

             {/* Replicas Container */}
             <div className="flex flex-col gap-12 pt-12">
                
                {/* Replica 1 */}
                <div className="flex flex-col items-center relative z-10">
                   <div className={`w-20 h-24 rounded-xl border-4 flex flex-col items-center justify-center shadow-md transition-all ${replica1 === masterVal ? (mode === 'cute' ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-slate-300') : 'bg-red-50 border-red-200'}`}>
                      <Server size={24} className="text-slate-400"/>
                      <div className="text-xl font-bold mt-1 text-slate-700">{replica1}</div>
                   </div>
                   <span className="text-xs text-slate-500 font-bold mt-1">Replica 1</span>
                </div>

                {/* Replica 2 */}
                <div className="flex flex-col items-center relative z-10">
                   <div className={`w-20 h-24 rounded-xl border-4 flex flex-col items-center justify-center shadow-md transition-all ${replica2 === masterVal ? (mode === 'cute' ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-slate-300') : 'bg-red-50 border-red-200'}`}>
                      <Server size={24} className="text-slate-400"/>
                      <div className="text-xl font-bold mt-1 text-slate-700">{replica2}</div>
                   </div>
                   <span className="text-xs text-slate-500 font-bold mt-1">Replica 2</span>
                </div>

             </div>

             {/* Lines & Packets */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none -z-0 overflow-visible" style={{ left: '-50%', width: '200%' }}>
                {/* Lines Master to R1 */}
                <path d="M 50% 50 L 70% 80" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                {/* Lines Master to R2 */}
                <path d="M 50% 50 L 70% 220" stroke="#cbd5e1" strokeWidth="2" fill="none" />

                {/* Packet 1 Animation */}
                {packet1 === 'sending' && (
                   <circle r="6" fill={mode === 'cute' ? '#fbbf24' : '#3b82f6'}>
                      <animateMotion dur="1s" repeatCount="1" path="M 50% 50 L 70% 80" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
                   </circle>
                )}
                {packet1 === 'ack' && (
                   <circle r="6" fill="#22c55e">
                      <animateMotion dur="0.5s" repeatCount="1" path="M 70% 80 L 50% 50" fill="freeze" />
                   </circle>
                )}

                {/* Packet 2 Animation */}
                {packet2 === 'sending' && (
                   <circle r="6" fill={mode === 'cute' ? '#fbbf24' : '#3b82f6'}>
                      <animateMotion dur="1.2s" repeatCount="1" path="M 50% 50 L 70% 220" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
                   </circle>
                )}
                {packet2 === 'ack' && (
                   <circle r="6" fill="#22c55e">
                      <animateMotion dur="0.5s" repeatCount="1" path="M 70% 220 L 50% 50" fill="freeze" />
                   </circle>
                )}
             </svg>

          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 max-w-lg text-center leading-relaxed">
             {model === 'strong' 
               ? "CP 系统 (Consistency & Partition): 写入时需等待所有副本确认。保证数据一致，但网络延迟或节点故障会阻塞写入，降低可用性。"
               : "AP 系统 (Availability & Partition): 写入立即返回。数据随后异步同步。保证高可用和低延迟，但可能在短时间内读到旧数据（数据不一致）。"
             }
          </div>
       </div>
    </div>
  );
};

// --- Sub-component: Consistent Hashing ---
const ConsistentHashingDemo = () => {
  const { styles, mode } = useTheme();
  
  const [nodes, setNodes] = useState([0, 90, 180, 270]); // Angles
  const [keys, setKeys] = useState([10, 45, 100, 200, 300, 350]); // Angles
  
  const addNode = () => {
    const angle = Math.floor(Math.random() * 360);
    setNodes(prev => [...prev, angle].sort((a,b) => a-b));
  };

  const removeNode = (angle: number) => {
    if (nodes.length <= 1) return;
    setNodes(prev => prev.filter(n => n !== angle));
  };

  const getNodeForKey = (keyAngle: number) => {
    // Find first node >= keyAngle
    const node = nodes.find(n => n >= keyAngle);
    return node !== undefined ? node : nodes[0];
  };

  const getNodeColor = (nodeAngle: number) => {
    // Deterministic color based on angle
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
    return colors[nodeAngle % colors.length];
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className={`${styles.card} p-4 flex justify-between items-center shrink-0`}>
          <div>
             <h3 className={`font-bold ${styles.text.primary} flex items-center gap-2`}>
                <Globe size={20} className="text-purple-500"/> 一致性哈希 (Consistent Hashing)
             </h3>
             <p className="text-xs text-slate-500">分布式缓存与负载均衡的核心算法</p>
          </div>
          <button onClick={addNode} className={`${styles.button.primary} px-4 py-2 text-xs flex items-center gap-2`}>
             <Share2 size={14}/> 添加节点
          </button>
       </div>

       <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12">
          
          {/* Ring Visualization */}
          <div className="relative w-80 h-80">
             {/* The Ring */}
             <div className="absolute inset-0 rounded-full border-8 border-slate-200"></div>
             
             {/* Nodes */}
             {nodes.map((nodeAngle, i) => (
                <div 
                  key={nodeAngle}
                  className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold z-20 cursor-pointer hover:scale-125 transition-transform ${getNodeColor(nodeAngle)}`}
                  style={{ 
                    left: '50%', top: '50%',
                    transform: `rotate(${nodeAngle}deg) translate(156px) rotate(-${nodeAngle}deg)`
                  }}
                  onClick={() => removeNode(nodeAngle)}
                  title={`Node @ ${nodeAngle}° (Click to remove)`}
                >
                   N{i}
                </div>
             ))}

             {/* Keys */}
             {keys.map((keyAngle, i) => {
                const targetNode = getNodeForKey(keyAngle);
                const colorClass = getNodeColor(targetNode);
                const bgClass = colorClass.replace('bg-', 'text-'); // simple hack for text color match
                
                return (
                  <div 
                    key={i}
                    className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border border-slate-400 bg-white z-10 transition-all duration-700`}
                    style={{ 
                      left: '50%', top: '50%',
                      transform: `rotate(${keyAngle}deg) translate(120px) rotate(-${keyAngle}deg)`
                    }}
                  >
                     {/* Connector Line to Ring */}
                     <div 
                        className={`absolute top-1/2 left-1/2 w-8 h-0.5 origin-left -z-10 opacity-50 ${colorClass}`}
                        style={{ transform: `rotate(${keyAngle}deg)` }}
                     ></div>
                  </div>
                )
             })}
          </div>

          {/* Stats / Legend */}
          <div className="w-64 space-y-4">
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-sm mb-2 text-slate-700">节点分布</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                   {nodes.map((n, i) => {
                      const keyCount = keys.filter(k => getNodeForKey(k) === n).length;
                      return (
                        <div key={n} className="flex items-center justify-between text-xs">
                           <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getNodeColor(n)}`}></div>
                              <span>Node {i} ({n}°)</span>
                           </div>
                           <span className="font-mono font-bold bg-slate-200 px-1.5 rounded">{keyCount} Keys</span>
                        </div>
                      )
                   })}
                </div>
             </div>

             <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 leading-relaxed">
                <p>
                   <strong>原理：</strong> 将数据 Key 和服务器 Node 都映射到 0~2^32 的圆环上。
                   数据顺时针存入遇到的第一个 Node。
                </p>
                <p className="mt-2">
                   <strong>优势：</strong> 当节点增加/删除时，只影响该节点附近的一小部分数据，避免了全量数据迁移（Re-hashing）。
                </p>
             </div>
          </div>

       </div>
    </div>
  );
};

// --- Sub-component: Two-Phase Commit (2PC) ---
const TwoPhaseCommitDemo = () => {
  const { styles, mode } = useTheme();
  
  const [step, setStep] = useState<'IDLE' | 'PREPARE' | 'VOTE' | 'COMMIT' | 'ABORT'>('IDLE');
  const [votes, setVotes] = useState<boolean[]>([true, true, true]); // true=Yes, false=No
  
  // Simulation State
  const [messages, setMessages] = useState<{from: string, to: string, text: string}[]>([]);

  const startTx = () => {
    setStep('PREPARE');
    setMessages([{ from: 'Coordinator', to: 'All', text: 'PREPARE?' }]);
    
    setTimeout(() => {
       setStep('VOTE');
       const responses = votes.map((v, i) => ({ from: `P${i+1}`, to: 'Coordinator', text: v ? 'YES' : 'NO' }));
       setMessages(responses);

       setTimeout(() => {
          if (votes.every(v => v)) {
             setStep('COMMIT');
             setMessages([{ from: 'Coordinator', to: 'All', text: 'COMMIT!' }]);
          } else {
             setStep('ABORT');
             setMessages([{ from: 'Coordinator', to: 'All', text: 'ABORT!' }]);
          }
          
          setTimeout(() => setStep('IDLE'), 2500);
       }, 1500);
    }, 1500);
  };

  const toggleVote = (idx: number) => {
    if (step !== 'IDLE') return;
    const newVotes = [...votes];
    newVotes[idx] = !newVotes[idx];
    setVotes(newVotes);
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className={`${styles.card} p-4 flex justify-between items-center shrink-0`}>
          <div>
             <h3 className={`font-bold ${styles.text.primary} flex items-center gap-2`}>
                <GitCommit size={20} className="text-emerald-500"/> 两阶段提交 (2PC)
             </h3>
             <p className="text-xs text-slate-500">分布式事务的原子性保证 (ACID)</p>
          </div>
          <button 
            onClick={startTx} 
            disabled={step !== 'IDLE'}
            className={`${styles.button.primary} px-6 py-2 flex items-center gap-2 disabled:opacity-50`}
          >
            <Play size={16}/> 发起事务
          </button>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center relative">
          
          {/* Coordinator */}
          <div className={`z-10 w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl transition-all ${
             step === 'COMMIT' ? 'bg-green-100 border-green-400' : 
             step === 'ABORT' ? 'bg-red-100 border-red-400' : 
             step === 'PREPARE' ? 'bg-yellow-100 border-yellow-400' :
             (mode === 'cute' ? 'bg-indigo-100 border-indigo-300' : 'bg-slate-800 border-slate-600')
          }`}>
             <ShieldCheck size={32} className={step === 'IDLE' ? 'text-slate-400' : 'text-slate-700'}/>
             <div className="font-bold mt-1 text-sm text-slate-700">Coordinator</div>
             <div className="text-[10px] font-bold uppercase mt-1">{step}</div>
          </div>

          {/* Participants */}
          <div className="flex gap-16 mt-24">
             {votes.map((vote, i) => (
                <div key={i} className="flex flex-col items-center gap-2 relative group">
                   {/* Packet Animation */}
                   {step !== 'IDLE' && (
                      <div className={`absolute -top-12 left-1/2 -translate-x-1/2 transition-all duration-1000 ${
                         step === 'PREPARE' ? 'translate-y-12 opacity-0' : // Down
                         step === 'VOTE' ? '-translate-y-12 opacity-0' : // Up
                         'translate-y-12 opacity-0' // Down again
                      }`}>
                         <div className={`w-3 h-3 rounded-full ${step === 'VOTE' ? (vote ? 'bg-green-500' : 'bg-red-500') : 'bg-blue-500'}`}></div>
                      </div>
                   )}

                   <div 
                     onClick={() => toggleVote(i)}
                     className={`w-24 h-24 rounded-xl border-4 flex flex-col items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-105 ${
                        step === 'IDLE' 
                          ? (vote ? 'bg-white border-green-200' : 'bg-white border-red-200')
                          : (step === 'COMMIT' ? 'bg-green-50 border-green-400' : step === 'ABORT' ? 'bg-slate-200 border-slate-400' : 'bg-white border-slate-300')
                     }`}
                   >
                      <Database size={24} className="text-slate-400"/>
                      <div className="font-bold text-sm mt-1">P{i+1}</div>
                      <div className={`text-[10px] font-bold px-2 rounded mt-1 ${vote ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         Vote: {vote ? 'YES' : 'NO'}
                      </div>
                   </div>
                   
                   {/* Connector Lines (Visual Only) */}
                   <div className="absolute -top-24 left-1/2 w-0.5 h-24 bg-slate-300 -z-10 origin-bottom" 
                        style={{ transform: i === 0 ? 'rotate(20deg)' : i === 2 ? 'rotate(-20deg)' : 'rotate(0deg)' }}></div>
                </div>
             ))}
          </div>

          {/* Status Message */}
          <div className="absolute bottom-8 bg-white/80 backdrop-blur px-6 py-2 rounded-full border shadow-sm font-mono text-xs">
             Current Msg: {messages.length > 0 ? messages[0].text : '...'}
          </div>

       </div>
    </div>
  );
};

// --- Sub-component: NFS v2 Demo ---
const NFSv2Demo = () => {
  const { styles, mode } = useTheme();
  
  const [fileContent, setFileContent] = useState("Hello");
  const [cache, setCache] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'UP' | 'DOWN'>('UP');
  
  const [packet, setPacket] = useState<'NONE' | 'REQ' | 'RES'>('NONE');
  const [reqType, setReqType] = useState<'READ' | 'WRITE'>('READ');
  const [log, setLog] = useState("系统就绪。");
  const [writeVal, setWriteVal] = useState("World");

  // A simulated unique handle for the file
  const fhandle = "FH:0x3A"; 

  const performRead = () => {
    if (packet !== 'NONE') return;
    
    // Client Side: Check cache first (simplified)
    // In strict NFS v2, client checks attribute cache (GETATTR) then READ.
    // Here we demo simple READ RPC.
    
    setReqType('READ');
    setPacket('REQ');
    setLog(`客户端: 发送 RPC 请求 READ(${fhandle}, offset=0)`);

    setTimeout(() => {
        if (serverStatus === 'DOWN') {
            setPacket('NONE');
            setLog("超时: 服务器无响应。客户端正在重试...");
            // Simple retry logic simulation
            setTimeout(performRead, 1500); 
        } else {
            // Server processing
            setPacket('RES');
            setLog("服务器: 读取磁盘数据... 返回结果。");
            setTimeout(() => {
                setCache(fileContent);
                setPacket('NONE');
                setLog("客户端: 读取成功。数据已缓存。");
            }, 1000);
        }
    }, 1500);
  };

  const performWrite = () => {
    if (packet !== 'NONE') return;
    
    setReqType('WRITE');
    setPacket('REQ');
    setLog(`客户端: 发送 RPC 请求 WRITE(${fhandle}, "${writeVal}")`);

    setTimeout(() => {
        if (serverStatus === 'DOWN') {
            setPacket('NONE');
            setLog("超时: 服务器无响应。客户端正在重试...");
            // Retry
            setTimeout(performWrite, 1500); 
        } else {
            // Server processing - Sync Write
            setLog("服务器: 正在写入磁盘 (同步 SYNC)...");
            setTimeout(() => {
                setFileContent(writeVal);
                setPacket('RES');
                setLog("服务器: 数据已落盘。发送 OK 确认。");
                setTimeout(() => {
                    setPacket('NONE');
                    // Invalidate cache on write
                    setCache(writeVal); 
                    setLog("客户端: 写入成功。");
                }, 1000);
            }, 1000); // Disk delay
        }
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className={`${styles.card} p-4 flex justify-between items-center shrink-0`}>
          <div>
             <h3 className={`font-bold ${styles.text.primary} flex items-center gap-2`}>
                <Network size={20} className="text-sky-500"/> NFS v2 (Stateless)
             </h3>
             <p className="text-xs text-slate-500">无状态协议与幂等性设计</p>
          </div>
          
          <div className="flex gap-2">
             <button 
               onClick={() => setServerStatus(s => s === 'UP' ? 'DOWN' : 'UP')}
               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border flex items-center gap-2 ${serverStatus === 'UP' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
             >
                {serverStatus === 'UP' ? <RotateCw size={14}/> : <Unplug size={14}/>}
                服务器状态: {serverStatus === 'UP' ? '在线' : '宕机'}
             </button>
          </div>
       </div>

       <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-16 relative p-4">
          
          {/* Client Node */}
          <div className={`w-64 p-6 rounded-2xl border-4 flex flex-col gap-4 relative z-10 ${mode === 'cute' ? 'bg-white border-sky-200' : 'bg-slate-50 border-slate-300'}`}>
             <div className="flex items-center gap-2 border-b pb-2">
                <FileCode size={20} className="text-slate-500"/>
                <span className="font-bold text-sm">NFS 客户端</span>
             </div>
             
             <div className="space-y-2">
                <div className="flex gap-2">
                   <button onClick={performRead} disabled={packet !== 'NONE'} className={`${styles.button.primary} flex-1 py-2 text-xs`}>读取 (Read)</button>
                   <button onClick={performWrite} disabled={packet !== 'NONE'} className={`${styles.button.secondary} flex-1 py-2 text-xs`}>写入 (Write)</button>
                </div>
                <div className="flex items-center gap-2">
                   <input 
                     type="text" value={writeVal} onChange={e => setWriteVal(e.target.value)}
                     className={`w-full p-1 text-xs border rounded ${styles.input}`}
                   />
                </div>
             </div>

             <div className="bg-slate-100 p-2 rounded border border-slate-200 mt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">页缓存 (Page Cache)</div>
                <div className="font-mono text-sm">{cache || <span className="text-slate-300 italic">空 (Empty)</span>}</div>
             </div>
          </div>

          {/* Network / Packets */}
          <div className="flex-1 h-32 relative flex items-center justify-center">
             <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
             
             {/* The Packet */}
             {packet !== 'NONE' && (
                <div className={`absolute top-1/2 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-2 transition-all duration-[1500ms] linear ${
                   packet === 'REQ' 
                     ? 'left-[10%] bg-blue-500' // Move to right logic handled by keyframes/custom logic usually, simplified here by class switching or just fixed positioning with timeouts.
                     : 'left-[80%] bg-green-500' // For simplicity in this static-like React render, we need CSS animation or a timer updating position. 
                }`}
                style={{ 
                   left: packet === 'REQ' ? '80%' : '10%', // Target
                   transition: 'left 1.5s ease-in-out',
                   transform: 'translate(-50%, -50%)' 
                }}
                >
                   {packet === 'REQ' ? reqType : 'ACK/DATA'}
                   <span className="bg-white/20 px-1 rounded text-[9px] font-mono">{fhandle}</span>
                </div>
             )}
             
             {/* Initial position hack for animation trigger: useEffect usually needed. 
                 For this demo, we use simple conditional rendering which might jump. 
                 To make it smooth, we'd need a 'transit' state. 
                 Assuming the user accepts the 'jump' to end state after timeout for simplicity in this code block context.
             */}
          </div>

          {/* Server Node */}
          <div className={`w-64 p-6 rounded-2xl border-4 flex flex-col gap-4 relative z-10 transition-all ${serverStatus === 'DOWN' ? 'opacity-50 grayscale border-red-300' : (mode === 'cute' ? 'bg-white border-orange-200' : 'bg-slate-50 border-slate-300')}`}>
             <div className="flex items-center gap-2 border-b pb-2 justify-between">
                <div className="flex items-center gap-2">
                   <Server size={20} className={serverStatus === 'DOWN' ? 'text-red-500' : 'text-slate-500'}/>
                   <span className="font-bold text-sm">NFS 服务器</span>
                </div>
                {serverStatus === 'DOWN' && <AlertTriangle size={16} className="text-red-500 animate-pulse"/>}
             </div>

             <div className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-xl border-4 border-slate-600 shadow-inner">
                <HardDrive size={32} className="text-slate-400 mb-2"/>
                <div className="text-xs text-slate-500 mb-1">/var/nfs/data.txt</div>
                <div className="font-mono text-lg font-bold text-white border-b border-slate-600 w-full text-center pb-1">
                   {fileContent}
                </div>
             </div>
             
             <div className="text-[10px] text-slate-400 text-center">
                无状态: 无需 Open/Close
             </div>
          </div>

       </div>

       <div className={`mx-auto max-w-2xl w-full p-3 rounded-lg text-center font-mono text-xs border ${mode === 'cute' ? 'bg-pink-50 border-pink-100 text-pink-600' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
          {log}
       </div>
    </div>
  );
};

// --- Main Distributed View Export ---
export const DistributedView: React.FC = () => {
  const { styles, mode } = useTheme();
  const [tab, setTab] = useState<'consistency' | 'sharding' | '2pc' | 'nfs'>('consistency');

  return (
    <div className={`flex flex-col h-full p-6 gap-6 ${styles.bg}`}>
       <div className="flex justify-center shrink-0">
         <div className={`p-1.5 rounded-2xl flex gap-1.5 border shadow-sm flex-wrap justify-center ${mode === 'cute' ? 'bg-white border-pink-100' : 'bg-slate-200 border-slate-300'}`}>
           <TabButton active={tab === 'consistency'} onClick={() => setTab('consistency')} label="CAP & 一致性" mode={mode} icon={<DatabaseZap size={14}/>}/>
           <TabButton active={tab === 'sharding'} onClick={() => setTab('sharding')} label="一致性哈希" mode={mode} icon={<Globe size={14}/>}/>
           <TabButton active={tab === '2pc'} onClick={() => setTab('2pc')} label="两阶段提交 2PC" mode={mode} icon={<GitCommit size={14}/>}/>
           <TabButton active={tab === 'nfs'} onClick={() => setTab('nfs')} label="NFS v2 (无状态)" mode={mode} icon={<Network size={14}/>}/>
         </div>
       </div>

       <div className="flex-1 overflow-hidden">
          {tab === 'consistency' && <ConsistencyDemo />}
          {tab === 'sharding' && <ConsistentHashingDemo />}
          {tab === '2pc' && <TwoPhaseCommitDemo />}
          {tab === 'nfs' && <NFSv2Demo />}
       </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, mode, icon }: any) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
      active 
        ? (mode === 'cute' ? 'bg-pink-400 text-white shadow-md' : 'bg-white text-slate-800 shadow-sm') 
        : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    {icon} {label}
  </button>
);
