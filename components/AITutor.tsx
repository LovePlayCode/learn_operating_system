import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, Bot, User, MessageCircleHeart } from 'lucide-react';
import { askAITutor } from '../services/geminiService';
import { MemoryMode, ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../hooks/useTheme';

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
  const { styles, mode } = useTheme();
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
        className={`fixed bottom-8 right-8 p-4 shadow-2xl hover:scale-110 transition-all z-50 flex items-center gap-2 group ring-4 ${
          mode === 'cute' 
            ? 'bg-pink-400 text-white rounded-full ring-pink-100' 
            : 'bg-slate-900 text-white rounded-full ring-slate-100'
        }`}
      >
        {isOpen ? <X size={24} /> : (mode === 'cute' ? <MessageCircleHeart size={24} className="text-white animate-bounce" /> : <Sparkles size={24} className="text-yellow-400 group-hover:animate-spin-slow"/>)}
        {!isOpen && <span className="font-bold pr-2">AI 提问</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-28 right-8 w-[400px] h-[600px] bg-white shadow-2xl border z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 ${
          mode === 'cute' ? 'rounded-[2rem] border-pink-200' : 'rounded-2xl border-slate-200'
        }`}>
          
          {/* Header */}
          <div className={`p-4 flex justify-between items-center shrink-0 ${mode === 'cute' ? 'bg-pink-400' : 'bg-slate-900'}`}>
             <div className="flex items-center gap-3">
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode === 'cute' ? 'bg-white text-pink-500' : 'bg-blue-600 text-white'}`}>
                 <Bot size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-white text-sm">学习助手</h3>
                 <div className="text-[10px] text-white/70 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                   Online
                 </div>
               </div>
             </div>
             <button onClick={() => setMessages([])} className="text-xs text-white/60 hover:text-white underline">
               清空
             </button>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${mode === 'cute' ? 'bg-pink-50/50' : 'bg-slate-50'}`}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' 
                    ? (mode === 'cute' ? 'bg-sky-100 text-sky-500' : 'bg-indigo-100 text-indigo-600')
                    : (mode === 'cute' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-600')
                }`}>
                  {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
                </div>
                <div 
                  className={`max-w-[80%] p-3.5 text-sm shadow-sm leading-relaxed ${mode === 'cute' ? 'rounded-2xl' : 'rounded-2xl'}
                  ${msg.role === 'user' 
                    ? (mode === 'cute' ? 'bg-sky-400 text-white rounded-tr-none' : 'bg-indigo-600 text-white rounded-tr-none') 
                    : (mode === 'cute' ? 'bg-white text-slate-600 border border-pink-100 rounded-tl-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none')}
                   prose prose-sm ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}
                >
                   {msg.role === 'model' ? (
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                   ) : msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-100"><Bot size={16}/></div>
                <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className={`animate-spin ${mode === 'cute' ? 'text-pink-400' : 'text-blue-500'}`} />
                  <span className="text-xs text-slate-400">正在思考...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {!isLoading && (
             <div className={`px-4 pb-2 pt-2 overflow-x-auto flex gap-2 no-scrollbar ${mode === 'cute' ? 'bg-pink-50/50' : 'bg-slate-50'}`}>
               {SUGGESTED_QUESTIONS[currentMode]?.map((q, i) => (
                 <button 
                   key={i}
                   onClick={() => handleSend(q)}
                   className={`whitespace-nowrap px-3 py-1.5 text-xs transition-colors shadow-sm border ${
                     mode === 'cute' 
                       ? 'bg-white border-pink-100 text-pink-500 hover:bg-pink-50 rounded-full' 
                       : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50 rounded-full'
                   }`}
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
                 className={`flex-1 pl-4 pr-10 py-3 outline-none text-sm transition-all placeholder:text-slate-400 ${
                   mode === 'cute' 
                     ? 'bg-pink-50 border-2 border-transparent focus:border-pink-200 rounded-full text-slate-600' 
                     : 'bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 rounded-xl text-slate-800'
                 }`}
               />
               <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className={`p-3 text-white transition-colors shadow-md disabled:opacity-50 ${
                  mode === 'cute' 
                   ? 'bg-pink-400 hover:bg-pink-500 rounded-full shadow-pink-200' 
                   : 'bg-blue-600 hover:bg-blue-700 rounded-xl shadow-blue-200'
                }`}
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