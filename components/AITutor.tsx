import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, Bot, User } from 'lucide-react';
import { askAITutor } from '../services/geminiService';
import { MemoryMode, ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface AITutorProps {
  currentMode: MemoryMode;
  contextDescription: string;
}

const SUGGESTED_QUESTIONS = {
  [MemoryMode.SEGMENTATION]: ["如果偏移量大于界限会发生什么？", "为什么需要物理基址？", "段表里存了什么？"],
  [MemoryMode.PAGING]: ["VPN 和 PFN 是什么关系？", "为什么页表需要有效位？", "页大小对地址转换有什么影响？"],
  [MemoryMode.MULTI_LEVEL]: ["为什么需要多级页表？", "多级页表如何节省空间？", "TLB 是什么？"]
};

export const AITutor: React.FC<AITutorProps> = ({ currentMode, contextDescription }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '你好！我是你的内存管理 AI 助教。关于当前的内存模型，你有什么想问的吗？', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const response = await askAITutor(userMsg.text, currentMode, contextDescription);
    
    const aiMsg: ChatMessage = { role: 'model', text: response, timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center gap-2 group ring-4 ring-slate-100"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="text-yellow-400 group-hover:animate-spin-slow"/>}
        {!isOpen && <span className="font-bold pr-2">AI 提问</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                 <Bot size={20} className="text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-white text-sm">学习助手</h3>
                 <div className="text-[10px] text-blue-200 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                   Online
                 </div>
               </div>
             </div>
             <button onClick={() => setMessages([])} className="text-xs text-slate-400 hover:text-white underline">
               清空
             </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                  {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
                </div>
                <div 
                  className={`max-w-[80%] rounded-2xl p-3.5 text-sm shadow-sm leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none prose prose-sm prose-slate'}`}
                >
                   {msg.role === 'model' ? (
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                   ) : msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0"><Bot size={16}/></div>
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span className="text-xs text-slate-400">正在思考...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {!isLoading && (
             <div className="px-4 pb-2 pt-2 bg-slate-50 overflow-x-auto flex gap-2 no-scrollbar">
               {SUGGESTED_QUESTIONS[currentMode]?.map((q, i) => (
                 <button 
                   key={i}
                   onClick={() => handleSend(q)}
                   className="whitespace-nowrap px-3 py-1.5 bg-white border border-blue-100 text-blue-600 text-xs rounded-full hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm"
                 >
                   {q}
                 </button>
               ))}
             </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
             <div className="relative flex items-center gap-2">
               <input
                 type="text"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="输入你的问题..."
                 className="flex-1 pl-4 pr-10 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-800 placeholder:text-slate-400"
               />
               <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-md shadow-blue-200"
               >
                 <Send size={18} />
               </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};