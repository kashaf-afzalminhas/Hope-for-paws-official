import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_BASE_URL}/user/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data.user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/user/signin`, {
        email,
        password
      });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
