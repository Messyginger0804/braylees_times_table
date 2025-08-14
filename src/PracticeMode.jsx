import { useState } from 'react';
import Swal from 'sweetalert2';
import LevelIndicator from './LevelIndicator';
import Header from './Header';

function PracticeMode({ problems, level, onReset }) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setUserAnswer('');
    setCurrentCardIndex((currentCardIndex + 1) % problems.length);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentCard = problems[currentCardIndex];
    const isCorrect = parseInt(userAnswer) === currentCard.answer;

    setIsFlipped(true); // Flip the card immediately

    setTimeout(() => {
      if (isCorrect) {
        Swal.fire('Correct!', '', 'success');
      } else {
        Swal.fire('Incorrect', `The correct answer is ${currentCard.answer}`, 'error');
      }
    }, 600); // Delay the alert to allow flip animation
  };

  if (problems.length === 0) {
    return <div>Loading...</div>;
  }

  const currentCard = problems[currentCardIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 relative">
      <Header onReset={onReset} />
      <div className="flex flex-col items-center justify-center text-center p-4">
        <LevelIndicator level={level} />
        <h1 className="text-4xl md:text-6xl font-gochi-hand text-pink-500 mb-8">Practice Mode</h1>
        <div className="w-64 h-40 md:w-72 md:h-48 [perspective:1000px] cursor-pointer mb-8" onClick={handleCardClick}>
          <div className={`relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] shadow-lg ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center text-3xl md:text-4xl rounded-lg bg-teal-300 text-white">
              <p>{currentCard.problem}</p>
            </div>
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center text-3xl md:text-4xl rounded-lg bg-green-500 text-white [transform:rotateY(180deg)]">
              <p>{currentCard.answer}</p>
            </div>
          </div>
        </div>
        <button onClick={handleNextCard} className="px-6 py-3 md:px-8 md:py-4 text-xl md:text-2xl rounded-lg cursor-pointer bg-purple-400 text-white border-none hover:bg-purple-500 mb-4">Next</button>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center">
          <input type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="text-xl md:text-2xl p-2 rounded-lg mb-4 md:mb-0 md:mr-4 placeholder-gray-500 border-4 border-pink-300 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50" placeholder="Your answer" />
          <button type="submit" className="px-6 py-3 md:px-8 md:py-4 text-xl md:text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500">Check Answer</button>
        </form>
      </div>
    </div>
  );
}

export default PracticeMode;
