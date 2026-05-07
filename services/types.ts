export interface QuestionOption {
  id: string;
  text: string;
}

export type QuestionType = 'single' | 'multiple' | 'drag_drop' | 'hotspot' | 'matching' | 'case_set' | 'fill_blank';

export interface Question {
  id: string;
  domain: string;
  ecoTask: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswers: string[];
  explanation: string;
  type: QuestionType;
  mediaUrl?: string; // Hỗ trợ lưu trữ link hình ảnh (cho hotspot, case_set)
  interactiveData?: any; // Lưu trữ tọa độ hotspot hoặc các cặp nối (matching)
}

export interface ExamConfig {
  mode: 'custom' | 'domain' | 'eco' | 'incorrect' | 'retake';
  questionCount: number;
  timeLimit: number;
  selectedDomains?: string[];
  selectedEcoTask?: string;
  excludeCorrect?: boolean;
}
