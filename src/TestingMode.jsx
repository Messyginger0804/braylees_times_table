import { useState } from 'react';
import Swal from 'sweetalert2';
import LevelIndicator from './LevelIndicator';
import Header from './Header';

function TestingMode({ problems, level, onLevelUp }) {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const restartGame = () => {
    setCurrentProblemIndex(0);
    setScore(0);
    setGameOver(false);
    setUserAnswer('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentProblem = problems[currentProblemIndex];
    const isCorrect = parseInt(userAnswer) === currentProblem.answer;

    if (isCorrect) {
      setScore(score + 1);
      if (currentProblemIndex === problems.length - 1) {
        if (level === 1) {
          await onLevelUp();
          Swal.fire('Congratulations!', 'You passed Level 1!', 'success');
        } else {
          Swal.fire('Congratulations!', 'You got a perfect score!', 'success');
        }
        setGameOver(true);
      } else {
        setCurrentProblemIndex(currentProblemIndex + 1);
      }
    } else {
      Swal.fire('Game Over', `The correct answer was ${currentProblem.answer}. Your score is ${score}.`, 'error');
      setGameOver(true);
    }
    setUserAnswer('');
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-200">
        <Header />
        <div className="flex flex-col items-center justify-center">
          <LevelIndicator level={level} />
          <h1 className="text-6xl font-gochi-hand text-pink-500 mb-8">Game Over</h1>
          <div className="text-2xl mb-4">Your final score is: {score}</div>
          <button onClick={restartGame} className="px-8 py-4 text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500">Try Again</button>
        </div>
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-200">
      <Header />
      <div className="flex flex-col items-center justify-center">
        <LevelIndicator level={level} />
        <h1 className="text-6xl font-gochi-hand text-pink-500 mb-8">Testing Mode</h1>
        <div className="text-2xl mb-4">Score: {score}</div>
        <div className="w-72 h-48 flex items-center justify-center text-4xl rounded-lg bg-teal-300 text-white mb-8">
          <p>{currentProblem.problem}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="text-2xl p-2 rounded-lg mb-4 placeholder-gray-500 border-4 border-pink-300 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50" placeholder="Your answer" />
          <button type="submit" className="px-8 py-4 text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500">Submit</button>
        </form>
      </div>
    </div>
  );
}

export default TestingMode;
