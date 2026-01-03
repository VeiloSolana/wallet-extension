import { useState, useEffect } from "react";

// Static mock secret phrase for demo purposes
const MOCK_SECRET_PHRASE = [
  "abandon", "ability", "able", "about", "above", "absent",
  "absorb", "abstract", "absurd", "abuse", "access", "accident"
];

interface AuthState {
  isNewUser: boolean;
  isLoggedIn: boolean;
  username: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isNewUser: true,
    isLoggedIn: false,
    username: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check if user exists on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("veilo_user_exists");
      const sessionAuth = sessionStorage.getItem("veilo_session");
      
      setAuthState({
        isNewUser: !storedUser,
        isLoggedIn: !!sessionAuth,
        username: storedUser ? "User" : null,
      });
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Create new account
  const createAccount = (password: string): string[] => {
    // Store that user now exists (static, no real encryption for now)
    localStorage.setItem("veilo_user_exists", "true");
    localStorage.setItem("veilo_password", password); // In production, this would be hashed
    
    // Set session as logged in
    sessionStorage.setItem("veilo_session", "active");
    
    setAuthState({
      isNewUser: false,
      isLoggedIn: true,
      username: "User",
    });

    // Return the phrase for display
    return MOCK_SECRET_PHRASE;
  };

  // Login with password
  const login = (password: string): boolean => {
    const storedPassword = localStorage.getItem("veilo_password");
    
    // For static UI, accept any password if user exists, or check stored password
    if (storedPassword && password === storedPassword) {
      sessionStorage.setItem("veilo_session", "active");
      setAuthState(prev => ({
        ...prev,
        isLoggedIn: true,
      }));
      return true;
    }
    
    // For demo purposes, also accept if password is at least 1 char
    if (password.length > 0) {
      sessionStorage.setItem("veilo_session", "active");
      setAuthState(prev => ({
        ...prev,
        isLoggedIn: true,
      }));
      return true;
    }
    
    return false;
  };

  // Logout (clear session, keep wallet)
  const logout = () => {
    sessionStorage.removeItem("veilo_session");
    setAuthState(prev => ({
      ...prev,
      isLoggedIn: false,
    }));
  };

  // Reset everything (for testing)
  const resetAuth = () => {
    localStorage.removeItem("veilo_user_exists");
    localStorage.removeItem("veilo_password");
    sessionStorage.removeItem("veilo_session");
    setAuthState({
      isNewUser: true,
      isLoggedIn: false,
      username: null,
    });
  };

  return {
    ...authState,
    isLoading,
    createAccount,
    login,
    logout,
    resetAuth,
    secretPhrase: MOCK_SECRET_PHRASE,
  };
};
