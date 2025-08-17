import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const UserCtx = createContext(null);
export const useUser = () => useContext(UserCtx);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('UserContext: Fetching /api/auth/me...');
    axios.get('/api/auth/me', { withCredentials: true })
      .then(r => {
        console.log('UserContext: /api/auth/me success. User:', r.data);
        setUser(r.data);
      })
      .catch((err) => {
        console.log('UserContext: /api/auth/me failed.', err.response?.status);
        setUser(null); // Ensure user is null on error
      })
      .finally(() => {
        console.log('UserContext: /api/auth/me finished. Setting loading to false.');
        setLoading(false);
      });
  }, []);

  const login = async (name, pin) => {
    try {
      const { data } = await axios.post('/api/auth/login', { name, pin }, { withCredentials: true });
      console.log('UserContext: Login success. User:', data);
      setUser(data);
      return data; // Return user data for potential use in App.jsx
    } catch (error) {
      console.error('UserContext: Login failed.', error.response?.data?.error || error.message);
      throw error; // Re-throw to be caught by App.jsx
    }
  };

  const register = async (name, pin) => {
    try {
      const { data } = await axios.post('/api/auth/register', { name, pin }, { withCredentials: true });
      console.log('UserContext: Register success. User:', data);
      setUser(data);
      return data; // Return user data for potential use in App.jsx
    } catch (error) {
      console.error('UserContext: Register failed.', error.response?.data?.error || error.message);
      throw error; // Re-throw to be caught by App.jsx
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      console.log('UserContext: Logout success.');
      setUser(null);
    } catch (error) {
      console.error('UserContext: Logout failed.', error.response?.data?.error || error.message);
      throw error; // Re-throw to be caught by App.jsx
    }
  };

  const updateLevel = async (level) => {
    try {
      const { data } = await axios.post('/api/users/level', { level }, { withCredentials: true });
      console.log('UserContext: Level update success.', data);
      setUser((prev) => ({ ...(prev || {}), ...data }));
      return data;
    } catch (error) {
      console.error('UserContext: Level update failed.', error.response?.data?.error || error.message);
      throw error;
    }
  };

  return <UserCtx.Provider value={{ user, login, register, logout, loading, updateLevel }}>{children}</UserCtx.Provider>;
}
