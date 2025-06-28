import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AUTH_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First, check if we have stored user data
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (storedUser && token) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('Found stored user data:', userData);
            
            // Set user immediately from storage
            setUser(userData);
            setIsAuthenticated(true);
            
            // Then validate the token with the server
            try {
              const response = await axios.get(`${AUTH_BASE_URL}/user/validate`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              // Update with fresh user data from server
              setUser(response.data.user);
              setIsAuthenticated(true);
              console.log('Token validated successfully');
            } catch (validationError) {
              console.log('Token validation failed, but user data exists in storage');
              // Keep the stored user data even if validation fails
              // This allows the app to work even if the server is temporarily unavailable
            }
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            // Clear invalid data
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          }
        } else if (token) {
          // Only token exists, try to validate it
          try {
            const response = await axios.get(`${AUTH_BASE_URL}/user/validate`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data.user);
            setIsAuthenticated(true);
          } catch (error) {
            console.log('Token validation failed');
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${AUTH_BASE_URL}/user/signin`, {
        email,
        password
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setIsAuthenticated(true);
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

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
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
