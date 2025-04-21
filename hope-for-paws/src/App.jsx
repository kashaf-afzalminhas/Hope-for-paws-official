import React, { useState } from 'react';
import Navbar from './Components/Navbar';
import { Outlet } from 'react-router-dom';
import { AUTH_BASE_URL } from './config';

function App() {
  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${AUTH_BASE_URL}/signout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        // Clear all auth-related data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        window.location.href = '/signin';
      } else {
        const errorData = await response.json();
        console.error('Sign out error:', errorData);
        alert('Failed to sign out. Please try again.');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      alert('An error occurred while signing out.');
    }
  };

  return (
    <>
      <Navbar handleSignOut={handleSignOut} />
      <Outlet/>
    </>
  );
}

export default App;
