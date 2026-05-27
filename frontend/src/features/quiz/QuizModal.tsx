import React, { useState } from 'react';
import { Quiz } from '../../types';
import { Icons } from '../../components/icons';

type QuizModalProps = {
  quiz: Quiz;
  onClose: () => void;
  onPass: () => void;
  onComplete: (result: { score: number; total: number; passed: boolean }) => void;
};

export const QuizModal: React.FC<QuizModalProps> = ({ quiz, onClose, onPass, onComplete }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQ = quiz.questions[currentQuestionIdx];

  const handleAnswer = (optionIdx: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIdx);
    setIsAnswered(true);
    if (optionIdx === currentQ.correctAnswerIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const passed = score >= Math.ceil(quiz.questions.length * 0.7);
  const finalize = () => onComplete({ score, total: quiz.questions.length, passed });

  if (showResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-200">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${passed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
            {passed ? <Icons.Award className="w-8 h-8" /> : <Icons.RefreshCw className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold mb-2">{passed ? 'Module Complete!' : 'Try Again'}</h2>
          <p className="text-slate-600 mb-6">
            You scored {score} out of {quiz.questions.length}. {passed ? 'Great job mastering this section.' : 'Review the material and try again to unlock the next step.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { finalize(); onClose(); }} className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium">Close</button>
            {passed ? (
              <button onClick={() => { finalize(); onPass(); }} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium">Continue Learning</button>
            ) : (
              <button onClick={() => { finalize(); onClose(); }} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium">Review Lesson</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Knowledge Check</h3>
            <p className="text-sm text-slate-500">Question {currentQuestionIdx + 1} of {quiz.questions.length}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-lg font-medium text-slate-900 mb-6">{currentQ.question}</p>
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              let style = 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50';
              if (isAnswered) {
                if (idx === currentQ.correctAnswerIndex) style = 'border-green-500 bg-green-50 text-green-900';
                else if (idx === selectedOption) style = 'border-red-500 bg-red-50 text-red-900';
                else style = 'border-slate-100 opacity-50';
              } else if (idx === selectedOption) {
                style = 'border-indigo-600 bg-indigo-50';
              }

              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={isAnswered} className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${style}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isAnswered && idx === currentQ.correctAnswerIndex ? 'border-green-600 bg-green-600 text-white' : 'border-current'}`}>
                      {isAnswered && idx === currentQ.correctAnswerIndex ? <Icons.CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{String.fromCharCode(65 + idx)}</span>}
                    </div>
                    <span>{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
              <span className="font-bold">Explanation: </span>
              {currentQ.explanation}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={handleNext} disabled={!isAnswered} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {currentQuestionIdx === quiz.questions.length - 1 ? 'Finish' : 'Next Question'}
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
