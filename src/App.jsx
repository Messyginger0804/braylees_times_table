import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import MemorizeMode from './MemorizeMode';
import PracticeMode from './PracticeMode';
import TestingMode from './TestingMode';
import LevelIndicator from './LevelIndicator';
import Header from './Header';
import { useUser } from './UserContext';
import axios from 'axios';

function App() {
  const { user, login, register, logout, loading } = useUser();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [allProblemsMastered, setAllProblemsMastered] = useState(false);

  useEffect(() => {
    if (user) {
      fetch('/api/problems')
        .then(res => res.json())
        .then(data => {
          setProblems(data);
        });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let currentLevelProblems = [];
    if (user.level === 1) {
      currentLevelProblems = problems.filter(p => {
        const [a, b] = p.problem.split(' x ').map(Number);
        return a <= 5 && b <= 5;
      });
    } else {
      currentLevelProblems = problems;
    }
    setFilteredProblems(shuffleArray(currentLevelProblems));
    setAllProblemsMastered(currentLevelProblems.every(p => p.mastered));
  }, [user, problems]);

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
    // TODO: update user level on server
    setMode(null); // Go back to mode selection
  };

  const resetGame = () => {
    setMode(null);
    if (user) {
      fetch('/api/problems')
        .then(res => res.json())
        .then(data => {
          setProblems(data);
        });
    }
  }

  if (loading) return <div className="p-6 text-xl">Loading…</div>;

  if (!user) {
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
      try {
        if (isRegistering) {
          await register(name, pin);
        } else {
          await login(name, pin);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'An error occurred.');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-200 flex flex-col items-center justify-center p-4">
        <div className="p-6 bg-white bg-opacity-50 rounded-lg shadow-lg flex flex-col items-center gap-4">
          <h1 className="text-4xl font-gochi-hand text-pink-500">{isRegistering ? 'Create an Account 🦄' : 'Who’s playing? 💖'}</h1>
          {error && <p className="text-red-500">{error}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
            <input
              className="border rounded px-3 py-2"
              placeholder="Type your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="password"
              className="border rounded px-3 py-2"
              placeholder="Type your 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength="4"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-purple-500 text-white font-gochi-hand text-2xl hover:bg-purple-600"
            >
              {isRegistering ? 'Create Account ✨' : 'Start Game 🚀'}
            </button>
          </form>
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-sm text-purple-500 hover:underline"
          >
            {isRegistering ? 'Already have an account? Login' : 'Create a new account'}
          </button>
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-200 relative">
        <Header onReset={resetGame} userName={user.name} userImage={user.image} />
        <div className="flex flex-col items-center justify-center text-center p-4">
          <LevelIndicator level={user.level} />
          <h1 className="text-4xl md:text-6xl font-gochi-hand text-pink-500 mb-8">Choose Your Mode ✨</h1>
          <div className="flex flex-col md:flex-row">
            <button onClick={() => setMode('memorize')} className="px-8 py-4 text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500 mb-4 md:mb-0 md:mr-4">Memorize Mode 🧠💖</button>
            <button onClick={() => setMode('practice')} className="px-8 py-4 text-2xl rounded-lg cursor-pointer bg-teal-400 text-white border-none hover:bg-teal-500 mb-4 md:mb-0 md:mr-4">Practice Mode ✏️✨</button>
            <button onClick={() => setMode('testing')} className={`px-8 py-4 text-2xl rounded-lg cursor-pointer bg-purple-400 text-white border-none hover:bg-purple-500`}>Testing Mode 🧪🌟</button>
          </div>
        </div>
        <button onClick={logout} className="absolute bottom-4 left-4 px-6 py-2 text-lg rounded-lg cursor-pointer bg-red-500 text-white border-none hover:bg-red-600">Logout</button>
      </div>
    );
  }

  if (mode === 'memorize') {
    return <MemorizeMode problems={filteredProblems} level={user.level} onReset={resetGame} />;
  }

  if (mode === 'practice') {
    return <PracticeMode problems={filteredProblems} level={user.level} onReset={resetGame} />;
  }

  if (mode === 'testing') {
    return <TestingMode problems={filteredProblems} level={user.level} onLevelUp={handleLevelUp} onReset={resetGame} />;
  }

  return null;
}

export default App;