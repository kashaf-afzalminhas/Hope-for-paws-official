import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AUTH_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (token) {
          const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setIsAuthenticated(true);
            } catch (e) {
              console.error('Error parsing stored user:', e);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password, rememberMe = true) => {
    try {
      const response = await axios.post(`${AUTH_BASE_URL}/signin`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      if (rememberMe) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      setUser(user);
      setIsAuthenticated(true);
      window.dispatchEvent(new Event('user-logged-in'));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Save the user next to the token: localStorage for "remember me", sessionStorage otherwise.
  // (Writing to both left a stale user behind after the browser closed and the session token was gone.)
  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    const serialized = JSON.stringify(updatedUserData);
    if (localStorage.getItem('token')) {
      localStorage.setItem('user', serialized);
      sessionStorage.removeItem('user');
    } else if (sessionStorage.getItem('token')) {
      sessionStorage.setItem('user', serialized);
      localStorage.removeItem('user');
    } else {
      sessionStorage.setItem('user', serialized);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated, loading }}>
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
