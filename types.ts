
export enum MemoryMode {
  SEGMENTATION = 'segmentation',
  PAGING = 'paging',
  MULTI_LEVEL = 'multi_level',
  INVERTED = 'inverted_paging',
  SEGMENTED_PAGING = 'segmented_paging',
  PROCESS = 'process_management',
}

export interface Segment {
  id: number;
  base: number;
  limit: number;
  name: string; // e.g., "Code", "Stack", "Heap"
  color: string;
}

export interface PageTableEntry {
  pageNumber: number;
  frameNumber: number;
  valid: boolean;
}

export interface MultiLevelPTE {
  index: number;
  frameNumber: number | null; // Null if points to next table or invalid
  nextTableId?: string;
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
  priority: number; // 0 is highest
  state: ProcessState;
  color: string;
  startTime: number | null;
  completionTime: number | null;
}

export enum AlgorithmType {
  FIFO = 'FIFO',
  RR = 'RR',
  MLFQ = 'MLFQ'
}

export interface TimeSlice {
  processId: number | null; // null for idle
  startTime: number;
  endTime: number;
  color: string;
}
