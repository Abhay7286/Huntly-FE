'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserData, AuthContextType } from '@/types/auth';
import { useRouter } from 'next/navigation';

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on component mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        // Avoid accessing localStorage during SSR
        if (typeof window === 'undefined') return;
        
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('Loading auth state:', { 
          hasToken: !!storedToken, 
          hasUser: !!storedUser 
        });
        
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setToken(storedToken);
            setUser(parsedUser);
            setIsAuthenticated(true);
            
            console.log('Auth state restored from localStorage:', { isAuthenticated: true, user: parsedUser });
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            // Clear potentially corrupted storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Log authentication state changes for debugging
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, user: user?.name });
  }, [isAuthenticated, user]);

  // Login: save user data and token
  const login = (newToken: string, newUser: UserData) => {
    console.log('Login called with user:', newUser.name);
    
    try {
      // Update state
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      console.log('Auth state updated and saved to localStorage');
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  // Logout: clear user data and token
  const logout = () => {
    console.log('Logout called');
    
    try {
      // Update state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      console.log('Auth state cleared');
      
      // Redirect to login page after logout
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Redirect to login page with return URL
  const redirectToLogin = (redirectUrl: string = window.location.pathname) => {
    console.log('Redirecting to login with return URL:', redirectUrl);
    router.push(`/login?callbackUrl=${encodeURIComponent(redirectUrl)}`);
  };

  // Check if user is authenticated and redirect if not
  const checkAuth = (redirectUrl?: string): boolean => {
    if (!isLoading && !isAuthenticated) {
      redirectToLogin(redirectUrl);
      return false;
    }
    return isAuthenticated;
  };

  // Get authentication token for API calls
  const getAuthToken = (): string | null => {
    return token;
  };
  
  // Provide auth context to children
  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        token, 
        isLoading,
        login, 
        logout,
        redirectToLogin,
        checkAuth,
        getAuthToken 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}