export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  domain: string;
  ecoTask: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswers: string[];
  explanation: string;
  type: 'single' | 'multiple';
}

export interface ExamConfig {
  mode: 'custom' | 'domain' | 'eco' | 'incorrect';
  questionCount: number;
  timeLimit: number;
  selectedDomains?: string[];
  selectedEcoTask?: string;
  excludeCorrect?: boolean;
}
