import { useState, useEffect } from 'react';
import { questions, traitNames, traitDescriptions } from '../data/questions';
import ResultsView from '../components/ResultsView';

type Answer = {
  questionId: number;
  value: number;
};

type TestResults = {
  O: number;
  C: number;
  E: number;
  A: number;
  N: number;
};

export default function Home() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);

  const handleAnswer = (value: number) => {
    setSelectedValue(value);
  };

  const handleNext = () => {
    if (selectedValue === null) return;

    const newAnswers = [...answers];
    const existingIndex = newAnswers.findIndex(a => a.questionId === questions[currentQuestion].id);

    if (existingIndex >= 0) {
      newAnswers[existingIndex] = { questionId: questions[currentQuestion].id, value: selectedValue };
    } else {
      newAnswers.push({ questionId: questions[currentQuestion].id, value: selectedValue });
    }

    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      const nextAnswer = newAnswers.find(a => a.questionId === questions[currentQuestion + 1].id);
      setSelectedValue(nextAnswer?.value ?? null);
    } else {
      calculateResults(newAnswers);
      setCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const prevAnswer = answers.find(a => a.questionId === questions[currentQuestion - 1].id);
      setSelectedValue(prevAnswer?.value ?? null);
    }
  };

  const calculateResults = (finalAnswers: Answer[]) => {
    const scores: TestResults = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    const counts: Record<string, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };

    finalAnswers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        const score = question.reverse ? (6 - answer.value) : answer.value;
        scores[question.trait] += score;
        counts[question.trait]++;
      }
    });

    // Normaliser sur 100
    const normalized: TestResults = {
      O: Math.round((scores.O / (counts.O * 5)) * 100),
      C: Math.round((scores.C / (counts.C * 5)) * 100),
      E: Math.round((scores.E / (counts.E * 5)) * 100),
      A: Math.round((scores.A / (counts.A * 5)) * 100),
      N: Math.round((scores.N / (counts.N * 5)) * 100),
    };

    setResults(normalized);
  };

  const restartTest = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedValue(null);
    setCompleted(false);
    setResults(null);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (completed && results) {
    return <ResultsView results={results} onRestart={restartTest} />;
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="container">
      <div className="header">
        <h1>Test Big Five</h1>
        <p>Question {currentQuestion + 1} sur {questions.length}</p>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="question-card">
        <div className="question-text">
          {currentQ.text}
        </div>

        <div className="options">
          {[
            { value: 1, label: "Pas du tout d'accord" },
            { value: 2, label: "Plutôt pas d'accord" },
            { value: 3, label: "Neutre" },
            { value: 4, label: "Plutôt d'accord" },
            { value: 5, label: "Tout à fait d'accord" },
          ].map(option => (
            <button
              key={option.value}
              className={`option-button ${selectedValue === option.value ? 'selected' : ''}`}
              onClick={() => handleAnswer(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="navigation">
        <button
          className="nav-button secondary"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Précédent
        </button>
        <button
          className="nav-button primary"
          onClick={handleNext}
          disabled={selectedValue === null}
        >
          {currentQuestion === questions.length - 1 ? 'Terminer' : 'Suivant'}
        </button>
      </div>
    </div>
  );
}
