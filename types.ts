export type AnalysisStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface AnalysisResult {
  summary3Lines: string[];
  detailedSummary: string;
}

export interface ProcessingState {
  status: AnalysisStatus;
  message: string;
}

export interface FileData {
  file: File;
  base64: string;
  mimeType: string;
}

export interface AudioInput {
  base64: string;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
