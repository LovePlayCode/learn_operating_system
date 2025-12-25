
export enum MemoryMode {
  SEGMENTATION = 'segmentation',
  PAGING = 'paging',
  MULTI_LEVEL = 'multi_level',
  INVERTED = 'inverted_paging',
  SEGMENTED_PAGING = 'segmented_paging',
  SWAPPING = 'swapping', // New
  COW = 'cow', // New
  PROCESS = 'process_management',
  CONCURRENCY = 'concurrency_sync',
  FILE_SYSTEM = 'file_system',
}

export interface Segment {
  id: number;
  base: number;
  limit: number;
  name: string;
  color: string;
}

export interface PageTableEntry {
  pageNumber: number;
  frameNumber: number;
  valid: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// Process Management Types
export enum ProcessState {
  NEW = 'NEW',
  READY = 'READY',
  RUNNING = 'RUNNING',
  BLOCKED = 'BLOCKED',
  TERMINATED = 'TERMINATED'
}

export interface Process {
  id: number;
  name: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  priority: number;
  state: ProcessState;
  color: string;
  startTime: number | null;
  completionTime: number | null;
  tickets: number; // For Lottery Scheduling
}

export enum AlgorithmType {
  FIFO = 'FIFO',
  RR = 'RR',
  MLFQ = 'MLFQ',
  SJF = 'SJF',       // Shortest Job First
  SRTF = 'SRTF',     // Shortest Remaining Time First
  LOTTERY = 'LOTTERY' // Proportional Share
}

export interface TimeSlice {
  processId: number | null;
  startTime: number;
  endTime: number;
  color: string;
  // Contextual info for tooltips
  priority?: number; 
  tickets?: number;
}

// Concurrency Types
export interface Semaphore {
  name: string;
  value: number;
  queue: string[]; // List of waiting thread names
}

// File System Types
export type AllocationMethod = 'contiguous' | 'linked' | 'indexed';

export interface FileEntry {
  name: string;
  size: number; // in blocks
  startBlock: number;
  color: string;
  blocks: number[];
}

export interface FDTableEntry {
  fd: number;
  fileTableIdx: number;
}

export interface OpenFileTableEntry {
  idx: number;
  inodeIdx: number;
  offset: number;
  mode: 'r' | 'w' | 'rw';
  refCount: number;
}

// --- New Types for Swapping ---
export interface FrameState {
  id: number;
  pageId: number | null;
  refBit: boolean; // For Clock Algorithm
  timestamp: number; // For LRU
  insertedAt: number; // For FIFO
}
