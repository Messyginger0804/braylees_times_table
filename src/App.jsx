import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import MemorizeMode from './MemorizeMode';
import PracticeMode from './PracticeMode';
import TestingMode from './TestingMode';
import LevelIndicator from './LevelIndicator';
import Header from './Header';

function App() {
  const [mode, setMode] = useState(null);
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [level, setLevel] = useState(1);
  const [showContent, setShowContent] = useState(false);
  const [allProblemsMastered, setAllProblemsMastered] = useState(false);

  const resetApp = () => {
    setMode(null);
    setLevel(1);
    setShowContent(false);
    // Re-fetch problems and user level to ensure fresh state
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        setLevel(data.level);
      });
    fetch('/api/problems')
      .then(res => res.json())
      .then(data => {
        setProblems(data);
      });
    Swal.fire({
      title: 'Welcome to your times table flashcards, Braylee!!! 🌈🦄',
      text: 'This will help you learn times tables like your momma and daddy did. 💖',
      confirmButtonText: 'Start Learning! ✨'
    }).then(() => {
      setShowContent(true);
    });
  };

  useEffect(() => {
    resetApp(); // Initial app load
  }, []);

  useEffect(() => {
    let currentLevelProblems = [];
    if (level === 1) {
      currentLevelProblems = problems.filter(p => {
        const [a, b] = p.problem.split(' x ').map(Number);
        return a <= 5 && b <= 5;
      });
    } else {
      currentLevelProblems = problems;
    }
    setFilteredProblems(shuffleArray(currentLevelProblems));
    setAllProblemsMastered(currentLevelProblems.every(p => p.mastered));
  }, [level, problems]);

  const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const handleLevelUp = async () => {
    await fetch('/api/user/level', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 2 })
    });
    setLevel(2);
    setMode(null); // Go back to mode selection
  };

  if (!showContent) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-200 to-purple-200"></div>;
  }

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-200 relative">
        <Header onReset={resetApp} />
        <div className="flex flex-col items-center justify-center text-center p-4">
          <LevelIndicator level={level} />
          <h1 className="text-4xl md:text-6xl font-gochi-hand text-pink-500 mb-8">Choose Your Mode ✨</h1>
          <div className="flex flex-col md:flex-row">
            <button onClick={() => setMode('memorize')} className="px-8 py-4 text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500 mb-4 md:mb-0 md:mr-4">Memorize Mode 🧠💖</button>
            <button onClick={() => setMode('practice')} className="px-8 py-4 text-2xl rounded-lg cursor-pointer bg-teal-400 text-white border-none hover:bg-teal-500 mb-4 md:mb-0 md:mr-4">Practice Mode ✏️✨</button>
            <button onClick={() => setMode('testing')} className={`px-8 py-4 text-2xl rounded-lg cursor-pointer bg-purple-400 text-white border-none hover:bg-purple-500`}>Testing Mode 🧪🌟</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'memorize') {
    return <MemorizeMode problems={filteredProblems} level={level} onReset={resetApp} />;
  }

  if (mode === 'practice') {
    return <PracticeMode problems={filteredProblems} level={level} onReset={resetApp} />;
  }

  if (mode === 'testing') {
    return <TestingMode problems={filteredProblems} level={level} onLevelUp={handleLevelUp} onReset={resetApp} />;
  }

  return null;
}

export default App;
