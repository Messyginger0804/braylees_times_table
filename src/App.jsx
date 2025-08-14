import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import LearningMode from './LearningMode';
import TestingMode from './TestingMode';
import LevelIndicator from './LevelIndicator';
import Header from './Header';

function App() {
  const [mode, setMode] = useState(null);
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [level, setLevel] = useState(1);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    Swal.fire({
      title: 'Welcome to your times table flashcards, Braylee!!!',
      text: 'This will help you learn times tables like your momma and daddy did.',
      confirmButtonText: 'Start Learning!'
    }).then(() => {
      setShowContent(true);
    });

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
  }, []);

  useEffect(() => {
    if (level === 1) {
      setFilteredProblems(shuffleArray(problems.filter(p => {
        const [a, b] = p.problem.split(' x ').map(Number);
        return a <= 5 && b <= 5;
      })));
    } else {
      setFilteredProblems(shuffleArray(problems));
    }
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
      <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-200">
        <Header />
        <div className="flex flex-col items-center justify-center">
          <LevelIndicator level={level} />
          <h1 className="text-6xl font-gochi-hand text-pink-500 mb-8">Choose Your Mode</h1>
          <div className="flex">
            <button onClick={() => setMode('learning')} className="px-8 py-4 text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500 mr-4">Learning Mode</button>
            <button onClick={() => setMode('testing')} className="px-8 py-4 text-2xl rounded-lg cursor-pointer bg-teal-400 text-white border-none hover:bg-teal-500">Testing Mode</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'learning') {
    return <LearningMode problems={filteredProblems} level={level} />;
  }

  if (mode === 'testing') {
    return <TestingMode problems={filteredProblems} level={level} onLevelUp={handleLevelUp} />;
  }

  return null;
}

export default App;
