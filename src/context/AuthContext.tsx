import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import type { User, UserRole } from '../types';
import { getDatabase, initializeDatabase } from '../database/db';
import { seedDatabase } from '../database/seed';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isDbReady: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DB_READY'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (name: string, role: UserRole, organization: string, landscape?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_DB_READY':
      return { ...state, isDbReady: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isDbReady: false,
  });

  // Initialize database on mount
  useEffect(() => {
    (async () => {
      try {
        await initializeDatabase();
        await seedDatabase();
        dispatch({ type: 'SET_DB_READY', payload: true });

        // Check for existing user session
        const db = await getDatabase();
        const lastUser = await db.getFirstAsync<User>(
          'SELECT * FROM users ORDER BY id DESC LIMIT 1'
        );
        dispatch({ type: 'SET_USER', payload: lastUser || null });
      } catch (error) {
        console.error('Database initialization failed:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, []);

  const login = useCallback(async (name: string, role: UserRole, organization: string, landscape?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const db = await getDatabase();
      const result = await db.runAsync(
        'INSERT INTO users (name, role, organization, landscape) VALUES (?, ?, ?, ?)',
        [name, role, organization, landscape || null]
      );
      const user: User = {
        id: result.lastInsertRowId,
        name,
        role,
        organization,
        landscape,
      };
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      console.error('Login failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'SET_USER', payload: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
