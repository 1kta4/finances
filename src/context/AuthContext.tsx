import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { AuthContextType, User } from '../types';
import { supabase, signInWithEmail, signUpWithEmail, signOut as supabaseSignOut } from '../services/supabase';
import { initDatabase } from '../services/storage';
import { processSubscriptions } from '../services/subscriptionManager';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize database first
        await initDatabase();

        // Process any due subscriptions
        await processSubscriptions();
      } catch (error) {
        console.error('Error initializing database:', error);
      }

      // Check current session
      await checkUser();

      // Handle initial deep link (if app was opened from email)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
    });

    // Listen for deep links while app is running
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    try {
      // Parse the URL to extract access_token and refresh_token
      const { queryParams } = Linking.parse(url);

      if (queryParams?.access_token && queryParams?.refresh_token) {
        // Set the session from the tokens in the deep link
        await supabase.auth.setSession({
          access_token: queryParams.access_token as string,
          refresh_token: queryParams.refresh_token as string,
        });
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await signInWithEmail(email, password);
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const data = await signUpWithEmail(email, password);
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signOut = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
