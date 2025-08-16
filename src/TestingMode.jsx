import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import LevelIndicator from './LevelIndicator';
import Header from './Header';
import { getRandomCelebrateGif, getRandomUpsetGif } from './gifSelector';
import { emoji } from './emoji';
import { triggerFireworks } from './fireworks';
import axios from 'axios';

function TestingMode({ problems, level, onLevelUp, onReset }) {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [last5, setLast5] = useState({ correctCount: 0, totalCount: 0 });
  const [showLast5, setShowLast5] = useState(false);
  const [lastAttemptCorrect, setLastAttemptCorrect] = useState(null);
  const [streak, setStreak] = useState(0);
  const [showStreakToast, setShowStreakToast] = useState(false);
  const [streakToastCount, setStreakToastCount] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const handleGameOver = async () => {
    try {
      await axios.post('/api/test/score', { score });
      const { data: bestScore } = await axios.get('/api/test/best');
      if (score > (bestScore?.score || 0)) {
        setIsNewHighScore(true);
        await axios.post('/api/message/send', { message: `Braylee got a new high score of ${score}!` });
      }
    } catch (error) {
      console.error("Error handling game over:", error);
    }
  };


  const restartGame = () => {
    setCurrentProblemIndex(0);
    setScore(0);
    setGameOver(false);
    setUserAnswer('');
    setIsFlipped(false);
    setShowLast5(false);
  };

  const fetchLast5 = async (problemId) => {
    try {
      const res = await fetch(`/api/problems/${problemId}/last5`);
      const data = await res.json();
      setLast5({ correctCount: data.correctCount || 0, totalCount: data.totalCount || 0 });
      const last = Array.isArray(data.attempts) && data.attempts.length > 0 ? !!data.attempts[0].isCorrect : null;
      setLastAttemptCorrect(last);
    } catch (_) {
      setLast5({ correctCount: 0, totalCount: 0 });
      setLastAttemptCorrect(null);
    }
  };

  useEffect(() => {
    const current = problems[currentProblemIndex];
    if (current) fetchLast5(current.id);
  }, [currentProblemIndex, problems]);

  useEffect(() => {
    setShowLast5(false);
    let id;
    if (!isFlipped) {
      id = setTimeout(() => setShowLast5(true), 3000);
    }
    return () => {
      if (id) clearTimeout(id);
    };
  }, [isFlipped, currentProblemIndex]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentProblem = problems[currentProblemIndex];
    const isCorrect = parseInt(userAnswer) === currentProblem.answer;

    setIsFlipped(true); // Flip the card immediately

    setTimeout(async () => {
      if (isCorrect) {
        // Update and react to streaks
        const nextStreak = streak + 1;
        try {
          if (nextStreak % 5 === 0) {
            // Milestone fireworks for 5-in-a-row streaks
            triggerFireworks({ duration: 2200, particles: 260 });
            setStreakToastCount(nextStreak);
            setShowStreakToast(true);
            setTimeout(() => setShowStreakToast(false), 2200);
          } else {
            // Quick celebratory burst
            triggerFireworks({ duration: 1000, particles: 120 });
          }
        } catch (_) {}
        setStreak(nextStreak);
        // Record correct attempt
        await fetch(`/api/problems/${currentProblem.id}/attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correct: true })
        });
        setScore(score + 2);
        // Brief celebrate on each correct answer
        await Swal.fire({
          title: `Correct! ${emoji.party()}${emoji.heart()}`,
          imageUrl: getRandomCelebrateGif(),
          imageAlt: 'Celebrate',
          showConfirmButton: false,
          timer: 3000,
          background: 'transparent',
        });

        if (currentProblemIndex === problems.length - 1) {
          if (level === 1) {
            await onLevelUp();
            try { triggerFireworks({ duration: 2200, particles: 260 }); } catch (_) {}
            await Swal.fire({
              title: `Congratulations! You passed Level 1! ${emoji.party()}${emoji.heart()}`,
              imageUrl: getRandomCelebrateGif(),
              imageAlt: 'Celebrate',
              showConfirmButton: true,
            });
          } else {
            try { triggerFireworks({ duration: 2200, particles: 260 }); } catch (_) {}
            await Swal.fire({
              title: `Congratulations! Perfect score! ${emoji.party()}${emoji.heart()}`,
              imageUrl: getRandomCelebrateGif(),
              imageAlt: 'Celebrate',
              showConfirmButton: true,
            });
          }
          setGameOver(true);
          handleGameOver();
        } else {
          setCurrentProblemIndex(currentProblemIndex + 1);
          setIsFlipped(false); // Flip back for next problem
        }
      } else {
        setStreak(0);
        // Record incorrect attempt
        await fetch(`/api/problems/${currentProblem.id}/attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correct: false })
        });
        await Swal.fire({
          title: `Game Over ${emoji.encourage()}`,
          text: `The correct answer was ${currentProblem.answer}. Your score is ${score}. Want to try again? ${emoji.retry()}`,
          imageUrl: getRandomUpsetGif(),
          imageAlt: 'Try again',
          showConfirmButton: false,
          timer: 3000,
          background: 'transparent',
        });
        setGameOver(true);
        handleGameOver();
      }
      setUserAnswer('');
      // Refresh last-5 summary for this problem
      fetchLast5(currentProblem.id);
    }, 600); // Delay the alert to allow flip animation
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-yellow-100 relative">
        <Header onReset={onReset} />
        <div className="flex flex-col items-center justify-center text-center p-4">
          <LevelIndicator level={level} />
          <h1 className="text-4xl md:text-6xl font-gochi-hand text-pink-500 mb-8">Game Over</h1>
          {isNewHighScore && <div className="text-2xl mb-4">New High Score!</div>}
          <div className="text-2xl mb-4">Your final score is: {score}</div>
          <button onClick={restartGame} className="px-6 py-3 md:px-8 md:py-4 text-xl md:text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500">Try Again {emoji.retry()}</button>
        </div>
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-yellow-100 relative">
      <Header onReset={onReset} />
      <div className="flex flex-col items-center justify-center text-center p-4">
        {showStreakToast && (
          <div className="absolute top-4 right-4 z-50 bg-pink-500 text-white text-lg md:text-xl font-bold px-4 py-2 rounded-full shadow-lg pop-in">
            🔥 {streakToastCount} in a row! 🎉
          </div>
        )}
        <LevelIndicator level={level} />
        <h1 className="text-4xl md:text-6xl font-gochi-hand text-pink-500 mb-8">Testing Mode 🧪🌟</h1>
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
        {showLast5 && last5.totalCount > 0 && last5.correctCount > 1 && (
          <div className="mb-4 text-lg text-gray-700 wave-in">
            You have answered this right {last5.correctCount} out of the last {Math.min(5, last5.totalCount || 0)} times. {emoji.heart()}
          </div>
        )}
        {showLast5 && last5.totalCount > 0 && (
          <div className="mb-4 text-lg text-gray-700 wave-in">
            {lastAttemptCorrect === true
              ? <>You answered this right last time — you got this! ✅ {emoji.heart()} {emoji.party()}</>
              : lastAttemptCorrect === false
              ? <>Last time was tricky — you got this! {emoji.encourage()} {emoji.heart()}</>
              : ''}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center">
          <input type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="text-xl md:text-2xl p-2 rounded-lg mb-4 md:mb-0 md:mr-4 placeholder-gray-500 border-4 border-pink-300 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50" placeholder="Your answer" />
          <button type="submit" className="px-6 py-3 md:px-8 md:py-4 text-xl md:text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500">Submit {emoji.check()}</button>
        </form>
      </div>
    </div>
  );
}

export default TestingMode;
