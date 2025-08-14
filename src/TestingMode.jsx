import { useState } from 'react';
import Swal from 'sweetalert2';
import LevelIndicator from './LevelIndicator';
import Header from './Header';

function TestingMode({ problems, level, onLevelUp, onReset }) {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  const restartGame = () => {
    setCurrentProblemIndex(0);
    setScore(0);
    setGameOver(false);
    setUserAnswer('');
    setIsFlipped(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentProblem = problems[currentProblemIndex];
    const isCorrect = parseInt(userAnswer) === currentProblem.answer;

    setIsFlipped(true); // Flip the card immediately

    setTimeout(async () => {
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
          setIsFlipped(false); // Flip back for next problem
        }
      } else {
        Swal.fire('Game Over', `The correct answer was ${currentProblem.answer}. Your score is ${score}.`, 'error');
        setGameOver(true);
      }
      setUserAnswer('');
    }, 600); // Delay the alert to allow flip animation
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-yellow-100 relative">
        <Header onReset={onReset} />
        <div className="flex flex-col items-center justify-center text-center p-4">
          <LevelIndicator level={level} />
          <h1 className="text-4xl md:text-6xl font-gochi-hand text-pink-500 mb-8">Game Over</h1>
          <div className="text-2xl mb-4">Your final score is: {score}</div>
          <button onClick={restartGame} className="px-6 py-3 md:px-8 md:py-4 text-xl md:text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500">Try Again</button>
        </div>
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-yellow-100 relative">
      <Header onReset={onReset} />
      <div className="flex flex-col items-center justify-center text-center p-4">
        <LevelIndicator level={level} />
        <h1 className="text-4xl md:text-6xl font-gochi-hand text-pink-500 mb-8">Testing Mode</h1>
        <div className="text-2xl mb-4">Score: {score}</div>
        <div className="w-64 h-40 md:w-72 md:h-48 [perspective:1000px] cursor-pointer mb-8">
          <div className={`relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] shadow-lg ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center text-3xl md:text-4xl rounded-lg bg-teal-300 text-white">
              <p>{currentProblem.problem}</p>
            </div>
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center text-3xl md:text-4xl rounded-lg bg-green-500 text-white [transform:rotateY(180deg)]">
              <p>{currentProblem.answer}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center">
          <input type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="text-xl md:text-2xl p-2 rounded-lg mb-4 md:mb-0 md:mr-4 placeholder-gray-500 border-4 border-pink-300 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50" placeholder="Your answer" />
          <button type="submit" className="px-6 py-3 md:px-8 md:py-4 text-xl md:text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500">Submit</button>
        </form>
      </div>
    </div>
  );
}

export default TestingMode;