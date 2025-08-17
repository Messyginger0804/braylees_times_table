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
  const { user, login, register, logout, loading, updateLevel } = useUser();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [allProblemsMastered, setAllProblemsMastered] = useState(false);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [attemptSummaries, setAttemptSummaries] = useState({});
  const [userProgress, setUserProgress] = useState({}); // { [problemId]: true }

  console.log('App render: user', user, 'loading (UserContext)', loading, 'problemsLoading', problemsLoading);

  const shuffleArray = (array) => {
    const newArray = [...array];
    let currentIndex = newArray.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [newArray[currentIndex], newArray[randomIndex]] = [
        newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
  };

  const fetchProblems = () => {
    console.log('App: Manually fetching problems...');
    setProblemsLoading(true);
    axios.get('/api/problems')
      .then(res => {
        console.log('App: Manually fetched problems successfully:', res.data.length, 'problems');
        setProblems(res.data);
      })
      .catch(err => {
        console.error('App: Error manually fetching problems:', err);
      })
      .finally(() => {
        console.log('App: Manually problems fetch finished. Setting problemsLoading to false.');
        setProblemsLoading(false);
      });
  };

  const fetchAllAttemptSummaries = () => {
    if (!user) return;
    console.log('App: Fetching all attempt summaries...');
    axios.get('/api/attempts/last5', { withCredentials: true })
      .then(res => {
        setAttemptSummaries(res.data?.summaries || {});
        console.log('App: Attempt summaries loaded for keys:', Object.keys(res.data?.summaries || {}).length);
      })
      .catch(err => {
        console.error('App: Failed fetching attempt summaries', err.response?.status || err.message);
        setAttemptSummaries({});
      });
  };

  const fetchProgressSummary = () => {
    if (!user) return;
    console.log('App: Fetching progress summary...');
    axios.get('/api/progress/summary', { withCredentials: true })
      .then(res => {
        const ids = res.data?.problemIds || [];
        const map = {};
        ids.forEach(id => { map[id] = true; });
        setUserProgress(map);
        console.log('App: Progress summary loaded with', ids.length, 'completed problems');
      })
      .catch(err => {
        console.error('App: Failed fetching progress summary', err.response?.status || err.message);
        setUserProgress({});
      });
  };

  useEffect(() => {
    if (user) {
      console.log('App useEffect [user]: User detected. Calling fetchProblems()...');
      fetchProblems();
      fetchAllAttemptSummaries();
      fetchProgressSummary();
    } else {
      console.log('App useEffect [user]: No user, resetting problemsLoading.');
      setProblemsLoading(true); // Reset for next login
      setAttemptSummaries({});
      setUserProgress({});
    }
  }, [user]);

  useEffect(() => {
    console.log('App useEffect [user, problems]: Filtering problems. Problems length:', problems.length);
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
    console.log('App useEffect [user, problems]: Filtered problems length:', currentLevelProblems.length);
    setFilteredProblems(shuffleArray(currentLevelProblems));
    setAllProblemsMastered(currentLevelProblems.every(p => p.mastered));
  }, [user, problems]);

  const handleLevelUp = async () => {
    try {
      if (user?.level === 1) {
        await updateLevel(2);
      }
    } catch (e) {
      console.error('Failed to level up', e);
    } finally {
      setMode(null);
      fetchProblems();
    }
  };

  const resetGame = () => {
    setMode(null);
    if (user) {
      fetchProblems(); // Call fetchProblems on reset as well
      fetchAllAttemptSummaries();
      fetchProgressSummary();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-200 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-gochi-hand text-white">Loading... 💖</h1>
      </div>
    );
  }

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
        // After successful login/register, explicitly fetch problems
        fetchProblems();
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'An error occurred.';
        setError(errorMessage);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: errorMessage,
          confirmButtonColor: '#a855f7', // purple-500
        });
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

  if (problemsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-200 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-gochi-hand text-white">Loading Problems... 💖</h1>
      </div>
    );
  }

  if (!mode) {
    const totalCount = filteredProblems.length;
    const completedCount = filteredProblems.filter(p => userProgress[p.id]).length;
    const canUseTesting = totalCount > 0 && completedCount === totalCount;
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-200 relative">
        <Header onReset={resetGame} userName={user.name} userImage={user.image} />
        <div className="flex flex-col items-center justify-center text-center p-4">
          <LevelIndicator level={user.level} />
          <h1 className="text-4xl md:text-6xl font-gochi-hand text-pink-500 mb-8">Choose Your Mode ✨</h1>
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <button onClick={() => setMode('memorize')} className="px-8 py-4 text-2xl rounded-lg cursor-pointer bg-pink-400 text-white border-none hover:bg-pink-500 mb-4 md:mb-0 md:mr-4">Memorize Mode 🧠💖</button>
            <button onClick={() => setMode('practice')} className="px-8 py-4 text-2xl rounded-lg cursor-pointer bg-teal-400 text-white border-none hover:bg-teal-500 mb-4 md:mb-0 md:mr-4">Practice Mode ✏️✨</button>
            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  if (canUseTesting) setMode('testing');
                  else Swal.fire({
                    icon: 'info',
                    title: 'Keep Practicing ✨',
                    text: 'Answer every problem in this level at least once in Practice Mode to unlock Testing Mode.',
                    confirmButtonColor: '#a855f7',
                  });
                }}
                className={`px-8 py-4 text-2xl rounded-lg border-none mb-1 ${canUseTesting ? 'cursor-pointer bg-purple-400 text-white hover:bg-purple-500' : 'cursor-not-allowed bg-purple-300 text-white/70'}`}
              >
                Testing Mode 🧪🌟
              </button>
              <div className="text-sm mt-1 text-purple-900/80 text-center">
                {canUseTesting
                  ? `All ${totalCount} completed — Testing unlocked!`
                  : `Completed ${completedCount} / ${totalCount} to unlock Testing`}
              </div>
            </div>
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
    return <PracticeMode problems={filteredProblems} level={user.level} onReset={resetGame} attemptSummaries={attemptSummaries} setAttemptSummaries={setAttemptSummaries} userProgress={userProgress} setUserProgress={setUserProgress} />;
  }

  if (mode === 'testing') {
    return <TestingMode problems={filteredProblems} level={user.level} onLevelUp={handleLevelUp} onReset={resetGame} attemptSummaries={attemptSummaries} setAttemptSummaries={setAttemptSummaries} userProgress={userProgress} />;
  }

  return null;
}

export default App;
