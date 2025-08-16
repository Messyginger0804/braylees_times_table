import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const UserCtx = createContext(null);
export const useUser = () => useContext(UserCtx);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/auth/me').then(r => setUser(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const login = async (name, pin) => {
    const { data } = await axios.post('/api/auth/login', { name, pin });
    setUser(data);
  };

  const register = async (name, pin) => {
    const { data } = await axios.post('/api/auth/register', { name, pin });
    setUser(data);
  };

  const logout = async () => {
    await axios.post('/api/auth/logout');
    setUser(null);
  };

  return <UserCtx.Provider value={{ user, login, register, logout, loading }}>{children}</UserCtx.Provider>;
}
