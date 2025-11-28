export enum MemoryMode {
  SEGMENTATION = 'segmentation',
  PAGING = 'paging',
  MULTI_LEVEL = 'multi_level',
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
