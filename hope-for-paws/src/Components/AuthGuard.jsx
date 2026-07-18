import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthGuardContext = createContext(null);

export function AuthGuardProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((message) => {
    setToast(message);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      setToast(null);
    }, 2800);
  }, []);

  return (
    <AuthGuardContext.Provider value={{ showToast }}>
      {children}
      {visible && toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#6b493d] text-white px-6 py-3 rounded-xl shadow-2xl font-poppins text-sm flex items-center gap-3">
          <span>{toast}</span>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent shrink-0" />
        </div>
      )}
    </AuthGuardContext.Provider>
  );
}

export function useRequireAuth() {
  const { showToast } = useContext(AuthGuardContext);
  const navigate = useNavigate();

  return useCallback((action) => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    if (user) return true;

    showToast(`Please sign in to ${action}.`);
    setTimeout(() => navigate('/signin'), 2800);
    return false;
  }, [showToast, navigate]);
}
