import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  login: (email: string, password?: string) => Promise<UserProfile>;
  register: (email: string, fullName: string, password?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const current = authService.getCurrentUser();
    if (current) {
      setUser(current);
    }
  }, []);

  const login = async (email: string, password?: string): Promise<UserProfile> => {
    const profile = await authService.signIn(email, password);
    setUser(profile);
    return profile;
  };

  const register = async (
    email: string,
    fullName: string,
    password?: string
  ): Promise<UserProfile> => {
    const profile = await authService.signUp(email, fullName, password);
    setUser(profile);
    return profile;
  };

  const logout = async (): Promise<void> => {
    await authService.signOut();
    setUser(null);
  };

  const role = user?.role || 'client';
  const isAuthenticated = Boolean(user);
  const isAdmin = role === 'admin';
  const isClient = role === 'client';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isAdmin,
        isClient,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
