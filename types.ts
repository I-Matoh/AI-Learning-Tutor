export interface Lesson {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isLocked: boolean;
  content?: string; // Markdown content
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  createdAt: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}
