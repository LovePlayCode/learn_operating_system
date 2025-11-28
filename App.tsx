
import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, FileDigit, Cpu, BookOpen, ToggleLeft, ToggleRight, Palette, Sparkles, Fingerprint, LayoutList, Activity } from 'lucide-react';
import { SegmentationView } from './components/SegmentationView';
import { PagingView } from './components/PagingView';
import { MultiLevelPagingView } from './components/MultiLevelPagingView';
import { InvertedPagingView } from './components/InvertedPagingView';
import { SegmentedPagingView } from './components/SegmentedPagingView';
import { ProcessView } from './components/ProcessView';
import { AITutor } from './components/AITutor';
import { MemoryMode } from './types';
import { ThemeProvider, useTheme } from './hooks/useTheme';

const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const { styles } = useTheme();
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm mb-1 ${
          isActive 
            ? styles.sidebarItem.active
            : styles.sidebarItem.inactive
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
};

const Header = ({ title, subtitle }: { title: string, subtitle: string }) => {
  const { styles, mode, toggleTheme } = useTheme();
  
  return (
    <header className={`px-8 py-5 flex items-center justify-between shrink-0 z-10 ${mode === 'modern' ? 'bg-white border-b border-slate-200' : 'bg-white/80 border-b-2 border-pink-100 backdrop-blur-sm'}`}>
      <div>
        <h2 className={`text-xl font-bold ${styles.text.primary}`}>{title}</h2>
        <p className={`text-sm mt-1 ${styles.text.secondary}`}>{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            mode === 'modern' 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-pink-100 text-pink-500 hover:bg-pink-200 shadow-sm'
          }`}
        >
          <Palette size={14} />
          {mode === 'modern' ? '严肃模式' : '可爱模式'}
          {mode === 'modern' ? <ToggleLeft size={20}/> : <ToggleRight size={20}/>}
        </button>
        
        <div className={`flex items-center gap-2 text-sm ${styles.text.secondary}`}>
          <Cpu size={16} />
          <span className="font-mono">OS Kernel v2.1</span>
        </div>
      </div>
    </header>
  );
};

const ContentWrapper = () => {
  const location = useLocation();
  const { styles, mode } = useTheme();

  let currentMode = MemoryMode.SEGMENTATION;
  let title = "段式存储管理";
  let subtitle = "Segmentation Logic";
  let contextDesc = "用户正在查看段式存储模拟。包含段表、基址、界限寄存器逻辑。";
  
  if (location.pathname === '/paging') {
    currentMode = MemoryMode.PAGING;
    title = "页式存储管理";
    subtitle = "Paging Mechanism";
    contextDesc = "用户正在查看页式存储模拟。包含页表、VPN到PFN转换。";
  } else if (location.pathname === '/multi-level') {
    currentMode = MemoryMode.MULTI_LEVEL;
    title = "多级页表";
    subtitle = "Multi-Level Page Tables";
    contextDesc = "用户正在查看多级页表模拟。演示了页目录和二级页表结构。";
  } else if (location.pathname === '/inverted') {
    currentMode = MemoryMode.INVERTED;
    title = "反转页表";
    subtitle = "Inverted Page Table (Hash)";
    contextDesc = "用户正在查看反转页表模拟。演示了基于哈希的全局页表和冲突链查找。";
  } else if (location.pathname === '/segmented-paging') {
    currentMode = MemoryMode.SEGMENTED_PAGING;
    title = "段页式存储";
    subtitle = "Segmented Paging";
    contextDesc = "用户正在查看段页式存储模拟。演示了先分段再分页的二级查找过程。";
  } else if (location.pathname === '/process') {
    currentMode = MemoryMode.PROCESS;
    title = "进程管理";
    subtitle = "Process Scheduling & States";
    contextDesc = "用户正在查看进程管理模拟。包含进程状态流转（生命周期）和调度算法（FIFO/RR/MLFQ）。";
  }

  return (
    <div className={`flex h-screen ${styles.font} ${styles.bg}`}>
      {/* Sidebar */}
      <aside className={`w-72 flex flex-col shrink-0 z-20 transition-colors duration-300 ${styles.sidebar}`}>
        <div className={`p-6 ${mode === 'modern' ? 'border-b border-slate-800' : 'border-b-2 border-pink-100'}`}>
          <div className={`flex items-center gap-3 ${mode === 'modern' ? 'text-white' : 'text-slate-800'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              mode === 'modern' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-pink-400 text-white'
            }`}>
              {mode === 'modern' ? <Cpu size={24} /> : <Sparkles size={24} />}
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">OS Explorer</h1>
              <div className={`text-xs font-medium ${mode === 'modern' ? 'text-slate-400' : 'text-pink-400'}`}>Memory Labs</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className={`text-xs font-bold px-4 mb-3 uppercase tracking-wider mt-4 ${styles.text.secondary}`}>
            Memory Management
          </div>
          <NavItem to="/" icon={Layers} label="段式存储" />
          <NavItem to="/paging" icon={FileDigit} label="页式存储" />
          <NavItem to="/multi-level" icon={LayoutDashboard} label="多级页表" />
          <NavItem to="/inverted" icon={Fingerprint} label="反转页表" />
          <NavItem to="/segmented-paging" icon={LayoutList} label="段页式存储" />

          <div className={`text-xs font-bold px-4 mb-3 uppercase tracking-wider mt-8 ${styles.text.secondary}`}>
            Process Management
          </div>
          <NavItem to="/process" icon={Activity} label="进程调度 & 状态" />
          
          <div className={`mt-8 mx-4 p-4 rounded-xl border ${
            mode === 'modern' 
              ? 'bg-slate-800/50 border-slate-700/50' 
              : 'bg-pink-50/50 border-pink-100'
          }`}>
            <div className="flex items-start gap-3">
              <BookOpen className={`shrink-0 mt-1 ${mode === 'modern' ? 'text-blue-400' : 'text-pink-400'}`} size={16} />
              <div>
                <h4 className={`text-sm font-semibold mb-1 ${mode === 'modern' ? 'text-slate-200' : 'text-slate-700'}`}>学习提示</h4>
                <p className={`text-xs leading-relaxed ${mode === 'modern' ? 'text-slate-400' : 'text-slate-500'}`}>
                  点击左上角切换按钮可以更换 UI 风格！尝试修改参数观察地址变换。
                </p>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header title={title} subtitle={subtitle} />

        <div className="flex-1 overflow-hidden relative">
           <Routes>
             <Route path="/" element={<SegmentationView />} />
             <Route path="/paging" element={<PagingView />} />
             <Route path="/multi-level" element={<MultiLevelPagingView />} />
             <Route path="/inverted" element={<InvertedPagingView />} />
             <Route path="/segmented-paging" element={<SegmentedPagingView />} />
             <Route path="/process" element={<ProcessView />} />
           </Routes>
        </div>

        <AITutor currentMode={currentMode} contextDescription={contextDesc} />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <ContentWrapper />
      </ThemeProvider>
    </Router>
  );
};

export default App;
